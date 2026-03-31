import { TaskAssetBadge } from '@/components/task-asset-badge';
import { TaskAssigneeBadge } from '@/components/task-assignee-badge';
import { TaskStatusPill } from '@/components/task-status-pill';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Task, TaskStatus } from '@/types/tasks';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useMemo, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { RectButton, Swipeable } from 'react-native-gesture-handler';

type Props = {
  task: Task;
  onPress: (taskId: string) => void;
  onSetStatus: (taskId: string, status: TaskStatus) => void;
  onDelete: (taskId: string) => void;
};

type StatusAction = {
  label: TaskStatus;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
};

const ACTIONS: StatusAction[] = [
  { label: 'Todo', icon: 'radio-button-unchecked' },
  { label: 'In Progress', icon: 'autorenew' },
  { label: 'Done', icon: 'check-circle' },
];

export function TaskListItem({ task, onPress, onSetStatus, onDelete }: Props) {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];
  const swipeableRef = useRef<Swipeable | null>(null);

  const leftActions = useMemo(() => {
    return (
      <View style={styles.leftActionsWrap}>
        <RectButton
          style={[styles.deleteAction, { backgroundColor: colors.errorMuted, borderColor: colors.error }]}
          onPress={() => {
            onDelete(task.id);
            swipeableRef.current?.close();
          }}>
          <MaterialIcons name="delete" size={16} color={colors.errorText} />
          <ThemedText style={[styles.deleteText, { color: colors.errorText }]}>Delete</ThemedText>
        </RectButton>
      </View>
    );
  }, [colors.errorMuted, colors.error, colors.errorText, onDelete, task.id]);

  const rightActions = useMemo(() => {
    return (
      <View style={styles.actionsRow}>
        {ACTIONS.map((a) => {
          const isActive = task.status === a.label;
          const backgroundColor =
            a.label === 'Done'
              ? colors.successMuted
              : a.label === 'In Progress'
                ? colors.buttonHover
                : colors.buttonSecondary;
          const iconColor =
            a.label === 'Done'
              ? colors.successText
              : a.label === 'In Progress'
                ? colors.text
                : colors.text;

          return (
            <RectButton
              key={a.label}
              style={[
                styles.action,
                {
                  backgroundColor,
                  borderColor: colors.border,
                  opacity: isActive ? 0.65 : 1,
                },
              ]}
              onPress={() => {
                onSetStatus(task.id, a.label);
                swipeableRef.current?.close();
              }}>
              <MaterialIcons name={a.icon} size={16} color={iconColor} />
              <ThemedText style={styles.actionText}>{a.label}</ThemedText>
            </RectButton>
          );
        })}
      </View>
    );
  }, [colors, onSetStatus, task.id, task.status]);

  return (
    <Swipeable
      ref={swipeableRef}
      renderLeftActions={() => leftActions}
      renderRightActions={() => rightActions}
      overshootLeft={false}
      overshootRight={false}>
      <Pressable
        onPress={() => onPress(task.id)}
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}>
        <View style={styles.topRow}>
          <ThemedText type="defaultSemiBold" numberOfLines={2} style={styles.title}>
            {task.title}
          </ThemedText>
          <TaskStatusPill status={task.status} />
        </View>
        <View style={styles.bottomRow}>
          <View style={styles.tagsRow}>
            <TaskAssetBadge asset={task.asset} />
            <TaskAssigneeBadge assignedTo={task.assignedTo} />
          </View>
          <ThemedText style={styles.hintText}>Swipe for status</ThemedText>
        </View>
      </Pressable>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  title: {
    flex: 1,
    fontSize: 16,
    lineHeight: 21,
  },
  bottomRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  hintText: {
    fontSize: 12,
    opacity: 0.6,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 6,
    paddingRight: 6,
  },
  action: {
    width: 82,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    gap: 4,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '700',
  },
  leftActionsWrap: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingLeft: 8,
  },
  deleteAction: {
    width: 96,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    gap: 4,
  },
  deleteText: {
    fontSize: 11,
    fontWeight: '800',
  },
});

