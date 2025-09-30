
import { UserRole } from "@/types";

export const licenseLimits: Record<UserRole, number> = {
  Admin: 1,
  Director: 2,
  Engineer: 5,
};
