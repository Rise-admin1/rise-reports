import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  createAppUser,
  deleteAppUser,
  fetchAppUsers,
  resetAppUserPassword,
  updateAppUser,
} from '@/services/api';
import {
  REPORT_PERMISSION_GROUPS,
  REPORT_PERMISSION_LABELS,
  formatPermissionWithAsset,
  type AppRole,
  type AppUser,
  type ReportPermission,
} from '@/types/appAuth';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Redirect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ROLES: AppRole[] = ['SUPER_ADMIN', 'ADMIN', 'USER'];

export default function AccountsScreen() {
  const { isSuperAdmin, user: currentUser } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AppUser | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<AppRole>('ADMIN');
  const [permissions, setPermissions] = useState<ReportPermission[]>([]);
  const [saving, setSaving] = useState(false);

  const loadUsers = useCallback(async () => {
    const list = await fetchAppUsers();
    setUsers(list);
  }, []);

  useEffect(() => {
    if (!isSuperAdmin) return;
    let mounted = true;
    (async () => {
      try {
        await loadUsers();
      } catch (error) {
        Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load users');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isSuperAdmin, loadUsers]);

  if (!isSuperAdmin) {
    return <Redirect href="/home" />;
  }

  const openCreate = () => {
    setEditing(null);
    setUsername('');
    setPassword('');
    setDisplayName('');
    setRole('ADMIN');
    setPermissions([]);
    setModalOpen(true);
  };

  const openEdit = (target: AppUser) => {
    setEditing(target);
    setUsername(target.username);
    setPassword('');
    setDisplayName(target.displayName || '');
    setRole(target.role);
    setPermissions(target.permissions || []);
    setModalOpen(true);
  };

  const togglePermission = (permission: ReportPermission) => {
    setPermissions((current) =>
      current.includes(permission)
        ? current.filter((item) => item !== permission)
        : [...current, permission]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadUsers();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to refresh');
    } finally {
      setRefreshing(false);
    }
  };

  const onSave = async () => {
    setSaving(true);
    try {
      if (editing) {
        await updateAppUser(editing.id, {
          displayName: displayName.trim() || null,
          role,
          permissions: role === 'ADMIN' ? permissions : [],
        });
        if (password.trim()) {
          await resetAppUserPassword(editing.id, password.trim());
        }
      } else {
        if (!username.trim() || !password.trim()) {
          Alert.alert('Missing fields', 'Username and password are required');
          return;
        }
        await createAppUser({
          username: username.trim(),
          password: password.trim(),
          displayName: displayName.trim() || null,
          role,
          permissions: role === 'ADMIN' ? permissions : [],
        });
      }
      setModalOpen(false);
      await loadUsers();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const onToggleActive = (target: AppUser) => {
    Alert.alert(
      target.isActive ? 'Deactivate user' : 'Activate user',
      `${target.isActive ? 'Deactivate' : 'Activate'} ${target.username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            void (async () => {
              try {
                await updateAppUser(target.id, { isActive: !target.isActive });
                await loadUsers();
              } catch (error) {
                Alert.alert('Error', error instanceof Error ? error.message : 'Update failed');
              }
            })();
          },
        },
      ]
    );
  };

  const onDelete = (target: AppUser) => {
    Alert.alert('Delete user', `Permanently delete ${target.username}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await deleteAppUser(target.id);
              await loadUsers();
            } catch (error) {
              Alert.alert('Error', error instanceof Error ? error.message : 'Delete failed');
            }
          })();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ThemedView style={[styles.header, { borderBottomColor: colors.border }]}>
        <ThemedText type="title" style={styles.headerTitle}>
          Accounts
        </ThemedText>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.tint }]}
          onPress={openCreate}>
          <MaterialIcons name="person-add" size={18} color="#fff" />
          <ThemedText style={styles.addButtonText}>New</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.tint} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
          }>
          {users.map((item) => (
            <View
              key={item.id}
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <ThemedText type="subtitle">{item.displayName || item.username}</ThemedText>
                  <ThemedText style={styles.meta}>
                    @{item.username} · {item.role}
                    {!item.isActive ? ' · inactive' : ''}
                  </ThemedText>
                  {item.role === 'ADMIN' ? (
                    <ThemedText style={styles.meta}>
                      {item.permissions.length
                        ? item.permissions.map((p) => formatPermissionWithAsset(p)).join(' · ')
                        : 'No report permissions'}
                    </ThemedText>
                  ) : null}
                </View>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => openEdit(item)}>
                  <ThemedText style={{ color: colors.tint }}>Edit</ThemedText>
                </TouchableOpacity>
                {item.id !== currentUser?.id ? (
                  <>
                    <TouchableOpacity onPress={() => onToggleActive(item)}>
                      <ThemedText style={{ color: colors.tint }}>
                        {item.isActive ? 'Deactivate' : 'Activate'}
                      </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => onDelete(item)}>
                      <ThemedText style={{ color: '#c0392b' }}>Delete</ThemedText>
                    </TouchableOpacity>
                  </>
                ) : null}
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.background }]}>
            <ThemedText type="subtitle">{editing ? 'Edit account' : 'Create account'}</ThemedText>
            <ScrollView style={{ maxHeight: 480 }}>
              {!editing ? (
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                  placeholder="Username"
                  placeholderTextColor={colors.icon}
                  autoCapitalize="none"
                  value={username}
                  onChangeText={setUsername}
                />
              ) : null}
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                placeholder={editing ? 'New password (optional)' : 'Password'}
                placeholderTextColor={colors.icon}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                placeholder="Display name"
                placeholderTextColor={colors.icon}
                value={displayName}
                onChangeText={setDisplayName}
              />

              <ThemedText style={styles.sectionLabel}>Role</ThemedText>
              <View style={styles.roleRow}>
                {ROLES.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.roleChip,
                      {
                        borderColor: colors.border,
                        backgroundColor: role === item ? colors.tint : colors.card,
                      },
                    ]}
                    onPress={() => setRole(item)}>
                    <ThemedText style={{ color: role === item ? '#fff' : colors.text, fontSize: 12 }}>
                      {item}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>

              {role === 'ADMIN' ? (
                <>
                  <ThemedText style={styles.sectionLabel}>Report permissions</ThemedText>
                  {REPORT_PERMISSION_GROUPS.map((group) => (
                    <View key={group.asset} style={styles.permissionGroup}>
                      <ThemedText style={styles.assetLabel}>{group.asset}</ThemedText>
                      {group.permissions.map((permission) => {
                        const selected = permissions.includes(permission);
                        return (
                          <TouchableOpacity
                            key={permission}
                            style={styles.permissionRow}
                            onPress={() => togglePermission(permission)}>
                            <MaterialIcons
                              name={selected ? 'check-box' : 'check-box-outline-blank'}
                              size={22}
                              color={selected ? colors.tint : colors.icon}
                            />
                            <ThemedText>{REPORT_PERMISSION_LABELS[permission]}</ThemedText>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ))}
                </>
              ) : null}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalOpen(false)} disabled={saving}>
                <ThemedText>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.tint, opacity: saving ? 0.7 : 1 }]}
                onPress={onSave}
                disabled={saving}>
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText style={{ color: '#fff', fontWeight: '700' }}>Save</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { flex: 1, fontSize: 24, fontWeight: '700' },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: { color: '#fff', fontWeight: '700' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, gap: 12 },
  card: { borderWidth: 1, borderRadius: 12, padding: 14, gap: 10 },
  cardTop: { flexDirection: 'row', gap: 8 },
  meta: { fontSize: 12, opacity: 0.7, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 16 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
  },
  sectionLabel: { marginTop: 12, marginBottom: 6, fontWeight: '600' },
  permissionGroup: { marginBottom: 10 },
  assetLabel: {
    fontSize: 13,
    fontWeight: '700',
    opacity: 0.8,
    marginTop: 4,
    marginBottom: 2,
  },
  roleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roleChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  permissionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, paddingLeft: 4 },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  saveButton: {
    minWidth: 96,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
});
