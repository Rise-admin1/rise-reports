import type { VolunteerRoleFilter } from '@/types/reports';

/** PDF document title for a volunteer export by role filter. */
export function volunteerPdfDocumentTitle(filter: VolunteerRoleFilter): string {
  if (filter === 'ALL') return 'Funyula volunteers';
  return `Funyula volunteers — ${volunteerPdfFilterDescription(filter)}`;
}

/** Short label for PDF meta line (filter description). */
export function volunteerPdfFilterDescription(filter: VolunteerRoleFilter): string {
  switch (filter) {
    case 'ALL':
      return 'All roles';
    case 'POLLING_AGENT':
      return 'Polling Agent';
    case 'BLOGGING_TEAM':
      return 'Blogging Team';
    case 'VOTER':
      return 'Voter';
  }
}

/** Human-readable labels for Prisma VolunteerRole / Gender enums from the API. */
export function formatVolunteerRole(role: string | undefined): string {
  switch (role) {
    case 'POLLING_AGENT':
      return 'Polling Agent';
    case 'BLOGGING_TEAM':
      return 'Blogging Team';
    case 'VOTER':
      return 'Voter';
    default:
      return role?.replace(/_/g, ' ') ?? '—';
  }
}

export function formatVolunteerGender(gender: string | undefined): string {
  switch (gender) {
    case 'MALE':
      return 'Male';
    case 'FEMALE':
      return 'Female';
    default:
      return gender ?? '—';
  }
}
