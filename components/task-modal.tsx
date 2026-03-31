import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  TASK_ASSETS,
  TASK_ASSIGNEES,
  TASK_STATUSES,
  TaskAsset,
  TaskAssignee,
  TaskStatus,
} from '@/types/tasks';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

type Draft = {
  title: string;
  description: string;
  asset: TaskAsset | null;
  assignedTo: TaskAssignee | null;
  status: TaskStatus | null;
};

type SubmitValue = {
  title: string;
  description?: string;
  asset: TaskAsset;
  assignedTo: TaskAssignee;
  status: TaskStatus;
};

type Props = {
  visible: boolean;
  mode: 'create' | 'edit';
  initialValue: Draft;
  onClose: () => void;
  onSubmit: (value: SubmitValue) => void;
  apiError?: string | null;
};

export function TaskModal({ visible, mode, initialValue, onClose, onSubmit, apiError = null }: Props) {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];

  const [title, setTitle] = useState(initialValue.title);
  const [description, setDescription] = useState(initialValue.description);
  const [asset, setAsset] = useState<TaskAsset | null>(initialValue.asset);
  const [assignedTo, setAssignedTo] = useState<TaskAssignee | null>(initialValue.assignedTo);
  const [status, setStatus] = useState<TaskStatus | null>(initialValue.status);

  const [openDropdown, setOpenDropdown] = useState<'asset' | 'assignedTo' | 'status' | null>(null);

  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    setTitle(initialValue.title);
    setDescription(initialValue.description);
    setAsset(initialValue.asset);
    setAssignedTo(initialValue.assignedTo);
    setStatus(initialValue.status);
    setShowErrors(false);
    setOpenDropdown(null);
  }, [initialValue]);

  useEffect(() => {
    if (!visible) setOpenDropdown(null);
  }, [visible]);

  const titleTrimmed = title.trim();
  const canSubmit = titleTrimmed.length > 0 && asset !== null && assignedTo !== null && status !== null;

  const primaryLabel = mode === 'create' ? 'Create Task' : 'Save Changes';

  const submit = () => {
    setShowErrors(true);
    if (!canSubmit || asset === null || assignedTo === null || status === null) return;
    onSubmit({
      title: titleTrimmed,
      description: description.trim() === '' ? undefined : description.trim(),
      asset,
      assignedTo,
      status,
    });
  };

  const errorText = useMemo(() => {
    if (!showErrors) return null;
    if (titleTrimmed.length === 0) return 'Title is required.';
    if (!asset) return 'Asset is required.';
    if (!assignedTo) return 'Assigned To is required.';
    if (!status) return 'Status is required.';
    return null;
  }, [asset, assignedTo, showErrors, status, titleTrimmed.length]);

  const displayErrorText = errorText ?? apiError;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={styles.backdrop} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.center}>
        <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.headerRow}>
            <ThemedText type="subtitle">{mode === 'create' ? 'New task' : 'Task details'}</ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              style={({ pressed }) => [styles.iconButton, { opacity: pressed ? 0.6 : 1 }]}>
              <MaterialIcons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <View style={styles.field}>
              <ThemedText style={styles.label}>Title</ThemedText>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Short title"
                placeholderTextColor={colors.icon}
                style={[
                  styles.input,
                  { borderColor: colors.border, color: colors.text, backgroundColor: colors.background },
                ]}
              />
            </View>

            <View style={styles.field}>
              <ThemedText style={styles.label}>Description</ThemedText>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Optional details"
                placeholderTextColor={colors.icon}
                multiline
                style={[
                  styles.input,
                  styles.textArea,
                  { borderColor: colors.border, color: colors.text, backgroundColor: colors.background },
                ]}
              />
            </View>

            <View style={styles.field}>
              <ThemedText style={styles.label}>Asset</ThemedText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Select asset"
                onPress={() => setOpenDropdown((d) => (d === 'asset' ? null : 'asset'))}
                style={({ pressed }) => [
                  styles.dropdownTrigger,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}>
                <ThemedText
                  style={[
                    styles.dropdownTriggerText,
                    { color: asset ? colors.text : colors.icon, opacity: asset ? 1 : 0.7 },
                  ]}>
                  {asset ?? 'Select asset'}
                </ThemedText>
                <MaterialIcons
                  name={openDropdown === 'asset' ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                  size={20}
                  color={colors.icon}
                />
              </Pressable>

              {openDropdown === 'asset' && (
                <View
                  style={[
                    styles.dropdownList,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                    },
                  ]}>
                  <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                    {TASK_ASSETS.map((a) => {
                      const selected = asset === a;
                      return (
                        <Pressable
                          key={a}
                          onPress={() => {
                            setAsset(a);
                            setOpenDropdown(null);
                          }}
                          style={({ pressed }) => [
                            styles.dropdownItem,
                            {
                              borderBottomColor: colors.border,
                              backgroundColor: selected ? colors.tint : colors.background,
                              opacity: pressed ? 0.9 : 1,
                            },
                          ]}>
                          <ThemedText
                            style={[
                              styles.dropdownItemText,
                              { color: selected ? colors.tintText : colors.text },
                            ]}>
                            {a}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </View>

            <View style={styles.field}>
              <ThemedText style={styles.label}>Assigned To</ThemedText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Select assigned person"
                onPress={() => setOpenDropdown((d) => (d === 'assignedTo' ? null : 'assignedTo'))}
                style={({ pressed }) => [
                  styles.dropdownTrigger,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}>
                <ThemedText
                  style={[
                    styles.dropdownTriggerText,
                    { color: assignedTo ? colors.text : colors.icon, opacity: assignedTo ? 1 : 0.7 },
                  ]}>
                  {assignedTo ?? 'Select assignee'}
                </ThemedText>
                <MaterialIcons
                  name={openDropdown === 'assignedTo' ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                  size={20}
                  color={colors.icon}
                />
              </Pressable>

              {openDropdown === 'assignedTo' && (
                <View
                  style={[
                    styles.dropdownList,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                    },
                  ]}>
                  <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                    {TASK_ASSIGNEES.map((a) => {
                      const selected = assignedTo === a;
                      return (
                        <Pressable
                          key={a}
                          onPress={() => {
                            setAssignedTo(a);
                            setOpenDropdown(null);
                          }}
                          style={({ pressed }) => [
                            styles.dropdownItem,
                            {
                              borderBottomColor: colors.border,
                              backgroundColor: selected ? colors.tint : colors.background,
                              opacity: pressed ? 0.9 : 1,
                            },
                          ]}>
                          <ThemedText
                            style={[
                              styles.dropdownItemText,
                              { color: selected ? colors.tintText : colors.text },
                            ]}>
                            {a}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </View>

            <View style={styles.field}>
              <ThemedText style={styles.label}>Status</ThemedText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Select task status"
                onPress={() => setOpenDropdown((d) => (d === 'status' ? null : 'status'))}
                style={({ pressed }) => [
                  styles.dropdownTrigger,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}>
                <ThemedText
                  style={[
                    styles.dropdownTriggerText,
                    { color: status ? colors.text : colors.icon, opacity: status ? 1 : 0.7 },
                  ]}>
                  {status ?? 'Select status'}
                </ThemedText>
                <MaterialIcons
                  name={openDropdown === 'status' ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                  size={20}
                  color={colors.icon}
                />
              </Pressable>

              {openDropdown === 'status' && (
                <View
                  style={[
                    styles.dropdownList,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                    },
                  ]}>
                  <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                    {TASK_STATUSES.map((s) => {
                      const selected = status === s;
                      return (
                        <Pressable
                          key={s}
                          onPress={() => {
                            setStatus(s);
                            setOpenDropdown(null);
                          }}
                          style={({ pressed }) => [
                            styles.dropdownItem,
                            {
                              borderBottomColor: colors.border,
                              backgroundColor: selected ? colors.tint : colors.background,
                              opacity: pressed ? 0.9 : 1,
                            },
                          ]}>
                          <ThemedText
                            style={[
                              styles.dropdownItemText,
                              { color: selected ? colors.tintText : colors.text },
                            ]}>
                            {s}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </View>

            {displayErrorText && (
              <View style={[styles.errorRow, { backgroundColor: colors.errorMuted, borderColor: colors.error }]}>
                <MaterialIcons name="error-outline" size={18} color={colors.errorText} />
                <ThemedText style={[styles.errorText, { color: colors.errorText }]}>{displayErrorText}</ThemedText>
              </View>
            )}

            <View style={styles.footerRow}>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  { backgroundColor: colors.buttonSecondary, borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
                ]}>
                <ThemedText style={[styles.secondaryButtonText, { color: colors.buttonSecondaryText }]}>
                  Cancel
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={submit}
                style={({ pressed }) => [
                  styles.primaryButton,
                  { backgroundColor: colors.tint, opacity: pressed ? 0.9 : 1 },
                ]}>
                <ThemedText style={[styles.primaryButtonText, { color: colors.tintText }]}>
                  {primaryLabel}
                </ThemedText>
              </Pressable>
            </View>
          </ScrollView>
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
    padding: 16,
  },
  sheet: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
    maxHeight: '85%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 14,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    opacity: 0.75,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  textArea: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  dropdownTrigger: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownTriggerText: {
    fontSize: 16,
    fontWeight: '700',
  },
  dropdownList: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
    maxHeight: 220,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: '800',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '800',
  },
  primaryButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '800',
  },
});

