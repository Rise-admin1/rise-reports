import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useThemePreference } from '@/context/theme-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type DetailChromeProps = {
  title: string;
  loading?: boolean;
  error?: string | null;
  refreshing?: boolean;
  onRefresh?: () => void;
  children: React.ReactNode;
};

export function DetailChrome({
  title,
  loading,
  error,
  refreshing,
  onRefresh,
  children,
}: DetailChromeProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { toggleTheme } = useThemePreference();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ThemedView style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Go back">
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.headerTitle} numberOfLines={1}>
          {title}
        </ThemedText>
        <TouchableOpacity
          style={[styles.themeButton, { borderColor: colors.border, backgroundColor: colors.card }]}
          onPress={toggleTheme}>
          <MaterialIcons
            name={colorScheme === 'dark' ? 'light-mode' : 'dark-mode'}
            size={18}
            color={colors.text}
          />
        </TouchableOpacity>
      </ThemedView>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={!!refreshing}
              onRefresh={onRefresh}
              tintColor={colors.tint}
            />
          ) : undefined
        }>
        {loading ? (
          <ActivityIndicator color={colors.tint} style={{ marginTop: 40 }} />
        ) : error ? (
          <ThemedText style={styles.error}>{error}</ThemedText>
        ) : (
          <View style={styles.body}>{children}</View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export const detailStyles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 10, padding: 12, gap: 6 },
  meta: { fontSize: 12, opacity: 0.7 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
    textTransform: 'uppercase',
    opacity: 0.7,
  },
  row: { gap: 4 },
  actionButton: {
    minWidth: 96,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionButtonText: { color: '#fff', fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 10, flexWrap: 'wrap' },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 8,
  },
  backButton: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '700' },
  themeButton: { borderWidth: 1, borderRadius: 8, padding: 8 },
  content: { padding: 16, paddingBottom: 40 },
  body: { gap: 12 },
  error: { color: '#c0392b', marginTop: 20 },
});
