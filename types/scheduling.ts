export type SchedulingAppSource = 'phd-success' | 'rise';

export interface SchedulingEvent {
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

export type SchedulingInviteType = 'paid' | 'free';

export interface SchedulingInvite {
  id: string;
  email: string;
  type: SchedulingInviteType;
  expiresAt: string | null;
  usedAt: string | null;
  createdAt: string;
  shareUrl: string;
  status: 'active' | 'used' | 'expired' | 'not_found';
}

export interface SchedulingInviteResponse {
  invite: SchedulingInvite;
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
