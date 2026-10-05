import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useThemePreference } from '@/context/theme-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  createAvailabilitySetting,
  deleteAvailabilitySetting,
  fetchAvailabilitySettings,
  updateAvailabilitySetting,
} from '@/services/api';
import type { AvailabilitySettingInput, SchedulingAvailabilitySetting } from '@/types/scheduling';
import {
  formatAvailabilityLocal,
  getLocalAvailabilityDayName,
  getLocalTimezoneLabel,
  localAvailabilityToUtc,
  utcAvailabilityToLocalForm,
  validateAvailabilityFormLocal,
} from '@/utils/availabilityTimezone';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DAYS = [
  { value: 0, label: 'Sun', full: 'Sunday' },
  { value: 1, label: 'Mon', full: 'Monday' },
  { value: 2, label: 'Tue', full: 'Tuesday' },
  { value: 3, label: 'Wed', full: 'Wednesday' },
  { value: 4, label: 'Thu', full: 'Thursday' },
  { value: 5, label: 'Fri', full: 'Friday' },
  { value: 6, label: 'Sat', full: 'Saturday' },
];

const EMPTY_FORM: AvailabilitySettingInput = {
  dayOfWeek: 3,
  startTime: '09:00',
  endTime: '17:00',
};

function AvailabilityForm({
  value,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
  saving,
  colors,
  cardBackground,
  borderColor,
  timezoneLabel,
}: {
  value: AvailabilitySettingInput;
  onChange: (next: AvailabilitySettingInput) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  submitLabel: string;
  saving: boolean;
  colors: (typeof Colors)['light'];
  cardBackground: string;
  borderColor: string;
  timezoneLabel: string;
}) {
  return (
    <View style={[styles.formCard, { backgroundColor: cardBackground, borderColor }]}>
      <ThemedText type="defaultSemiBold" style={styles.formLabel}>
        Day of week
      </ThemedText>
      <View style={styles.dayRow}>
        {DAYS.map((day) => {
          const selected = value.dayOfWeek === day.value;
          return (
            <TouchableOpacity
              key={day.value}
              style={[
                styles.dayChip,
                {
                  borderColor: selected ? colors.tint : borderColor,
                  backgroundColor: selected ? colors.buttonSecondary : cardBackground,
                },
              ]}
              onPress={() => onChange({ ...value, dayOfWeek: day.value })}
              accessibilityLabel={`Select ${day.full}`}>
              <ThemedText
                style={[
                  styles.dayChipText,
                  selected && { color: colors.tint, fontWeight: '700' },
                ]}>
                {day.label}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </View>

      <ThemedText type="defaultSemiBold" style={styles.formLabel}>
        Start time ({timezoneLabel})
      </ThemedText>
      <TextInput
        value={value.startTime}
        onChangeText={(startTime) => onChange({ ...value, startTime })}
        placeholder="09:00"
        placeholderTextColor={colors.icon}
        autoCapitalize="none"
        autoCorrect={false}
        style={[styles.input, { color: colors.text, borderColor, backgroundColor: colors.background }]}
      />
      <ThemedText style={styles.formHint}>Hourly slots only — use :00 minutes (e.g. 09:00)</ThemedText>

      <ThemedText type="defaultSemiBold" style={styles.formLabel}>
        End time ({timezoneLabel})
      </ThemedText>
      <TextInput
        value={value.endTime}
        onChangeText={(endTime) => onChange({ ...value, endTime })}
        placeholder="17:00"
        placeholderTextColor={colors.icon}
        autoCapitalize="none"
        autoCorrect={false}
        style={[styles.input, { color: colors.text, borderColor, backgroundColor: colors.background }]}
      />
      <ThemedText style={styles.formHint}>Must be after start time, on the hour (:00)</ThemedText>

      <View style={styles.formActions}>
        {onCancel ? (
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor }]}
            onPress={onCancel}
            disabled={saving}
            accessibilityLabel="Cancel">
            <ThemedText style={styles.secondaryButtonText}>Cancel</ThemedText>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.tint, opacity: saving ? 0.7 : 1 }]}
          onPress={onSubmit}
          disabled={saving}
          accessibilityLabel={submitLabel}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.primaryButtonText}>{submitLabel}</ThemedText>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AvailabilityRow({
  item,
  isEditing,
  formValue,
  onEdit,
  onDelete,
  onCancelEdit,
  onFormChange,
  onSave,
  saving,
  deleting,
  colors,
  cardBackground,
  borderColor,
  timezoneLabel,
}: {
  item: SchedulingAvailabilitySetting;
  isEditing: boolean;
  formValue: AvailabilitySettingInput;
  onEdit: () => void;
  onDelete: () => void;
  onCancelEdit: () => void;
  onFormChange: (next: AvailabilitySettingInput) => void;
  onSave: () => void;
  saving: boolean;
  deleting: boolean;
  colors: (typeof Colors)['light'];
  cardBackground: string;
  borderColor: string;
  timezoneLabel: string;
}) {
  const localDayName = getLocalAvailabilityDayName(item.dayOfWeek, item.startTime) || item.dayName;
  const localTimeLabel = formatAvailabilityLocal(item.dayOfWeek, item.startTime, item.endTime);

  if (isEditing) {
    return (
      <AvailabilityForm
        value={formValue}
        onChange={onFormChange}
        onSubmit={onSave}
        onCancel={onCancelEdit}
        submitLabel="Save changes"
        saving={saving}
        colors={colors}
        cardBackground={cardBackground}
        borderColor={borderColor}
        timezoneLabel={timezoneLabel}
      />
    );
  }

  return (
    <View style={[styles.rowCard, { backgroundColor: cardBackground, borderColor }]}>
      <View style={styles.rowHeader}>
        <View style={[styles.dayBadge, { backgroundColor: colors.buttonSecondary, borderColor }]}>
          <ThemedText style={[styles.dayBadgeText, { color: colors.tint }]}>{localDayName}</ThemedText>
        </View>
        <View style={styles.rowActions}>
          <TouchableOpacity
            onPress={onEdit}
            style={[styles.editButton, { borderColor }]}
            disabled={deleting}
            accessibilityLabel={`Edit ${item.dayName} availability`}>
            <MaterialIcons name="edit" size={18} color={colors.tint} />
            <ThemedText style={[styles.editButtonText, { color: colors.tint }]}>Edit</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onDelete}
            style={[styles.deleteButton, { borderColor: colors.error, opacity: deleting ? 0.6 : 1 }]}
            disabled={deleting}
            accessibilityLabel={`Delete ${item.dayName} availability`}>
            {deleting ? (
              <ActivityIndicator size="small" color={colors.errorText} />
            ) : (
              <>
                <MaterialIcons name="delete-outline" size={18} color={colors.errorText} />
                <ThemedText style={[styles.deleteButtonText, { color: colors.errorText }]}>Delete</ThemedText>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.timeRow}>
        <MaterialIcons name="schedule" size={18} color={colors.icon} />
        <ThemedText type="defaultSemiBold" style={styles.timeText}>
          {localTimeLabel}
        </ThemedText>
      </View>
      <ThemedText style={styles.timezoneHint}>{timezoneLabel}</ThemedText>
    </View>
  );
}

export default function AvailabilitySettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { toggleTheme } = useThemePreference();
  const colors = Colors[colorScheme ?? 'light'];
  const backgroundColor = colors.background;
  const cardBackground = colors.card;
  const borderColor = colors.border;
  const timezoneLabel = getLocalTimezoneLabel();

  const [settings, setSettings] = useState<SchedulingAvailabilitySetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<AvailabilitySettingInput>(EMPTY_FORM);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState<AvailabilitySettingInput>(EMPTY_FORM);

  const loadSettings = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await fetchAvailabilitySettings();
      setSettings(data.availability);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load availability settings');
      setSettings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const startEdit = (item: SchedulingAvailabilitySetting) => {
    setEditingId(item.id);
    setEditForm(utcAvailabilityToLocalForm(item.dayOfWeek, item.startTime, item.endTime));
    setShowCreateForm(false);
    setSuccess(null);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    const validationError = validateAvailabilityFormLocal(editForm, settings, editingId);
    if (validationError) {
      setError(validationError);
      setSuccess(null);
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = localAvailabilityToUtc(editForm.dayOfWeek, editForm.startTime, editForm.endTime);
      await updateAvailabilitySetting(editingId, payload);
      setEditingId(null);
      setSuccess('Availability updated.');
      await loadSettings(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update availability');
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    const validationError = validateAvailabilityFormLocal(createForm, settings);
    if (validationError) {
      setError(validationError);
      setSuccess(null);
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = localAvailabilityToUtc(createForm.dayOfWeek, createForm.startTime, createForm.endTime);
      await createAvailabilitySetting(payload);
      setShowCreateForm(false);
      setCreateForm(EMPTY_FORM);
      setSuccess('New availability window added.');
      await loadSettings(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create availability');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item: SchedulingAvailabilitySetting) => {
    const localDay = getLocalAvailabilityDayName(item.dayOfWeek, item.startTime) || item.dayName;
    const localTime = formatAvailabilityLocal(item.dayOfWeek, item.startTime, item.endTime);
    Alert.alert(
      'Delete availability window?',
      `Remove ${localDay} ${localTime} (${timezoneLabel})? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(item.id);
            setError(null);
            setSuccess(null);
            try {
              await deleteAvailabilitySetting(item.id);
              if (editingId === item.id) setEditingId(null);
              setSuccess('Availability window deleted.');
              await loadSettings(true);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to delete availability');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      <ThemedView style={[styles.header, { borderBottomColor: borderColor }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityLabel="Go back">
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.headerTitle}>
          Availability
        </ThemedText>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.themeButton, { borderColor, backgroundColor: cardBackground }]}
            onPress={toggleTheme}
            accessibilityLabel={`Switch to ${colorScheme === 'dark' ? 'light' : 'dark'} mode`}>
            <MaterialIcons
              name={colorScheme === 'dark' ? 'light-mode' : 'dark-mode'}
              size={18}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>
      </ThemedView>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {loading && settings.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.tint} />
            <ThemedText style={styles.loadingText}>Loading availability…</ThemedText>
          </View>
        ) : (
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => loadSettings(true)} tintColor={colors.tint} />
            }>
            <View style={[styles.infoCard, { backgroundColor: cardBackground, borderColor }]}>
              <MaterialIcons name="info-outline" size={20} color={colors.tint} />
              <ThemedText style={styles.infoText}>
                Weekly booking windows stored on the server in UTC. Times below are shown in your device timezone ({timezoneLabel}). Windows on the same day cannot overlap and must use hourly :00 times.
              </ThemedText>
            </View>

            {error && (
              <View style={[styles.banner, { backgroundColor: colors.errorMuted, borderColor: colors.error }]}>
                <MaterialIcons name="error-outline" size={22} color={colors.errorText} />
                <ThemedText style={[styles.bannerText, { color: colors.errorText }]}>{error}</ThemedText>
              </View>
            )}

            {success && (
              <View style={[styles.banner, { backgroundColor: colors.buttonSecondary, borderColor: colors.tint }]}>
                <MaterialIcons name="check-circle" size={22} color={colors.tint} />
                <ThemedText style={[styles.bannerText, { color: colors.tint }]}>{success}</ThemedText>
              </View>
            )}

            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Current windows ({settings.length})
            </ThemedText>

            {settings.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: cardBackground, borderColor }]}>
                <ThemedText style={styles.emptyText}>No availability windows configured yet.</ThemedText>
              </View>
            ) : (
              settings.map((item) => (
                <AvailabilityRow
                  key={item.id}
                  item={item}
                  isEditing={editingId === item.id}
                  formValue={editForm}
                  onEdit={() => startEdit(item)}
                  onDelete={() => handleDelete(item)}
                  onCancelEdit={() => setEditingId(null)}
                  onFormChange={setEditForm}
                  onSave={handleSaveEdit}
                  saving={saving}
                  deleting={deletingId === item.id}
                  colors={colors}
                  cardBackground={cardBackground}
                  borderColor={borderColor}
                  timezoneLabel={timezoneLabel}
                />
              ))
            )}

            <View style={styles.addSection}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Add new window
              </ThemedText>
              {!showCreateForm ? (
                <TouchableOpacity
                  style={[styles.addButton, { borderColor, backgroundColor: cardBackground }]}
                  onPress={() => {
                    setShowCreateForm(true);
                    setEditingId(null);
                    setSuccess(null);
                  }}
                  accessibilityLabel="Add availability window">
                  <MaterialIcons name="add" size={22} color={colors.tint} />
                  <ThemedText style={[styles.addButtonText, { color: colors.tint }]}>
                    Add availability window
                  </ThemedText>
                </TouchableOpacity>
              ) : (
                <AvailabilityForm
                  value={createForm}
                  onChange={setCreateForm}
                  onSubmit={handleCreate}
                  onCancel={() => setShowCreateForm(false)}
                  submitLabel="Create window"
                  saving={saving}
                  colors={colors}
                  cardBackground={cardBackground}
                  borderColor={borderColor}
                  timezoneLabel={timezoneLabel}
                />
              )}
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: { padding: 8, marginRight: 8, borderRadius: 8 },
  headerTitle: { flex: 1, fontSize: 24, fontWeight: '700' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  themeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 40 },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  loadingText: { marginTop: 16, fontSize: 16 },
  infoCard: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 19, opacity: 0.8 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  bannerText: { flex: 1, fontSize: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  emptyCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  emptyText: { fontSize: 14, opacity: 0.65, textAlign: 'center' },
  rowCard: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 8,
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  dayBadgeText: { fontSize: 13, fontWeight: '700' },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  editButtonText: { fontSize: 13, fontWeight: '600' },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  deleteButtonText: { fontSize: 13, fontWeight: '600' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeText: { fontSize: 16 },
  timezoneHint: { fontSize: 12, opacity: 0.6, marginTop: 4, marginLeft: 26 },
  formCard: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    gap: 8,
  },
  formLabel: { fontSize: 14, marginTop: 4 },
  formHint: { fontSize: 12, opacity: 0.65, marginBottom: 4 },
  dayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  dayChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 44,
    alignItems: 'center',
  },
  dayChipText: { fontSize: 12, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 4,
  },
  formActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  primaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  secondaryButtonText: { fontSize: 15, fontWeight: '600' },
  addSection: { marginTop: 12 },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addButtonText: { fontSize: 15, fontWeight: '700' },
});
