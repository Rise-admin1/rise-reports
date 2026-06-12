import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useThemePreference } from '@/context/theme-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { fetchSessionCredits, grantSessionCredits } from '@/services/api';
import type { GrantSessionCreditsResponse, SessionCreditsResponse } from '@/types/scheduling';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SESSION_MIN = 1;

export default function GrantSessionsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { toggleTheme } = useThemePreference();
  const colors = Colors[colorScheme ?? 'light'];
  const backgroundColor = colors.background;
  const cardBackground = colors.card;
  const borderColor = colors.border;

  const [email, setEmail] = useState('');
  const [sessions, setSessions] = useState('');
  const [notes, setNotes] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [result, setResult] = useState<GrantSessionCreditsResponse | null>(null);
  const [existingCredit, setExistingCredit] = useState<SessionCreditsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleLookup = useCallback(async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Please enter an email address');
      return;
    }

    setLookupLoading(true);
    setError(null);
    try {
      const data = await fetchSessionCredits(trimmed, 'phd-success');
      setExistingCredit(data);
    } catch (err) {
      setExistingCredit(null);
      if (err instanceof Error && err.message.includes('No session credits')) {
        setError(null);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to look up credits');
      }
    } finally {
      setLookupLoading(false);
    }
  }, [email]);

  const { refreshing, onRefresh } = useRefreshControl(
    useCallback(async () => {
      if (email.trim()) {
        await handleLookup();
      }
    }, [email, handleLookup])
  );

  const handleGrant = async () => {
    const trimmedEmail = email.trim();
    const parsedSessions = Number(sessions);

    if (!trimmedEmail) {
      setError('Please enter an email address');
      return;
    }
    if (!Number.isInteger(parsedSessions) || parsedSessions < SESSION_MIN) {
      setError(`Sessions must be a whole number of at least ${SESSION_MIN}`);
      return;
    }

    setLoading(true);
    setError(null);
    setCopied(false);
    try {
      const data = await grantSessionCredits({
        email: trimmedEmail,
        sessions: parsedSessions,
        appSource: 'phd-success',
        notes: notes.trim() || undefined,
        sendEmail,
      });
      setResult(data);
      setExistingCredit({
        credit: data.credit,
        invite: data.invite,
        recentUsages: [],
      });
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : 'Failed to grant sessions');
    } finally {
      setLoading(false);
    }
  };

  const shareUrl = result?.invite.shareUrl ?? existingCredit?.credit.shareUrl ?? null;

  const handleCopy = async () => {
    if (!shareUrl) return;
    await Clipboard.setStringAsync(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = async () => {
    if (!shareUrl) return;
    const remaining = result?.credit.remainingSessions ?? existingCredit?.credit.remainingSessions ?? 0;
    const message = `You have ${remaining} complimentary PhD Success AE session${remaining === 1 ? '' : 's'} available. Book here: ${shareUrl}`;
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
          Grant Sessions
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
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
          }>
          <View style={[styles.formCard, { backgroundColor: cardBackground, borderColor }]}>
            <ThemedText type="subtitle" style={styles.formTitle}>
              Grant session package
            </ThemedText>
            <ThemedText style={styles.formHint}>
              Add complimentary sessions for a client who paid externally. Sessions stack on repeat
              grants to the same email. Cancelled meetings do not restore credits.
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

            <TouchableOpacity
              style={[styles.lookupButton, { borderColor, backgroundColor: colors.buttonSecondary }]}
              onPress={handleLookup}
              disabled={lookupLoading}
              accessibilityLabel="Look up existing credits">
              {lookupLoading ? (
                <ActivityIndicator color={colors.tint} />
              ) : (
                <>
                  <MaterialIcons name="search" size={18} color={colors.tint} />
                  <ThemedText style={[styles.lookupButtonText, { color: colors.tint }]}>
                    Check existing balance
                  </ThemedText>
                </>
              )}
            </TouchableOpacity>

            {existingCredit && (
              <View style={[styles.balanceBox, { borderColor, backgroundColor: colors.background }]}>
                <ThemedText type="defaultSemiBold">Current balance</ThemedText>
                <ThemedText style={styles.balanceValue}>
                  {existingCredit.credit.remainingSessions} of {existingCredit.credit.totalSessions}{' '}
                  sessions remaining
                </ThemedText>
              </View>
            )}

            <ThemedText type="defaultSemiBold" style={styles.label}>
              Sessions to add
            </ThemedText>
            <TextInput
              value={sessions}
              onChangeText={setSessions}
              placeholder="20"
              placeholderTextColor={colors.icon}
              keyboardType="number-pad"
              style={[
                styles.input,
                { color: colors.text, borderColor, backgroundColor: colors.background },
              ]}
            />

            <ThemedText type="defaultSemiBold" style={styles.label}>
              Notes (optional)
            </ThemedText>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="External payment reference"
              placeholderTextColor={colors.icon}
              multiline
              style={[
                styles.input,
                styles.notesInput,
                { color: colors.text, borderColor, backgroundColor: colors.background },
              ]}
            />

            <View style={styles.switchRow}>
              <View style={styles.switchCopy}>
                <ThemedText type="defaultSemiBold">Send booking link via email</ThemedText>
                <ThemedText style={styles.switchHint}>
                  Uses Resend to email the client their package link.
                </ThemedText>
              </View>
              <Switch
                value={sendEmail}
                onValueChange={setSendEmail}
                trackColor={{ false: borderColor, true: colors.tint }}
              />
            </View>

            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: colors.tint, opacity: loading ? 0.7 : 1 }]}
              onPress={handleGrant}
              disabled={loading}
              accessibilityLabel="Grant sessions">
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="card-giftcard" size={20} color="#fff" />
                  <ThemedText style={styles.createButtonText}>Grant sessions & send link</ThemedText>
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

          {result && (
            <View style={[styles.resultCard, { backgroundColor: cardBackground, borderColor }]}>
              <ThemedText type="subtitle" style={styles.resultTitle}>
                Package updated
              </ThemedText>
              <View style={styles.metaRow}>
                <ThemedText style={styles.metaLabel}>Email</ThemedText>
                <ThemedText type="defaultSemiBold">{result.credit.email}</ThemedText>
              </View>
              <View style={styles.metaRow}>
                <ThemedText style={styles.metaLabel}>Added</ThemedText>
                <ThemedText type="defaultSemiBold">{sessions} sessions</ThemedText>
              </View>
              <View style={styles.metaRow}>
                <ThemedText style={styles.metaLabel}>Remaining</ThemedText>
                <ThemedText type="defaultSemiBold">
                  {result.credit.remainingSessions} of {result.credit.totalSessions}
                </ThemedText>
              </View>
              <View style={styles.metaRow}>
                <ThemedText style={styles.metaLabel}>Email sent</ThemedText>
                <ThemedText type="defaultSemiBold">
                  {result.emailSent ? 'Yes' : result.emailSkipped ? 'Skipped (not configured)' : 'No'}
                </ThemedText>
              </View>

              {shareUrl && (
                <>
                  <View style={[styles.urlBox, { borderColor, backgroundColor: colors.background }]}>
                    <ThemedText style={styles.urlText} selectable>
                      {shareUrl}
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
                </>
              )}
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
  notesInput: { minHeight: 72, textAlignVertical: 'top' },
  lookupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  lookupButtonText: { fontSize: 14, fontWeight: '700' },
  balanceBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  balanceValue: { fontSize: 15, opacity: 0.85 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 4,
  },
  switchCopy: { flex: 1, gap: 4 },
  switchHint: { fontSize: 13, opacity: 0.7, lineHeight: 18 },
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
