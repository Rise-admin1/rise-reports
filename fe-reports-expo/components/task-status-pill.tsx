import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { TaskStatus } from '@/types/tasks';
import React from 'react';
import { StyleSheet, View } from 'react-native';

type Props = {
  status: TaskStatus;
};

function getStatusStyles(
  status: TaskStatus,
  colors: (typeof Colors)['light'] | (typeof Colors)['dark']
) {
  switch (status) {
    case 'Done':
      return {
        backgroundColor: colors.successMuted,
        borderColor: colors.successMuted,
        textColor: colors.successText,
      };
    case 'In Progress':
      return {
        backgroundColor: colors.buttonHover,
        borderColor: colors.border,
        textColor: colors.text,
      };
    case 'Todo':
    default:
      return {
        backgroundColor: colors.buttonSecondary,
        borderColor: colors.border,
        textColor: colors.text,
      };
  }
}

export function TaskStatusPill({ status }: Props) {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];
  const s = getStatusStyles(status, colors);

  return (
    <View style={[styles.pill, { backgroundColor: s.backgroundColor, borderColor: s.borderColor }]}>
      <ThemedText style={[styles.text, { color: s.textColor }]}>{status}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

