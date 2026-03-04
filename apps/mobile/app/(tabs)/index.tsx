import { ScrollView, View, Text, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/src/lib/api';
import { useAuthStore } from '@/src/store/authStore';

interface StatCardProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  color: string;
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuthStore();

  const { data: stats, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => apiClient.get('/api/dashboard/stats').then(r => r.data),
  });

  const { data: projects } = useQuery({
    queryKey: ['recent-projects'],
    queryFn: () => apiClient.get('/api/projects?limit=3').then(r => r.data),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
    >
      {/* Greeting */}
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>Good day,</Text>
        <Text style={styles.greetingName}>{user?.name ?? 'User'} 👋</Text>
      </View>

      {/* Stats */}
      <Text style={styles.sectionTitle}>Overview</Text>
      <View style={styles.statsGrid}>
        <StatCard icon="folder-open" label="Projects" value={String(stats?.projects ?? '–')} color="#6366f1" />
        <StatCard icon="flash" label="AI Runs" value={String(stats?.aiRuns ?? '–')} color="#10b981" />
        <StatCard icon="people" label="Team" value={String(stats?.members ?? '–')} color="#f59e0b" />
        <StatCard icon="trending-up" label="Credits" value={String(stats?.credits ?? '–')} color="#ef4444" />
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsRow}>
        {[
          { icon: 'add-circle-outline' as const, label: 'New Project', color: '#6366f1' },
          { icon: 'chatbubble-outline' as const, label: 'Ask AI', color: '#10b981' },
          { icon: 'cloud-upload-outline' as const, label: 'Deploy', color: '#f59e0b' },
          { icon: 'bar-chart-outline' as const, label: 'Analytics', color: '#8b5cf6' },
        ].map(action => (
          <TouchableOpacity key={action.label} style={styles.actionBtn} activeOpacity={0.7}>
            <View style={[styles.actionIcon, { backgroundColor: action.color + '22' }]}>
              <Ionicons name={action.icon} size={22} color={action.color} />
            </View>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Projects */}
      <Text style={styles.sectionTitle}>Recent Projects</Text>
      {(projects?.data ?? []).length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="folder-open-outline" size={36} color="#374151" />
          <Text style={styles.emptyText}>No projects yet</Text>
        </View>
      ) : (
        (projects?.data ?? []).map((p: any) => (
          <TouchableOpacity key={p.id} style={styles.projectCard} activeOpacity={0.7}>
            <View style={styles.projectInfo}>
              <Text style={styles.projectName}>{p.name}</Text>
              <Text style={styles.projectDesc} numberOfLines={1}>{p.description ?? 'No description'}</Text>
            </View>
            <View style={[styles.projectStatus, { backgroundColor: p.status === 'ACTIVE' ? '#10b981' : '#374151' }]}>
              <Text style={styles.projectStatusText}>{p.status}</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 20, paddingBottom: 40 },
  greeting: { marginBottom: 28 },
  greetingText: { fontSize: 14, color: '#6b7280' },
  greetingName: { fontSize: 26, fontWeight: '800', color: '#ffffff', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#d1d5db', marginBottom: 14, marginTop: 8 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: '#1f2937',
    gap: 6,
  },
  statValue: { fontSize: 24, fontWeight: '800', color: '#ffffff' },
  statLabel: { fontSize: 12, color: '#6b7280' },
  actionsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  actionBtn: { flex: 1, alignItems: 'center', gap: 8 },
  actionIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 11, color: '#9ca3af', fontWeight: '600', textAlign: 'center' },
  emptyCard: {
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 32,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  emptyText: { color: '#4b5563', fontSize: 14 },
  projectCard: {
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  projectInfo: { flex: 1 },
  projectName: { fontSize: 15, fontWeight: '700', color: '#ffffff' },
  projectDesc: { fontSize: 13, color: '#6b7280', marginTop: 3 },
  projectStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  projectStatusText: { fontSize: 11, fontWeight: '700', color: '#ffffff' },
});
