import { TaskFab } from '@/components/task-fab';
import { TaskListItem } from '@/components/task-list-item';
import { TaskFilterModal } from '@/components/task-filter-modal';
import { TaskModal } from '@/components/task-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useThemePreference } from '@/context/theme-context';
import {
  createTask as apiCreateTask,
  deleteTask as apiDeleteTask,
  fetchTaskAssignees as apiFetchTaskAssignees,
  fetchTasks as apiFetchTasks,
  updateTask as apiUpdateTask,
} from '@/services/api';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Task, TaskAssigneeUser, TaskAsset, TaskStatus } from '@/types/tasks';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Draft = {
  title: string;
  description: string;
  asset: null;
  assignedTo: null;
  status: null;
};

export default function TaskScreen() {
  const scheme = useColorScheme();
  const { toggleTheme } = useThemePreference();
  const { logout, user } = useAuth();
  const colors = Colors[scheme ?? 'light'];

  const onLogout = () => {
    Alert.alert('Sign out', 'Sign out of your account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          void logout();
        },
      },
    ]);
  };
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assignees, setAssignees] = useState<TaskAssigneeUser[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [draft, setDraft] = useState<Draft>({
    title: '',
    description: '',
    asset: null,
    assignedTo: null,
    status: null,
  });

  const [selectedAsset, setSelectedAsset] = useState<TaskAsset | null>(null);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | null>(null);

  const editingTask = useMemo(() => {
    if (!editingTaskId) return null;
    return tasks.find((t) => t.id === editingTaskId) ?? null;
  }, [editingTaskId, tasks]);

  const hasActiveFilter =
    selectedAsset !== null || selectedAssigneeId !== null || selectedStatus !== null;

  const loadAssignees = useCallback(async () => {
    try {
      const users = await apiFetchTaskAssignees();
      setAssignees(users);
    } catch {
      setAssignees([]);
    }
  }, []);

  const loadAllTasks = async (filters?: {
    asset?: TaskAsset | null;
    assignedTo?: string | null;
    status?: TaskStatus | null;
  }) => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setApiError(null);

    try {
      const limit = 50;
      let page = 1;
      let allTasks: Task[] = [];
      let firstTotalCount = 0;

      while (true) {
        const resp = await apiFetchTasks({
          page,
          limit,
          asset: filters?.asset ?? null,
          assignedTo: filters?.assignedTo ?? null,
          status: filters?.status ?? null,
        });
        if (requestId !== requestIdRef.current) return;

        if (page === 1) {
          firstTotalCount = resp.data.pagination.totalCount;
        }

        allTasks = [...allTasks, ...resp.data.tasks];

        if (!resp.data.pagination.hasNextPage) break;
        page += 1;
      }

      if (requestId !== requestIdRef.current) return;
      setTasks(allTasks);
      setTotalCount(firstTotalCount);
    } catch (e) {
      if (requestId !== requestIdRef.current) return;
      setTasks([]);
      setTotalCount(0);
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  };

  const loadInitialUnfiltered = async () => {
    await loadAllTasks();
  };

  const loadFilteredAllMatches = async () => {
    await loadAllTasks({
      asset: selectedAsset,
      assignedTo: selectedAssigneeId,
      status: selectedStatus,
    });
  };

  const reloadForCurrentFilters = useCallback(async () => {
    if (hasActiveFilter) {
      await loadFilteredAllMatches();
      return;
    }
    await loadInitialUnfiltered();
  }, [hasActiveFilter, selectedAsset, selectedAssigneeId, selectedStatus]);

  const { refreshing, onRefresh } = useRefreshControl(reloadForCurrentFilters);

  useEffect(() => {
    void loadAssignees();
  }, [loadAssignees]);

  useEffect(() => {
    if (hasActiveFilter) {
      void loadFilteredAllMatches();
    } else {
      void loadInitialUnfiltered();
    }
  }, [hasActiveFilter, selectedAsset, selectedAssigneeId, selectedStatus]);

  const openCreate = () => {
    setApiError(null);
    setModalMode('create');
    setEditingTaskId(null);
    setDraft({ title: '', description: '', asset: null, assignedTo: null, status: null });
    setModalVisible(true);
  };

  const openEdit = (taskId: string) => {
    const t = tasks.find((x) => x.id === taskId);
    if (!t) return;
    setApiError(null);
    setModalMode('edit');
    setEditingTaskId(taskId);
    setDraft({
      title: t.title,
      description: t.description ?? '',
      asset: null,
      assignedTo: null,
      status: null,
    });
    setModalVisible(true);
  };

  const closeModal = () => {
    setApiError(null);
    setModalVisible(false);
  };

  const handleSubmit = async (value: {
    title: string;
    description?: string;
    asset: Task['asset'];
    assignedToUserId: string;
    status: Task['status'];
  }) => {
    setApiError(null);
    try {
      if (modalMode === 'create') {
        await apiCreateTask({
          title: value.title,
          description: value.description,
          asset: value.asset,
          assignedToUserId: value.assignedToUserId,
          status: value.status,
        });

        setModalVisible(false);
        setEditingTaskId(null);
        await reloadForCurrentFilters();
        return;
      }

      if (modalMode === 'edit' && editingTaskId) {
        await apiUpdateTask({
          id: editingTaskId,
          title: value.title,
          description: value.description,
          asset: value.asset,
          assignedToUserId: value.assignedToUserId,
          status: value.status,
        });

        setModalVisible(false);
        await reloadForCurrentFilters();
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to submit task';
      setApiError(message);
    }
  };

  const handleSetStatus = async (taskId: string, status: Task['status']) => {
    const t = tasks.find((x) => x.id === taskId);
    if (!t) return;

    setApiError(null);
    try {
      await apiUpdateTask({
        id: taskId,
        title: t.title,
        description: t.description,
        asset: t.asset,
        assignedToUserId: t.assignedToUserId,
        status,
      });
      await reloadForCurrentFilters();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to update task status';
      setApiError(message);
    }
  };

  const handleDelete = async (taskId: string) => {
    setApiError(null);
    try {
      await apiDeleteTask({ id: taskId });

      if (editingTaskId === taskId) {
        setModalVisible(false);
        setEditingTaskId(null);
      }

      await reloadForCurrentFilters();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to delete task';
      setApiError(message);
    }
  };

  const initialValue = useMemo(() => {
    if (modalMode === 'create') {
      return draft;
    }
    if (editingTask) {
      return {
        title: editingTask.title,
        description: editingTask.description ?? '',
        asset: editingTask.asset,
        assignedTo: editingTask.assignedToUserId,
        status: editingTask.status,
      };
    }
    return draft;
  }, [draft, editingTask, modalMode]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ThemedView style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleBlock}>
            <ThemedText type="subtitle" style={styles.headerTitle}>
              Tasks
            </ThemedText>
            {user ? (
              <ThemedText style={styles.userLine}>
                {user.displayName || user.username} · {user.role}
              </ThemedText>
            ) : null}
          </View>
          <View style={styles.headerRight}>
            <View
              style={[
                styles.countPill,
                { backgroundColor: colors.buttonSecondary, borderColor: colors.border },
              ]}>
              <ThemedText style={styles.countText}>{totalCount}</ThemedText>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Switch to ${scheme === 'dark' ? 'light' : 'dark'} mode`}
              onPress={toggleTheme}
              style={({ pressed }) => [
                styles.themeButton,
                {
                  backgroundColor: colors.buttonSecondary,
                  borderColor: colors.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              <MaterialIcons name={scheme === 'dark' ? 'light-mode' : 'dark-mode'} size={18} color={colors.text} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sign out"
              onPress={onLogout}
              style={({ pressed }) => [
                styles.themeButton,
                {
                  backgroundColor: colors.buttonSecondary,
                  borderColor: colors.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              <MaterialIcons name="logout" size={18} color={colors.text} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Filter tasks"
              onPress={() => setFilterModalVisible(true)}
              style={({ pressed }) => [
                styles.filterButton,
                {
                  backgroundColor: colors.buttonSecondary,
                  borderColor: colors.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              <MaterialIcons name="filter-list" size={18} color={colors.text} />
              <ThemedText style={[styles.filterButtonText, { color: colors.text }]}>Filter</ThemedText>
            </Pressable>
          </View>
        </View>
        <ThemedText style={styles.headerSubtitle}>Swipe a task to update status</ThemedText>
      </ThemedView>

      <FlatList
        data={tasks}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
        }
        ListEmptyComponent={
          isLoading ? (
            <View />
          ) : (
            <View style={styles.empty}>
              {totalCount === 0 ? (
                hasActiveFilter ? (
                  <>
                    <ThemedText type="defaultSemiBold" style={styles.emptyTitle}>
                      No tasks match your filters
                    </ThemedText>
                    <ThemedText style={styles.emptyText}>Try selecting “All” in any filter.</ThemedText>
                  </>
                ) : (
                  <>
                    <ThemedText type="defaultSemiBold" style={styles.emptyTitle}>
                      No tasks yet
                    </ThemedText>
                    <ThemedText style={styles.emptyText}>Tap + to create one.</ThemedText>
                  </>
                )
              ) : null}
            </View>
          )
        }
        renderItem={({ item }) => (
          <TaskListItem
            task={item}
            onPress={openEdit}
            onSetStatus={handleSetStatus}
            onDelete={handleDelete}
          />
        )}
      />

      <TaskFab onPress={openCreate} />

      <TaskFilterModal
        visible={filterModalVisible}
        selectedAsset={selectedAsset}
        onSelectAsset={setSelectedAsset}
        assignees={assignees}
        selectedAssigneeId={selectedAssigneeId}
        onSelectAssignee={setSelectedAssigneeId}
        selectedStatus={selectedStatus}
        onSelectStatus={setSelectedStatus}
        onClose={() => setFilterModalVisible(false)}
      />

      <TaskModal
        visible={modalVisible}
        mode={modalMode}
        initialValue={initialValue}
        assignees={assignees}
        onClose={closeModal}
        onSubmit={handleSubmit}
        apiError={apiError}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerTitleBlock: {
    flexShrink: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  userLine: {
    fontSize: 12,
    opacity: 0.65,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 12,
    opacity: 0.55,
  },
  countPill: {
    minWidth: 34,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: 13,
    fontWeight: '800',
    opacity: 0.8,
  },
  themeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '800',
  },
  listContent: {
    padding: 16,
    paddingBottom: 120,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 72,
  },
  emptyTitle: {
    fontSize: 15,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    opacity: 0.62,
  },
});
