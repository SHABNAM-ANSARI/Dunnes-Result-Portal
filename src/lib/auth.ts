// 🔑 ADMIN EMAIL — change this to your email to get full admin access
export const ADMIN_EMAIL = "shabnamsayyed6@gmail.com";

export const isAdmin = (email: string | null | undefined): boolean => {
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL.trim().toLowerCase();
};
