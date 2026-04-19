import { supabase } from "@/integrations/supabase/client";

export interface AuthLookup {
  name: string;
  mobile: string;
  isAdmin: boolean;
}

const normalize = (m: string) =>
  (m || "").replace(/\D/g, "").replace(/^91/, "").slice(-10);

/**
 * Look up a mobile number in the Cloud database.
 * Returns the user (with admin flag) if found in either `admins` or `teachers`.
 * Returns null if the mobile is not registered.
 */
export const lookupUserByMobile = async (
  mobile: string
): Promise<AuthLookup | null> => {
  const n = normalize(mobile);
  if (!n || n.length !== 10) return null;

  // Check admins first (admin trumps teacher)
  const { data: admins } = await supabase
    .from("admins")
    .select("name, mobile");

  const adminMatch = admins?.find((a) => normalize(a.mobile) === n);
  if (adminMatch) {
    return { name: adminMatch.name, mobile: n, isAdmin: true };
  }

  const { data: teachers } = await supabase
    .from("teachers")
    .select("name, mobile");

  const teacherMatch = teachers?.find((t) => normalize(t.mobile) === n);
  if (teacherMatch) {
    return { name: teacherMatch.name, mobile: n, isAdmin: false };
  }

  return null;
};
