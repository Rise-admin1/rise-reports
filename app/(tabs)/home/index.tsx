import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useThemePreference } from '@/context/theme-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import React, { useCallback } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { toggleTheme } = useThemePreference();
  const colors = Colors[colorScheme ?? 'light'];
  const backgroundColor = colors.background;
  const cardBackground = colors.card;
  const borderColor = colors.border;
  const { refreshing, onRefresh } = useRefreshControl(useCallback(async () => {}, []));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      <ThemedView style={[styles.header, { borderBottomColor: borderColor }]}>
        <ThemedText type="title" style={styles.headerTitle}>
          Reports
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

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
        }>
        <View style={styles.reportChoice}>
          <ThemedText type="subtitle" style={styles.reportChoiceTitle}>
            Choose a report
          </ThemedText>
          <TouchableOpacity
            style={[styles.reportCard, { backgroundColor: cardBackground, borderColor }]}
            onPress={() => router.push('/home/funyula' as Href)}
            activeOpacity={0.85}>
            <View style={styles.reportCardLeft}>
              <View style={styles.reportCardImageContainer}>
                <Image
                  source={require('@/assets/images/funyula.png')}
                  style={styles.reportCardImage}
                  contentFit="contain"
                />
              </View>
              <View style={styles.reportCardContent}>
                <ThemedText type="subtitle" style={styles.reportCardTitle}>
                  Funyula
                </ThemedText>
                <ThemedText style={styles.reportCardDesc}>View Funyula reports</ThemedText>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.icon} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.reportCard, { backgroundColor: cardBackground, borderColor }]}
            onPress={() => router.push('/home/rise' as Href)}
            activeOpacity={0.85}>
            <View style={styles.reportCardLeft}>
              <View style={styles.reportCardImageContainer}>
                <Image
                  source={require('@/assets/images/1-7ffa7b50.png')}
                  style={styles.reportCardImage}
                  contentFit="contain"
                />
              </View>
              <View style={styles.reportCardContent}>
                <ThemedText type="subtitle" style={styles.reportCardTitle}>
                  RISE
                </ThemedText>
                <ThemedText style={styles.reportCardDesc}>View RISE reports</ThemedText>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.icon} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.reportCard, { backgroundColor: cardBackground, borderColor }]}
            onPress={() => router.push('/home/phdsuccess' as Href)}
            activeOpacity={0.85}>
            <View style={styles.reportCardLeft}>
            <View style={styles.reportCardImageContainer}>
                <Image
                  source={require('@/assets/images/phd_logo.png')}
                  style={styles.reportCardImage}
                  contentFit="contain"
                />
              </View>
              <View style={styles.reportCardContent}>
                
                <ThemedText type="subtitle" style={styles.reportCardTitle}>
                  PhD Success
                </ThemedText>
                <ThemedText style={styles.reportCardDesc}>View PhD Success AE reports</ThemedText>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.icon} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  reportChoice: {
    marginBottom: 24,
  },
  reportChoiceTitle: {
    marginBottom: 16,
    fontSize: 20,
    fontWeight: '700',
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  reportCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  reportCardImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportCardImage: {
    width: 48,
    height: 48,
  },
  reportCardContent: {
    flex: 1,
  },
  reportCardTitle: {
    marginBottom: 4,
    fontSize: 18,
    fontWeight: '600',
  },
  reportCardDesc: {
    fontSize: 12,
    opacity: 0.7,
  },
});
