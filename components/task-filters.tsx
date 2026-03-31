import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { TaskAssignee, TaskAsset, TaskStatus, TASK_ASSIGNEES, TASK_ASSETS, TASK_STATUSES } from '@/types/tasks';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

type Props = {
  selectedAsset: TaskAsset | null;
  onSelectAsset: (value: TaskAsset | null) => void;
  selectedAssignee: TaskAssignee | null;
  onSelectAssignee: (value: TaskAssignee | null) => void;
  selectedStatus: TaskStatus | null;
  onSelectStatus: (value: TaskStatus | null) => void;
};

function Chip({
  label,
  selected,
  onPress,
  colors,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  colors: (typeof Colors)['light'] | (typeof Colors)['dark'];
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? colors.tint : colors.buttonSecondary,
          borderColor: selected ? colors.tint : colors.border,
          opacity: pressed ? 0.9 : 1,
        },
      ]}>
      <ThemedText
        style={[
          styles.chipText,
          {
            color: selected ? colors.tintText : colors.buttonSecondaryText,
          },
        ]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

export function TaskFilters({
  selectedAsset,
  onSelectAsset,
  selectedAssignee,
  onSelectAssignee,
  selectedStatus,
  onSelectStatus,
}: Props) {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];

  const assetChips = useMemo(() => {
    return [
      { label: 'All', value: null as TaskAsset | null },
      ...TASK_ASSETS.map((a) => ({ label: a, value: a })),
    ];
  }, []);

  const assigneeChips = useMemo(() => {
    return [
      { label: 'All', value: null as TaskAssignee | null },
      ...TASK_ASSIGNEES.map((a) => ({ label: a, value: a })),
    ];
  }, []);

  const statusChips = useMemo(() => {
    return [
      { label: 'All', value: null as TaskStatus | null },
      ...TASK_STATUSES.map((s) => ({ label: s, value: s })),
    ];
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.group}>
        <ThemedText style={styles.groupLabel}>Asset</ThemedText>
        <View style={styles.chipsRow}>
          {assetChips.map((c) => (
            <Chip
              key={c.label}
              label={c.label}
              selected={selectedAsset === c.value}
              onPress={() => onSelectAsset(c.value)}
              colors={colors}
            />
          ))}
        </View>
      </View>

      <View style={styles.group}>
        <ThemedText style={styles.groupLabel}>Assigned To</ThemedText>
        <View style={styles.chipsRow}>
          {assigneeChips.map((c) => (
            <Chip
              key={c.label}
              label={c.label}
              selected={selectedAssignee === c.value}
              onPress={() => onSelectAssignee(c.value)}
              colors={colors}
            />
          ))}
        </View>
      </View>

      <View style={[styles.group, { marginBottom: 0 }]}>
        <ThemedText style={styles.groupLabel}>Status</ThemedText>
        <View style={styles.chipsRow}>
          {statusChips.map((c) => (
            <Chip
              key={c.label}
              label={c.label}
              selected={selectedStatus === c.value}
              onPress={() => onSelectStatus(c.value)}
              colors={colors}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 6,
  },
  group: {
    marginBottom: 8,
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: '800',
    opacity: 0.72,
    marginBottom: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '800',
  },
});

