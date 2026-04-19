import { TEACHERS, TeacherData } from "@/data/schoolData";

// 🔑 ADMIN MOBILE NUMBERS — Jagruti, Sandhya, Shabnam
export const ADMIN_MOBILES = [
  "9136784197", // Mrs. Jagruti Malwadia
  "9920874815", // Mrs. Sandhya Durgam
  "7666174744", // Mrs. Shabnam Yusuf Ansari
];

const normalize = (m: string) => (m || "").replace(/\D/g, "").replace(/^91/, "").slice(-10);

export const findUserByMobile = (mobile: string): TeacherData | null => {
  const n = normalize(mobile);
  if (!n || n.length !== 10) return null;
  return TEACHERS.find((t) => normalize(t.mobile) === n) || null;
};

export const isAdminMobile = (mobile: string | null | undefined): boolean => {
  if (!mobile) return false;
  return ADMIN_MOBILES.map(normalize).includes(normalize(mobile));
};
