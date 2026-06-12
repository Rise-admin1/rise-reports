import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useThemePreference } from '@/context/theme-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import {
  createVaultGuestAccess as apiCreateVaultGuestAccess,
  deleteVaultDocument as apiDeleteVaultDocument,
  fetchVaultDocumentViewUrl as apiFetchVaultDocumentViewUrl,
  fetchVaultDocuments as apiFetchVaultDocuments,
  fetchVaultGuestAccess as apiFetchVaultGuestAccess,
  revokeVaultGuestAccess as apiRevokeVaultGuestAccess,
  uploadVaultDocument as apiUploadVaultDocument,
  VaultAuthError,
  vaultLogin as apiVaultLogin,
  vaultLogout as apiVaultLogout,
  vaultMe as apiVaultMe,
} from '@/services/api';
import { VaultDocument, VaultGuestAccess, VaultRole } from '@/types/vault';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatExpiryDate(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function displayName(doc: { title?: string; originalName: string }): string {
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

type ShareResult = {
  username: string;
  password: string;
  documentNames: string[];
  expiresAt: string;
};

function mimeIcon(mimeType: string): React.ComponentProps<typeof MaterialIcons>['name'] {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'picture-as-pdf';
  if (mimeType.includes('word')) return 'description';
  return 'insert-drive-file';
}

type VaultListItemProps = {
  doc: VaultDocument;
  isAdmin: boolean;
  isSelected: boolean;
  isShared: boolean;
  sharedGuest: VaultGuestAccess | null;
  onToggleSelect: (id: string) => void;
  onOpen: (doc: VaultDocument) => void;
  onDownload: (doc: VaultDocument) => void;
  onShare: (docId: string) => void;
  onDelete: (doc: VaultDocument) => void;
  colors: (typeof Colors)['light'];
};

function VaultListItem({
  doc,
  isAdmin,
  isSelected,
  isShared,
  sharedGuest,
  onToggleSelect,
  onOpen,
  onDownload,
  onShare,
  onDelete,
  colors,
}: VaultListItemProps) {
  return (
    <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {isAdmin ? (
        <Pressable
          onPress={() => !isShared && onToggleSelect(doc.id)}
          disabled={isShared}
          style={styles.checkboxBtn}
          accessibilityLabel={isSelected ? 'Deselect document' : 'Select document'}>
          <MaterialIcons
            name={isSelected ? 'check-box' : 'check-box-outline-blank'}
            size={22}
            color={isShared ? colors.tabIconDefault : colors.tint}
          />
        </Pressable>
      ) : null}

      <Pressable onPress={() => onOpen(doc)} style={styles.rowMain}>
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
          {sharedGuest ? (
            <ThemedText style={styles.sharedMeta} numberOfLines={2}>
              Shared with {sharedGuest.username} (expires {formatExpiryDate(sharedGuest.expiresAt)})
            </ThemedText>
          ) : null}
        </View>
      </Pressable>

      <View style={styles.rowActions}>
        <Pressable onPress={() => onOpen(doc)} style={styles.actionIcon} accessibilityLabel="Open">
          <MaterialIcons name="open-in-new" size={20} color={colors.icon} />
        </Pressable>
        <Pressable onPress={() => onDownload(doc)} style={styles.actionIcon} accessibilityLabel="Download">
          <MaterialIcons name="download" size={20} color={colors.icon} />
        </Pressable>
        {isAdmin ? (
          <>
            <Pressable
              onPress={() => onShare(doc.id)}
              disabled={isShared}
              style={[styles.actionIcon, isShared && styles.actionDisabled]}
              accessibilityLabel="Share access">
              <MaterialIcons name="share" size={20} color={isShared ? colors.tabIconDefault : colors.icon} />
            </Pressable>
            <Pressable
              onPress={() => onDelete(doc)}
              style={styles.actionIcon}
              accessibilityLabel="Delete">
              <MaterialIcons name="delete-outline" size={20} color={colors.errorText} />
            </Pressable>
          </>
        ) : null}
      </View>
    </View>
  );
}

type VaultUser = {
  username: string;
  role: VaultRole;
  expiresAt: string | null;
};

export default function VaultScreen() {
  const scheme = useColorScheme();
  const { toggleTheme } = useThemePreference();
  const colors = Colors[scheme ?? 'light'];

  const [vaultUser, setVaultUser] = useState<VaultUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [guestAccess, setGuestAccess] = useState<VaultGuestAccess[]>([]);
  const [listSelectedDocIds, setListSelectedDocIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareResultVisible, setShareResultVisible] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [shareSelectedDocIds, setShareSelectedDocIds] = useState<string[]>([]);
  const [shareUsername, setShareUsername] = useState('');
  const [sharePassword, setSharePassword] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [shareResult, setShareResult] = useState<ShareResult | null>(null);
  const [credentialsCopied, setCredentialsCopied] = useState(false);
  const requestIdRef = useRef(0);

  const isAdmin = vaultUser?.role === 'ADMIN';
  const isGuest = vaultUser?.role === 'GUEST';

  const handleAuthFailure = useCallback(() => {
    setVaultUser(null);
    setDocuments([]);
    setTotalCount(0);
    setGuestAccess([]);
    setListSelectedDocIds([]);
  }, []);

  const restoreSession = useCallback(async () => {
    setAuthLoading(true);
    setLoginError(null);
    try {
      const me = await apiVaultMe();
      setVaultUser({ username: me.username, role: me.role, expiresAt: me.expiresAt });
    } catch (e) {
      if (!(e instanceof VaultAuthError)) {
        setLoginError(e instanceof Error ? e.message : 'Failed to restore session');
      }
      handleAuthFailure();
    } finally {
      setAuthLoading(false);
    }
  }, [handleAuthFailure]);

  const loadGuestAccess = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const resp = await apiFetchVaultGuestAccess();
      setGuestAccess(resp.data.guests);
    } catch (e) {
      if (e instanceof VaultAuthError) {
        handleAuthFailure();
        setLoginError(e.message);
        return;
      }
      setApiError(e instanceof Error ? e.message : 'Failed to load guest access list');
    }
  }, [isAdmin, handleAuthFailure]);

  const loadDocuments = useCallback(async () => {
    if (!vaultUser) return;

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
      if (e instanceof VaultAuthError) {
        handleAuthFailure();
        setLoginError(e.message);
      } else {
        setApiError(e instanceof Error ? e.message : 'Failed to load documents');
      }
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  }, [vaultUser, handleAuthFailure]);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    if (vaultUser) {
      loadDocuments();
      loadGuestAccess();
    }
  }, [vaultUser, loadDocuments, loadGuestAccess]);

  const guestForDocument = (docId: string) =>
    guestAccess.find((g) => g.documents?.some((d) => d.id === docId)) ?? null;

  const isDocShared = (docId: string) => !!guestForDocument(docId);

  const toggleListDocSelection = (docId: string) => {
    setListSelectedDocIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const openShareModal = (initialDocIds: string[] = []) => {
    const fromList = listSelectedDocIds.length > 0 ? listSelectedDocIds : initialDocIds;
    setShareSelectedDocIds(fromList);
    setShareUsername('');
    setSharePassword('');
    setShareModalVisible(true);
  };

  const closeShareModal = () => {
    setShareModalVisible(false);
    setShareSelectedDocIds([]);
    setShareUsername('');
    setSharePassword('');
  };

  const handleLogin = async () => {
    const username = loginUsername.trim();
    if (!username || !loginPassword) {
      setLoginError('Enter username and password');
      return;
    }

    setLoginLoading(true);
    setLoginError(null);
    try {
      const session = await apiVaultLogin(username, loginPassword);
      setVaultUser({
        username: session.username,
        role: session.role,
        expiresAt: session.expiresAt,
      });
      setLoginPassword('');
    } catch (e) {
      setLoginError(e instanceof Error ? e.message : 'Sign in failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await apiVaultLogout();
    handleAuthFailure();
    setLoginUsername('');
    setLoginPassword('');
    setLoginError(null);
    setApiError(null);
    setListSelectedDocIds([]);
  };

  const handleOpen = async (doc: VaultDocument) => {
    try {
      const { data } = await apiFetchVaultDocumentViewUrl(doc.id);
      await WebBrowser.openBrowserAsync(data.viewUrl);
    } catch (e) {
      if (e instanceof VaultAuthError) {
        handleAuthFailure();
        setLoginError(e.message);
        return;
      }
      Alert.alert(
        'Could not open document',
        e instanceof Error ? e.message : 'Failed to get a secure view link'
      );
    }
  };

  const handleDownload = async (doc: VaultDocument) => {
    try {
      const { data } = await apiFetchVaultDocumentViewUrl(doc.id);
      await Linking.openURL(data.viewUrl);
    } catch (e) {
      if (e instanceof VaultAuthError) {
        handleAuthFailure();
        setLoginError(e.message);
        return;
      }
      Alert.alert(
        'Could not download document',
        e instanceof Error ? e.message : 'Failed to get a secure download link'
      );
    }
  };

  const handleDelete = (doc: VaultDocument) => {
    Alert.alert('Delete document', `Remove "${displayName(doc)}" from the vault?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiDeleteVaultDocument({ id: doc.id });
            setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
            setTotalCount((c) => Math.max(0, c - 1));
            setListSelectedDocIds((prev) => prev.filter((id) => id !== doc.id));
            loadGuestAccess();
          } catch (e) {
            if (e instanceof VaultAuthError) {
              handleAuthFailure();
              setLoginError(e.message);
              return;
            }
            Alert.alert('Delete failed', e instanceof Error ? e.message : 'Unknown error');
          }
        },
      },
    ]);
  };

  const handleRevokeGuest = (guest: VaultGuestAccess) => {
    Alert.alert('Revoke access', `Remove guest access for "${guest.username}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Revoke',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiRevokeVaultGuestAccess(guest.id);
            setGuestAccess((prev) => prev.filter((g) => g.id !== guest.id));
          } catch (e) {
            if (e instanceof VaultAuthError) {
              handleAuthFailure();
              setLoginError(e.message);
              return;
            }
            Alert.alert('Revoke failed', e instanceof Error ? e.message : 'Unknown error');
          }
        },
      },
    ]);
  };

  const handleConfirmShare = async () => {
    const username = shareUsername.trim();
    if (!username || sharePassword.length < 8) {
      setApiError('Enter a username and password (at least 8 characters).');
      return;
    }
    if (shareSelectedDocIds.length === 0) {
      setApiError('Select at least one document to share.');
      return;
    }

    setIsSharing(true);
    setApiError(null);

    try {
      const resp = await apiCreateVaultGuestAccess({
        username,
        password: sharePassword,
        documentIds: shareSelectedDocIds,
      });
      const sharedDocs = documents.filter((d) => shareSelectedDocIds.includes(d.id));
      setShareResult({
        username,
        password: sharePassword,
        documentNames: sharedDocs.map(displayName),
        expiresAt: resp.data.expiresAt,
      });
      setListSelectedDocIds([]);
      closeShareModal();
      setShareResultVisible(true);
      loadGuestAccess();
    } catch (e) {
      if (e instanceof VaultAuthError) {
        handleAuthFailure();
        setLoginError(e.message);
        return;
      }
      setApiError(e instanceof Error ? e.message : 'Failed to create guest access');
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyCredentials = async () => {
    if (!shareResult) return;
    const text = [
      `Documents: ${shareResult.documentNames.join(', ')}`,
      `Username: ${shareResult.username}`,
      `Password: ${shareResult.password}`,
      `Expires: ${formatExpiryDate(shareResult.expiresAt)}`,
    ].join('\n');
    await Clipboard.setStringAsync(text);
    setCredentialsCopied(true);
    setTimeout(() => setCredentialsCopied(false), 2000);
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
      if (e instanceof VaultAuthError) {
        handleAuthFailure();
        setLoginError(e.message);
        return;
      }
      Alert.alert('Upload failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setIsUploading(false);
    }
  };

  const emptyMessage = isGuest
    ? 'No document has been assigned to your account.'
    : 'No documents yet. Upload your first file.';

  const { refreshing, onRefresh } = useRefreshControl(
    useCallback(async () => {
      if (vaultUser) {
        await loadDocuments();
        await loadGuestAccess();
        return;
      }
      await restoreSession();
    }, [vaultUser, loadDocuments, loadGuestAccess, restoreSession])
  );

  if (authLoading) {
    return (
      <ThemedView style={styles.screen}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.centered}>
            <ActivityIndicator color={colors.tint} />
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (!vaultUser) {
    return (
      <ThemedView style={styles.screen}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <KeyboardAvoidingView
            style={styles.loginWrap}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView
              contentContainerStyle={styles.loginScrollContent}
              keyboardShouldPersistTaps="handled"
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
              }>
            <View style={styles.header}>
              <View>
                <ThemedText type="title">Vault</ThemedText>
                <ThemedText style={styles.subtitle}>Sign in to access secure documents</ThemedText>
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

            <View style={[styles.loginCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MaterialIcons name="lock" size={40} color={colors.tint} style={styles.loginIcon} />
              <ThemedText type="subtitle" style={styles.loginTitle}>
                Vault sign in
              </ThemedText>
              <ThemedText style={styles.loginHint}>
                Use your vault admin or guest credentials.
              </ThemedText>

              <ThemedText type="defaultSemiBold" style={styles.loginLabel}>
                Username
              </ThemedText>
              <TextInput
                value={loginUsername}
                onChangeText={setLoginUsername}
                placeholder="vault"
                placeholderTextColor={colors.tabIconDefault}
                autoCapitalize="none"
                autoCorrect={false}
                style={[
                  styles.nameInput,
                  { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
                ]}
                editable={!loginLoading}
              />

              <ThemedText type="defaultSemiBold" style={styles.loginLabel}>
                Password
              </ThemedText>
              <TextInput
                value={loginPassword}
                onChangeText={setLoginPassword}
                placeholder="Password"
                placeholderTextColor={colors.tabIconDefault}
                secureTextEntry
                style={[
                  styles.nameInput,
                  { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
                ]}
                editable={!loginLoading}
                onSubmitEditing={handleLogin}
              />

              {loginError ? (
                <View style={[styles.banner, { backgroundColor: colors.errorMuted, borderColor: colors.error }]}>
                  <ThemedText style={{ color: colors.errorText }}>{loginError}</ThemedText>
                </View>
              ) : null}

              <Pressable
                onPress={handleLogin}
                disabled={loginLoading}
                style={[styles.loginButton, { backgroundColor: colors.tint, opacity: loginLoading ? 0.7 : 1 }]}>
                {loginLoading ? (
                  <ActivityIndicator color={colors.tintText} />
                ) : (
                  <ThemedText style={{ color: colors.tintText, fontWeight: '700' }}>Sign in</ThemedText>
                )}
              </Pressable>
            </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerMain}>
            <ThemedText type="title">Vault</ThemedText>
            <ThemedText style={styles.subtitle}>
              {isGuest
                ? `Your shared document${totalCount === 1 ? '' : 's'}`
                : `${totalCount} document${totalCount === 1 ? '' : 's'} stored in AWS`}
              {' · '}
              {vaultUser.username}
            </ThemedText>
          </View>
          <View style={styles.headerActions}>
            {isAdmin && listSelectedDocIds.length > 0 ? (
              <Pressable
                onPress={() => openShareModal()}
                style={[styles.shareSelectedBtn, { borderColor: colors.border, backgroundColor: colors.buttonSecondary }]}>
                <MaterialIcons name="share" size={18} color={colors.tint} />
                <ThemedText style={[styles.shareSelectedText, { color: colors.tint }]}>
                  {listSelectedDocIds.length}
                </ThemedText>
              </Pressable>
            ) : null}
            <Pressable
              onPress={handleLogout}
              style={[styles.themeBtn, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <MaterialIcons name="logout" size={22} color={colors.icon} />
            </Pressable>
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
        </View>

        {isGuest && vaultUser.expiresAt ? (
          <View style={[styles.infoBanner, { backgroundColor: colors.buttonSecondary, borderColor: colors.border }]}>
            <MaterialIcons name="info-outline" size={18} color={colors.tint} />
            <ThemedText style={styles.infoBannerText}>
              Your access expires on {formatExpiryDate(vaultUser.expiresAt)}.
            </ThemedText>
          </View>
        ) : null}

        {apiError ? (
          <View style={[styles.banner, { backgroundColor: colors.errorMuted, borderColor: colors.error }]}>
            <ThemedText style={{ color: colors.errorText, flex: 1 }}>{apiError}</ThemedText>
            <Pressable onPress={() => { setApiError(null); loadDocuments(); }}>
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
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
            }
            ListEmptyComponent={
              <View style={styles.centered}>
                <MaterialIcons name="folder-open" size={48} color={colors.tabIconDefault} />
                <ThemedText style={styles.emptyText}>{emptyMessage}</ThemedText>
              </View>
            }
            renderItem={({ item }) => (
              <VaultListItem
                doc={item}
                isAdmin={isAdmin}
                isSelected={listSelectedDocIds.includes(item.id)}
                isShared={isDocShared(item.id)}
                sharedGuest={guestForDocument(item.id)}
                onToggleSelect={toggleListDocSelection}
                onOpen={handleOpen}
                onDownload={handleDownload}
                onShare={(docId) => openShareModal([docId])}
                onDelete={handleDelete}
                colors={colors}
              />
            )}
            ListFooterComponent={
              isAdmin && guestAccess.length > 0 ? (
                <View style={styles.guestSection}>
                  <ThemedText type="subtitle" style={styles.guestSectionTitle}>
                    Active guest access
                  </ThemedText>
                  {guestAccess.map((guest) => (
                    <View
                      key={guest.id}
                      style={[styles.guestRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <View style={styles.guestRowText}>
                        <ThemedText type="defaultSemiBold">{guest.username}</ThemedText>
                        <ThemedText style={styles.meta} numberOfLines={2}>
                          {guest.documents?.length
                            ? `${guest.documents.map(displayName).join(', ')} · expires ${formatExpiryDate(guest.expiresAt)}`
                            : `Expires ${formatExpiryDate(guest.expiresAt)}`}
                        </ThemedText>
                      </View>
                      <Pressable onPress={() => handleRevokeGuest(guest)} style={styles.actionIcon}>
                        <MaterialIcons name="delete-outline" size={20} color={colors.errorText} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : null
            }
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
                  { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
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

        <Modal visible={shareModalVisible} animationType="slide" transparent onRequestClose={closeShareModal}>
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Pressable style={styles.modalBackdrop} onPress={closeShareModal} />
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.modalScrollContent}>
              <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ThemedText type="subtitle">Share document access</ThemedText>
                <ThemedText style={styles.modalFileHint}>
                  Guest access lasts 14 days and does not refresh on login.
                </ThemedText>
                <ThemedText style={styles.modalFileHint}>
                  Sharing {shareSelectedDocIds.length} document{shareSelectedDocIds.length === 1 ? '' : 's'}.
                </ThemedText>

                <ThemedText type="defaultSemiBold" style={styles.loginLabel}>
                  Guest username
                </ThemedText>
                <TextInput
                  value={shareUsername}
                  onChangeText={setShareUsername}
                  placeholder="guest_username"
                  placeholderTextColor={colors.tabIconDefault}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[
                    styles.nameInput,
                    { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
                  ]}
                  editable={!isSharing}
                />

                <ThemedText type="defaultSemiBold" style={styles.loginLabel}>
                  Guest password
                </ThemedText>
                <TextInput
                  value={sharePassword}
                  onChangeText={setSharePassword}
                  placeholder="At least 8 characters"
                  placeholderTextColor={colors.tabIconDefault}
                  secureTextEntry
                  style={[
                    styles.nameInput,
                    { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
                  ]}
                  editable={!isSharing}
                />

                <View style={styles.modalActions}>
                  <Pressable
                    onPress={closeShareModal}
                    disabled={isSharing}
                    style={[styles.modalBtn, { borderColor: colors.border, backgroundColor: colors.buttonSecondary }]}>
                    <ThemedText>Cancel</ThemedText>
                  </Pressable>
                  <Pressable
                    onPress={handleConfirmShare}
                    disabled={
                      isSharing ||
                      !shareUsername.trim() ||
                      sharePassword.length < 8 ||
                      shareSelectedDocIds.length === 0
                    }
                    style={[styles.modalBtn, { backgroundColor: colors.tint, opacity: isSharing ? 0.7 : 1 }]}>
                    {isSharing ? (
                      <ActivityIndicator color={colors.tintText} />
                    ) : (
                      <ThemedText style={{ color: colors.tintText, fontWeight: '600' }}>Create access</ThemedText>
                    )}
                  </Pressable>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>

        <Modal
          visible={shareResultVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setShareResultVisible(false)}>
          <View style={styles.modalOverlay}>
            <Pressable style={styles.modalBackdrop} onPress={() => setShareResultVisible(false)} />
            <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ThemedText type="subtitle">Guest access created</ThemedText>
              {shareResult ? (
                <>
                  <ThemedText style={styles.modalFileHint}>
                    Share these credentials with the guest. The password will not be shown again.
                  </ThemedText>
                  <ThemedText style={styles.resultLine}>
                    <ThemedText type="defaultSemiBold">Documents: </ThemedText>
                    {shareResult.documentNames.join(', ')}
                  </ThemedText>
                  <ThemedText style={styles.resultLine}>
                    <ThemedText type="defaultSemiBold">Username: </ThemedText>
                    {shareResult.username}
                  </ThemedText>
                  <ThemedText style={styles.resultLine}>
                    <ThemedText type="defaultSemiBold">Password: </ThemedText>
                    {shareResult.password}
                  </ThemedText>
                  <ThemedText style={styles.meta}>
                    Expires: {formatExpiryDate(shareResult.expiresAt)}
                  </ThemedText>
                </>
              ) : null}
              <View style={styles.modalActions}>
                <Pressable
                  onPress={handleCopyCredentials}
                  style={[styles.modalBtn, { borderColor: colors.border, backgroundColor: colors.buttonSecondary }]}>
                  <ThemedText>{credentialsCopied ? 'Copied' : 'Copy'}</ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setShareResultVisible(false);
                    setShareResult(null);
                  }}
                  style={[styles.modalBtn, { backgroundColor: colors.tint }]}>
                  <ThemedText style={{ color: colors.tintText, fontWeight: '600' }}>Done</ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {isAdmin ? (
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
        ) : null}
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
  headerMain: { flex: 1 },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  shareSelectedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  shareSelectedText: { fontSize: 13, fontWeight: '700' },
  subtitle: { marginTop: 4, opacity: 0.7 },
  loginWrap: { flex: 1 },
  loginScrollContent: { flexGrow: 1, paddingBottom: 24 },
  loginCard: {
    marginHorizontal: 20,
    marginTop: 24,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  loginIcon: { alignSelf: 'center', marginBottom: 4 },
  loginTitle: { textAlign: 'center' },
  loginHint: { textAlign: 'center', opacity: 0.7, lineHeight: 20, marginBottom: 8 },
  loginLabel: { marginTop: 4 },
  loginButton: {
    minHeight: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  themeBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBanner: {
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoBannerText: { flex: 1, fontSize: 14 },
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
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  checkboxBtn: { padding: 2 },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minWidth: 0 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, gap: 4, minWidth: 0 },
  originalName: { fontSize: 12, opacity: 0.55 },
  meta: { fontSize: 13, opacity: 0.65 },
  sharedMeta: { fontSize: 12, opacity: 0.7 },
  rowActions: { flexDirection: 'row', alignItems: 'center' },
  actionIcon: { padding: 6 },
  actionDisabled: { opacity: 0.45 },
  guestSection: { marginTop: 24, gap: 10, paddingBottom: 24 },
  guestSectionTitle: { marginBottom: 4 },
  guestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  guestRowText: { flex: 1, gap: 4 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalScrollContent: { flexGrow: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    padding: 20,
    paddingBottom: 28,
    gap: 12,
  },
  modalFileHint: { opacity: 0.65, fontSize: 14, lineHeight: 20 },
  resultLine: { fontSize: 15, lineHeight: 22 },
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
});
