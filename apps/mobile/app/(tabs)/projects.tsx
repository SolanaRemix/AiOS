import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/src/lib/api';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#10b981',
  INACTIVE: '#6b7280',
  ARCHIVED: '#374151',
};

export default function ProjectsScreen() {
  const [search, setSearch] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiClient.get('/api/projects').then(r => r.data),
  });

  const projects: any[] = (data?.data ?? []).filter((p: any) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchWrapper}>
        <Ionicons name="search-outline" size={18} color="#6b7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search projects..."
          placeholderTextColor="#4b5563"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator color="#6366f1" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={projects}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          onRefresh={refetch}
          refreshing={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="folder-open-outline" size={48} color="#374151" />
              <Text style={styles.emptyText}>No projects found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} activeOpacity={0.7}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardName}>{item.name}</Text>
                <View style={[styles.badge, { backgroundColor: (STATUS_COLORS[item.status] ?? '#374151') + '33' }]}>
                  <Text style={[styles.badgeText, { color: STATUS_COLORS[item.status] ?? '#6b7280' }]}>
                    {item.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardDesc} numberOfLines={2}>
                {item.description ?? 'No description provided'}
              </Text>
              <View style={styles.cardFooter}>
                <View style={styles.metaItem}>
                  <Ionicons name="people-outline" size={13} color="#6b7280" />
                  <Text style={styles.metaText}>{item._count?.members ?? 0} members</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="flash-outline" size={13} color="#6b7280" />
                  <Text style={styles.metaText}>{item._count?.agents ?? 0} agents</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#374151" />
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 12,
    margin: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#1f2937',
    height: 46,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: '#ffffff', fontSize: 14 },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  card: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardName: { flex: 1, fontSize: 16, fontWeight: '700', color: '#ffffff' },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  cardDesc: { fontSize: 13, color: '#9ca3af', lineHeight: 18, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#6b7280' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { color: '#4b5563', fontSize: 15 },
});
