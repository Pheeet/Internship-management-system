/**
 * Onboarding Logic Helper
 * -----------------------
 * This file contains the rules for student data completeness.
 */

export const ONBOARDING_ROUTES = {
  PROFILE: "/profile",
  INTERNSHIP: "/internship",
  DASHBOARD: "/student",
};

/**
 * Checks if the core personal profile is complete.
 */
export function isProfileComplete(profile: any): boolean {
  if (!profile) return false;

  const requiredFields = [
    "title",
    "firstName",
    "lastName",
    "gender",
    "dateOfBirth",
    "phone",
    "address",
    "parentPhone",
    "educationLevel",
    "institution",
    "major",
  ];

  return requiredFields.every((field) => {
    const value = profile[field];
    return value && value !== "ไม่ระบุ" && value !== "";
  });
}

/**
 * Checks if the student has at least submitted the internship form once.
 */
export function hasInternshipRecord(profile: any): boolean {
  return !!profile?.internship;
}

/**
 * Determines the next required path for a student.
 * Returns null if they are in a valid state or finished.
 */
export function getRequiredOnboardingPath(profile: any, currentPath: string): string | null {
  // 1. Check Profile Completion
  if (!isProfileComplete(profile)) {
    if (currentPath === ONBOARDING_ROUTES.PROFILE) return null; // Already there
    return `${ONBOARDING_ROUTES.PROFILE}?error=incomplete`;
  }

  // 2. Check Internship Form (Only check existence of record as per user request)
  if (!hasInternshipRecord(profile)) {
    if (currentPath === ONBOARDING_ROUTES.INTERNSHIP) return null; // Already there
    // If they are on /profile, it's fine, they'll be redirected after saving.
    // If they try to go to /student, kick them to /internship.
    if (currentPath === ONBOARDING_ROUTES.DASHBOARD) {
        return `${ONBOARDING_ROUTES.INTERNSHIP}?error=incomplete`;
    }
    return null; // Let them be on /profile if they want
  }

  return null;
}
