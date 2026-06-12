import { Stack } from 'expo-router';
import React from 'react';

export default function PhdSuccessLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: 'PhD Success AE' }} />
      <Stack.Screen name="calendar-metrics" options={{ title: 'Calendar Metrics' }} />
      <Stack.Screen name="booking-stats" options={{ title: 'Booking Stats' }} />
      <Stack.Screen name="availability-settings" options={{ title: 'Availability Settings' }} />
      <Stack.Screen name="set-appointment" options={{ title: 'Set Appointment' }} />
      <Stack.Screen name="grant-sessions" options={{ title: 'Grant Sessions' }} />
      <Stack.Screen name="manage-meetings" options={{ title: 'Manage Meetings' }} />
    </Stack>
  );
}
