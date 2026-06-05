import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useThemePreference } from '@/context/theme-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  deleteVaultDocument as apiDeleteVaultDocument,
  fetchVaultDocumentViewUrl as apiFetchVaultDocumentViewUrl,
  fetchVaultDocuments as apiFetchVaultDocuments,
  uploadVaultDocument as apiUploadVaultDocument,
} from '@/services/api';
import { VaultDocument } from '@/types/vault';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as DocumentPicker from 'expo-document-picker';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { RectButton, Swipeable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function displayName(doc: VaultDocument): string {
  return doc.title?.trim() || doc.originalName;
}

function defaultTitleFromFileName(fileName: string): string {
  const base = fileName.replace(/\.[^/.]+$/, '').trim();
  return base || fileName;
}

type PendingUpload = {
  uri: string;
  name: string;
  mimeType: string;
};

function mimeIcon(mimeType: string): React.ComponentProps<typeof MaterialIcons>['name'] {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'picture-as-pdf';
  if (mimeType.includes('word')) return 'description';
  return 'insert-drive-file';
}

type VaultListItemProps = {
  doc: VaultDocument;
  onOpen: (doc: VaultDocument) => void;
  onDelete: (id: string) => void;
  colors: (typeof Colors)['light'];
};

function VaultListItem({ doc, onOpen, onDelete, colors }: VaultListItemProps) {
  const swipeableRef = useRef<Swipeable | null>(null);

  return (
    <Swipeable
      ref={swipeableRef}
      renderLeftActions={() => (
        <View style={styles.leftActionsWrap}>
          <RectButton
            style={[styles.deleteAction, { backgroundColor: colors.errorMuted, borderColor: colors.error }]}
            onPress={() => {
              onDelete(doc.id);
              swipeableRef.current?.close();
            }}>
            <MaterialIcons name="delete" size={16} color={colors.errorText} />
            <ThemedText style={[styles.deleteText, { color: colors.errorText }]}>Delete</ThemedText>
          </RectButton>
        </View>
      )}>
      <Pressable
        onPress={() => onOpen(doc)}
        style={({ pressed }) => [
          styles.row,
          { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
        ]}>
        <View style={[styles.iconWrap, { backgroundColor: colors.buttonHover }]}>
          <MaterialIcons name={mimeIcon(doc.mimeType)} size={22} color={colors.tint} />
        </View>
        <View style={styles.rowText}>
          <ThemedText type="defaultSemiBold" numberOfLines={2}>
            {displayName(doc)}
          </ThemedText>
          {doc.title?.trim() ? (
            <ThemedText style={styles.originalName} numberOfLines={1}>
              {doc.originalName}
            </ThemedText>
          ) : null}
          <ThemedText style={styles.meta}>
            {formatBytes(doc.sizeBytes)} · {new Date(doc.createdAt).toLocaleDateString()}
          </ThemedText>
        </View>
        <MaterialIcons name="open-in-new" size={20} color={colors.icon} />
      </Pressable>
    </Swipeable>
  );
}

export default function VaultScreen() {
  const scheme = useColorScheme();
  const { toggleTheme } = useThemePreference();
  const colors = Colors[scheme ?? 'light'];

  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const requestIdRef = useRef(0);

  const loadDocuments = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setApiError(null);

    try {
      const resp = await apiFetchVaultDocuments({ page: 1, limit: 50 });
      if (requestId !== requestIdRef.current) return;
      setDocuments(resp.data.documents);
      setTotalCount(resp.data.pagination.totalCount);
    } catch (e) {
      if (requestId !== requestIdRef.current) return;
      setDocuments([]);
      setTotalCount(0);
      setApiError(e instanceof Error ? e.message : 'Failed to load documents');
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleOpen = async (doc: VaultDocument) => {
    try {
      const { data } = await apiFetchVaultDocumentViewUrl(doc.id);
      await WebBrowser.openBrowserAsync(data.viewUrl);
    } catch (e) {
      Alert.alert(
        'Could not open document',
        e instanceof Error ? e.message : 'Failed to get a secure view link'
      );
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete document', 'Remove this file from the vault?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiDeleteVaultDocument({ id });
            setDocuments((prev) => prev.filter((d) => d.id !== id));
            setTotalCount((c) => Math.max(0, c - 1));
          } catch (e) {
            Alert.alert('Delete failed', e instanceof Error ? e.message : 'Unknown error');
          }
        },
      },
    ]);
  };

  const closeUploadModal = () => {
    setUploadModalVisible(false);
    setPendingUpload(null);
    setUploadTitle('');
  };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      const name = asset.name || 'document';
      setPendingUpload({
        uri: asset.uri,
        name,
        mimeType: asset.mimeType || 'application/octet-stream',
      });
      setUploadTitle(defaultTitleFromFileName(name));
      setUploadModalVisible(true);
    } catch (e) {
      Alert.alert('Could not pick file', e instanceof Error ? e.message : 'Unknown error');
    }
  };

  const handleConfirmUpload = async () => {
    if (!pendingUpload) return;

    const title = uploadTitle.trim();
    if (!title) {
      Alert.alert('Name required', 'Enter a name for this document.');
      return;
    }

    setIsUploading(true);
    setApiError(null);

    try {
      const resp = await apiUploadVaultDocument({
        uri: pendingUpload.uri,
        name: pendingUpload.name,
        mimeType: pendingUpload.mimeType,
        title,
      });
      setDocuments((prev) => [resp.data.document, ...prev]);
      setTotalCount((c) => c + 1);
      closeUploadModal();
    } catch (e) {
      Alert.alert('Upload failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <View>
            <ThemedText type="title">Vault</ThemedText>
            <ThemedText style={styles.subtitle}>
              {totalCount} document{totalCount === 1 ? '' : 's'} stored in AWS
            </ThemedText>
          </View>
          <Pressable
            onPress={toggleTheme}
            style={[styles.themeBtn, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <MaterialIcons
              name={scheme === 'dark' ? 'light-mode' : 'dark-mode'}
              size={22}
              color={colors.icon}
            />
          </Pressable>
        </View>

        {apiError ? (
          <View style={[styles.banner, { backgroundColor: colors.errorMuted, borderColor: colors.error }]}>
            <ThemedText style={{ color: colors.errorText }}>{apiError}</ThemedText>
            <Pressable onPress={loadDocuments}>
              <ThemedText style={{ color: colors.tint }}>Retry</ThemedText>
            </Pressable>
          </View>
        ) : null}

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.tint} />
          </View>
        ) : (
          <FlatList
            data={documents}
            keyExtractor={(item) => item.id}
            contentContainerStyle={documents.length === 0 ? styles.emptyList : styles.list}
            ListEmptyComponent={
              <View style={styles.centered}>
                <MaterialIcons name="folder-open" size={48} color={colors.tabIconDefault} />
                <ThemedText style={styles.emptyText}>No documents yet. Upload your first file.</ThemedText>
              </View>
            }
            renderItem={({ item }) => (
              <VaultListItem doc={item} onOpen={handleOpen} onDelete={handleDelete} colors={colors} />
            )}
          />
        )}

        <Modal visible={uploadModalVisible} animationType="slide" transparent onRequestClose={closeUploadModal}>
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Pressable style={styles.modalBackdrop} onPress={closeUploadModal} />
            <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ThemedText type="subtitle">Name your document</ThemedText>
              {pendingUpload ? (
                <ThemedText style={styles.modalFileHint} numberOfLines={2}>
                  File: {pendingUpload.name}
                </ThemedText>
              ) : null}
              <TextInput
                value={uploadTitle}
                onChangeText={setUploadTitle}
                placeholder="Document name"
                placeholderTextColor={colors.tabIconDefault}
                style={[
                  styles.nameInput,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                  },
                ]}
                autoFocus
                maxLength={120}
                editable={!isUploading}
              />
              <View style={styles.modalActions}>
                <Pressable
                  onPress={closeUploadModal}
                  disabled={isUploading}
                  style={[styles.modalBtn, { borderColor: colors.border, backgroundColor: colors.buttonSecondary }]}>
                  <ThemedText>Cancel</ThemedText>
                </Pressable>
                <Pressable
                  onPress={handleConfirmUpload}
                  disabled={isUploading}
                  style={[styles.modalBtn, { backgroundColor: colors.tint, opacity: isUploading ? 0.7 : 1 }]}>
                  {isUploading ? (
                    <ActivityIndicator color={colors.tintText} />
                  ) : (
                    <ThemedText style={{ color: colors.tintText, fontWeight: '600' }}>Upload</ThemedText>
                  )}
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        <Pressable
          onPress={handlePickFile}
          disabled={isUploading}
          style={({ pressed }) => [
            styles.fab,
            {
              backgroundColor: colors.tint,
              opacity: pressed || isUploading ? 0.8 : 1,
            },
          ]}>
          {isUploading ? (
            <ActivityIndicator color={colors.tintText} />
          ) : (
            <MaterialIcons name="upload-file" size={28} color={colors.tintText} />
          )}
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  subtitle: { marginTop: 4, opacity: 0.7 },
  themeBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  banner: {
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  list: { paddingHorizontal: 20, paddingBottom: 100, gap: 10 },
  emptyList: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 100 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, minHeight: 200 },
  emptyText: { textAlign: 'center', opacity: 0.7, paddingHorizontal: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, gap: 4 },
  originalName: { fontSize: 12, opacity: 0.55 },
  meta: { fontSize: 13, opacity: 0.65 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    padding: 20,
    paddingBottom: 28,
    gap: 12,
  },
  modalFileHint: { opacity: 0.65, fontSize: 14 },
  nameInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  modalBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  leftActionsWrap: { justifyContent: 'center', marginRight: 8 },
  deleteAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    height: '90%',
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'center',
  },
  deleteText: { fontSize: 13, fontWeight: '600' },
});
