/**
 * Role Definitions & Navigation Helpers for Rwanda Hospital Network
 */

export const ROLE_DEFINITIONS = {
  admin: {
    label: "Hospital Administrator",
    shortLabel: "Admin",
    color: "error",
    dashboardPath: "/admin/dashboard",
  },
  doctor: {
    label: "Medical Doctor / Specialist",
    shortLabel: "Doctor",
    color: "secondary",
    dashboardPath: "/doctor/dashboard",
  },
  patient: {
    label: "Registered Patient",
    shortLabel: "Patient",
    color: "primary",
    dashboardPath: "/patient/dashboard",
  },
  lab_technician: {
    label: "Laboratory Technician",
    shortLabel: "Lab Tech",
    color: "info",
    dashboardPath: "/lab/dashboard",
  },
  pharmacist: {
    label: "Pharmacy Dispenser",
    shortLabel: "Pharmacist",
    color: "success",
    dashboardPath: "/pharmacy/dashboard",
  },
  billing_officer: {
    label: "Revenue & Billing Officer",
    shortLabel: "Billing Officer",
    color: "warning",
    dashboardPath: "/billing/dashboard",
  },
};

/**
 * Resolve the primary dashboard route for any user role.
 *
 * @param {string} role - The user's role key.
 * @returns {string} The dashboard route path.
 */
export const getRoleDashboardPath = (role) => {
  if (!role) return "/login";
  return ROLE_DEFINITIONS[role]?.dashboardPath || "/login";
};

/**
 * Get readable role label.
 *
 * @param {string} role
 * @returns {string}
 */
export const getRoleLabel = (role) => {
  if (!role) return "User";
  return ROLE_DEFINITIONS[role]?.shortLabel || role;
};

/**
 * Get badge color for role chip.
 *
 * @param {string} role
 * @returns {string}
 */
export const getRoleColor = (role) => {
  if (!role) return "default";
  return ROLE_DEFINITIONS[role]?.color || "default";
};

export default {
  ROLE_DEFINITIONS,
  getRoleDashboardPath,
  getRoleLabel,
  getRoleColor,
};
