
import { UserRole } from "@/types";

export const licenseLimits: Record<UserRole, number> = {
  'System Super Admin': 1,
  Admin: 1,
  Director: 2,
  Engineer: 5,
};
