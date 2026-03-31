import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { TaskAssignee } from '@/types/tasks';
import React from 'react';
import { StyleSheet, View } from 'react-native';

type Props = {
  assignedTo: TaskAssignee;
};

export function TaskAssigneeBadge({ assignedTo }: Props) {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];

  return (
    <View style={[styles.badge, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <ThemedText style={styles.text}>{assignedTo}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    opacity: 0.85,
  },
});

