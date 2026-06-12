export type SchedulingAppSource = 'phd-success' | 'rise';

export interface SchedulingEvent {
  id: string;
  name: string;
  email: string;
  startTime: string;
  endTime: string;
  meetLink: string | null;
}

export interface SchedulingMetricsPaginationSlice {
  offset: number;
  totalCount: number;
  hasMore: boolean;
}

export interface SchedulingMetricsResponse {
  completedEvents: SchedulingEvent[];
  upcomingEvents: SchedulingEvent[];
  pagination: {
    limit: number;
    completed: SchedulingMetricsPaginationSlice;
    upcoming: SchedulingMetricsPaginationSlice;
  };
}

export interface SchedulingBookingStatsResponse {
  email: string;
  name: string | null;
  totalBookings: number;
  totalHours: number;
  completedBookings: number;
  completedHours: number;
  upcomingBookings: number;
  upcomingHours: number;
  packageSessionsTotal: number;
  packageSessionsUsed: number;
  packageSessionsLeft: number;
  firstBookingAt: string | null;
  lastBookingAt: string | null;
  lastCompletedMeeting: {
    startTime: string;
    endTime: string;
  } | null;
}

export interface SchedulingAvailabilitySetting {
  id: string;
  dayOfWeek: number;
  dayName: string;
  startTime: string;
  endTime: string;
}

export interface SchedulingAvailabilitySettingsResponse {
  availability: SchedulingAvailabilitySetting[];
}

export interface SchedulingAvailabilitySettingResponse {
  availability: SchedulingAvailabilitySetting;
}

export type AvailabilitySettingInput = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

export type SchedulingInviteType = 'paid' | 'free' | 'package';

export interface SchedulingInvite {
  id: string;
  email: string;
  type: SchedulingInviteType;
  expiresAt: string | null;
  usedAt: string | null;
  createdAt: string;
  shareUrl: string;
  status: 'active' | 'used' | 'expired' | 'not_found';
  remainingSessions?: number;
}

export interface SchedulingSessionCredit {
  id: string;
  email: string;
  appSource: SchedulingAppSource;
  totalSessions: number;
  usedSessions: number;
  remainingSessions: number;
  notes: string | null;
  inviteId: string | null;
  shareUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GrantSessionCreditsResponse {
  credit: SchedulingSessionCredit;
  invite: SchedulingInvite;
  emailSent: boolean;
  emailSkipped: boolean;
}

export interface SessionCreditListItem {
  email: string;
  totalSessions: number;
  usedSessions: number;
  remainingSessions: number;
}

export interface SessionCreditsListResponse {
  credits: SessionCreditListItem[];
}

export interface SessionCreditsResponse {
  credit: SchedulingSessionCredit;
  invite: SchedulingInvite | null;
  recentUsages: Array<{
    id: string;
    bookingId: string;
    createdAt: string;
    booking: {
      id: string;
      startTime: string;
      endTime: string;
      status: string;
    } | null;
  }>;
}

export interface SchedulingInviteResponse {
  invite: SchedulingInvite;
  usedPackageCredit?: boolean;
}

export interface SchedulingMeeting {
  id: string;
  name: string;
  email: string;
  startTime: string;
  endTime: string;
  meetLink: string | null;
  googleEventId: string | null;
  availabilityId: string;
  status: string;
}

export interface SchedulingMeetingsResponse {
  meetings: SchedulingMeeting[];
  pagination: {
    offset: number;
    limit: number;
    totalCount: number;
    hasMore: boolean;
  };
}

export interface SchedulingMeetingResponse {
  meeting: SchedulingMeeting;
}
