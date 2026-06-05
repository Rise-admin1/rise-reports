import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useThemePreference } from '@/context/theme-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { createSchedulingInvite } from '@/services/api';
import type { SchedulingInvite, SchedulingInviteType } from '@/types/scheduling';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function formatExpiry(iso: string | null): string {
  if (!iso) return 'No expiry';
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function SetAppointmentScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { toggleTheme } = useThemePreference();
  const colors = Colors[colorScheme ?? 'light'];
  const backgroundColor = colors.background;
  const cardBackground = colors.card;
  const borderColor = colors.border;

  const [email, setEmail] = useState('');
  const [inviteType, setInviteType] = useState<SchedulingInviteType>('paid');
  const [invite, setInvite] = useState<SchedulingInvite | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Please enter an email address');
      return;
    }

    setLoading(true);
    setError(null);
    setCopied(false);
    try {
      const data = await createSchedulingInvite({ email: trimmed, type: inviteType, appSource: 'phd-success' });
      setInvite(data.invite);
    } catch (err) {
      setInvite(null);
      setError(err instanceof Error ? err.message : 'Failed to create invite');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!invite?.shareUrl) return;
    await Clipboard.setStringAsync(invite.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = async () => {
    if (!invite?.shareUrl) return;
    const message =
      invite.type === 'free'
        ? `You have a complimentary PhD Success AE session (100% off). Book here: ${invite.shareUrl}`
        : `Book your PhD Success AE session here: ${invite.shareUrl}`;
    const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return;
    }
    await Linking.openURL(`https://wa.me/?text=${encodeURIComponent(message)}`);
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
          Set Appointment
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
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={[styles.formCard, { backgroundColor: cardBackground, borderColor }]}>
            <ThemedText type="subtitle" style={styles.formTitle}>
              Create booking link
            </ThemedText>
            <ThemedText style={styles.formHint}>
              Generate a personal link for a client. Their email will be pre-filled on the scheduling page.
            </ThemedText>

            <ThemedText type="defaultSemiBold" style={styles.label}>
              Client email
            </ThemedText>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="client@example.com"
              placeholderTextColor={colors.icon}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={[
                styles.input,
                { color: colors.text, borderColor, backgroundColor: colors.background },
              ]}
            />

            <ThemedText type="defaultSemiBold" style={styles.label}>
              Session type
            </ThemedText>
            <View style={styles.typeRow}>
              {(['paid', 'free'] as SchedulingInviteType[]).map((type) => {
                const selected = inviteType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeChip,
                      {
                        borderColor: selected ? colors.tint : borderColor,
                        backgroundColor: selected ? colors.buttonSecondary : cardBackground,
                      },
                    ]}
                    onPress={() => setInviteType(type)}
                    accessibilityLabel={type === 'paid' ? 'Paid session' : 'Free session'}>
                    <MaterialIcons
                      name={type === 'paid' ? 'payments' : 'redeem'}
                      size={20}
                      color={selected ? colors.tint : colors.icon}
                    />
                    <ThemedText
                      style={[
                        styles.typeChipText,
                        selected && { color: colors.tint, fontWeight: '700' },
                      ]}>
                      {type === 'paid' ? 'Paid' : 'Free'}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>

            <ThemedText style={styles.typeHint}>
              {inviteType === 'free'
                ? 'Free links expire in 10 minutes, are one-time use, and apply a 100% Stripe coupon at checkout.'
                : 'Paid links do not expire. Client pays full price at Stripe checkout.'}
            </ThemedText>

            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: colors.tint, opacity: loading ? 0.7 : 1 }]}
              onPress={handleCreate}
              disabled={loading}
              accessibilityLabel="Create appointment link">
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="link" size={20} color="#fff" />
                  <ThemedText style={styles.createButtonText}>Generate link</ThemedText>
                </>
              )}
            </TouchableOpacity>
          </View>

          {error && (
            <View style={[styles.banner, { backgroundColor: colors.errorMuted, borderColor: colors.error }]}>
              <MaterialIcons name="error-outline" size={22} color={colors.errorText} />
              <ThemedText style={[styles.bannerText, { color: colors.errorText }]}>{error}</ThemedText>
            </View>
          )}

          {invite && (
            <View style={[styles.resultCard, { backgroundColor: cardBackground, borderColor }]}>
              <ThemedText type="subtitle" style={styles.resultTitle}>
                Share link
              </ThemedText>
              <View style={styles.metaRow}>
                <ThemedText style={styles.metaLabel}>Email</ThemedText>
                <ThemedText type="defaultSemiBold">{invite.email}</ThemedText>
              </View>
              <View style={styles.metaRow}>
                <ThemedText style={styles.metaLabel}>Type</ThemedText>
                <ThemedText type="defaultSemiBold">{invite.type === 'free' ? 'Free (100% off)' : 'Paid'}</ThemedText>
              </View>
              <View style={styles.metaRow}>
                <ThemedText style={styles.metaLabel}>Expires</ThemedText>
                <ThemedText type="defaultSemiBold">
                  {invite.type === 'free' ? formatExpiry(invite.expiresAt) : 'Never'}
                </ThemedText>
              </View>

              <View style={[styles.urlBox, { borderColor, backgroundColor: colors.background }]}>
                <ThemedText style={styles.urlText} selectable>
                  {invite.shareUrl}
                </ThemedText>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionButton, { borderColor, backgroundColor: colors.buttonSecondary }]}
                  onPress={handleCopy}
                  accessibilityLabel="Copy link">
                  <MaterialIcons name={copied ? 'check' : 'content-copy'} size={20} color={colors.tint} />
                  <ThemedText style={[styles.actionButtonText, { color: colors.tint }]}>
                    {copied ? 'Copied' : 'Copy URL'}
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { borderColor, backgroundColor: '#25D36622' }]}
                  onPress={handleWhatsApp}
                  accessibilityLabel="Share via WhatsApp">
                  <MaterialIcons name="chat" size={20} color="#25D366" />
                  <ThemedText style={[styles.actionButtonText, { color: '#25D366' }]}>WhatsApp</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
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
  formCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    gap: 10,
  },
  formTitle: { fontSize: 18, fontWeight: '700' },
  formHint: { fontSize: 14, opacity: 0.75, lineHeight: 20, marginBottom: 4 },
  label: { fontSize: 14, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  typeChipText: { fontSize: 15, fontWeight: '600' },
  typeHint: { fontSize: 13, opacity: 0.7, lineHeight: 18 },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  createButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
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
  resultCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  resultTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  metaLabel: { fontSize: 14, opacity: 0.7 },
  urlBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  urlText: { fontSize: 13, lineHeight: 20 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionButtonText: { fontSize: 14, fontWeight: '700' },
});
