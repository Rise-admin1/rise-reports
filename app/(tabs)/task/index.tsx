import { TaskFab } from '@/components/task-fab';
import { TaskListItem } from '@/components/task-list-item';
import { TaskFilterModal } from '@/components/task-filter-modal';
import { TaskModal } from '@/components/task-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import {
  createTask as apiCreateTask,
  deleteTask as apiDeleteTask,
  fetchTasks as apiFetchTasks,
  updateTask as apiUpdateTask,
} from '@/services/api';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Task, TaskAssignee, TaskAsset, TaskStatus } from '@/types/tasks';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
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
  const colors = Colors[scheme ?? 'light'];

  const [tasks, setTasks] = useState<Task[]>([]);
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
  const [selectedAssignee, setSelectedAssignee] = useState<TaskAssignee | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | null>(null);

  const editingTask = useMemo(() => {
    if (!editingTaskId) return null;
    return tasks.find((t) => t.id === editingTaskId) ?? null;
  }, [editingTaskId, tasks]);

  const hasActiveFilter = selectedAsset !== null || selectedAssignee !== null || selectedStatus !== null;

  const loadInitialUnfiltered = async () => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setApiError(null);

    try {
      const resp = await apiFetchTasks({ page: 1, limit: 10 });
      if (requestId !== requestIdRef.current) return;
      setTasks(resp.data.tasks);
      setTotalCount(resp.data.pagination.totalCount);
    } catch (e) {
      if (requestId !== requestIdRef.current) return;
      setTasks([]);
      setTotalCount(0);
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  };

  const loadFilteredAllMatches = async () => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setApiError(null);

    try {
      const limit = 10;
      let page = 1;
      let allTasks: Task[] = [];
      let firstTotalCount = 0;

      // Fetch page by page until the backend says there is no next page.
      // This satisfies "first 10 then based on filter get the rest".
      while (true) {
        const resp = await apiFetchTasks({
          page,
          limit,
          asset: selectedAsset,
          assignedTo: selectedAssignee,
          status: selectedStatus,
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

  const reloadForCurrentFilters = async () => {
    if (hasActiveFilter) {
      await loadFilteredAllMatches();
      return;
    }
    await loadInitialUnfiltered();
  };

  useEffect(() => {
    if (hasActiveFilter) {
      void loadFilteredAllMatches();
    } else {
      void loadInitialUnfiltered();
    }
  }, [hasActiveFilter, selectedAsset, selectedAssignee, selectedStatus]);

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
    assignedTo: Task['assignedTo'];
    status: Task['status'];
  }) => {
    setApiError(null);
    try {
      if (modalMode === 'create') {
        await apiCreateTask({
          title: value.title,
          description: value.description,
          asset: value.asset,
          assignedTo: value.assignedTo,
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
          assignedTo: value.assignedTo,
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
        assignedTo: t.assignedTo,
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
        assignedTo: editingTask.assignedTo,
        status: editingTask.status,
      };
    }
    return draft;
  }, [draft, editingTask, modalMode]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ThemedView style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerTopRow}>
          <ThemedText type="subtitle" style={styles.headerTitle}>
            Tasks
          </ThemedText>
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
        selectedAssignee={selectedAssignee}
        onSelectAssignee={setSelectedAssignee}
        selectedStatus={selectedStatus}
        onSelectStatus={setSelectedStatus}
        onClose={() => setFilterModalVisible(false)}
      />

      <TaskModal
        visible={modalVisible}
        mode={modalMode}
        initialValue={initialValue}
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
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

