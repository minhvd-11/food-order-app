// Shared by client components and API routes, so keep this file free of
// server-only imports.

/** Accounts allowed to close ("chốt đơn") / reopen today's ordering. */
export const ORDER_ADMIN_EMAILS = ["minh.vd@teko.vn"];

export function isOrderAdmin(email?: string | null): boolean {
  return !!email && ORDER_ADMIN_EMAILS.includes(email);
}
