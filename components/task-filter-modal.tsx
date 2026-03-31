import { ThemedText } from '@/components/themed-text';
import { TaskFilters } from '@/components/task-filters';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { TaskAssignee, TaskAsset, TaskStatus } from '@/types/tasks';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { KeyboardAvoidingView, Modal, Pressable, StyleSheet, View } from 'react-native';

type Props = {
  visible: boolean;
  selectedAsset: TaskAsset | null;
  onSelectAsset: (value: TaskAsset | null) => void;
  selectedAssignee: TaskAssignee | null;
  onSelectAssignee: (value: TaskAssignee | null) => void;
  selectedStatus: TaskStatus | null;
  onSelectStatus: (value: TaskStatus | null) => void;
  onClose: () => void;
};

export function TaskFilterModal({
  visible,
  selectedAsset,
  onSelectAsset,
  selectedAssignee,
  onSelectAssignee,
  selectedStatus,
  onSelectStatus,
  onClose,
}: Props) {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <KeyboardAvoidingView behavior="padding" style={styles.center}>
        <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.headerRow}>
            <ThemedText type="subtitle" style={styles.title}>
              Filters
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close filters"
              onPress={onClose}
              style={({ pressed }) => [styles.iconButton, { opacity: pressed ? 0.7 : 1 }]}>
              <MaterialIcons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>

          <TaskFilters
            selectedAsset={selectedAsset}
            onSelectAsset={onSelectAsset}
            selectedAssignee={selectedAssignee}
            onSelectAssignee={onSelectAssignee}
            selectedStatus={selectedStatus}
            onSelectStatus={onSelectStatus}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    opacity: 0.35,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    padding: 14,
  },
  sheet: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 10,
    maxHeight: '85%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  title: {
    fontSize: 18,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

