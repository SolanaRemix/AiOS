import { useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface StatCard {
  label: string;
  value: string;
  delta?: string;
  positive?: boolean;
}

interface ActivityItem {
  id: string;
  agentName: string;
  action: string;
  time: string;
  status: 'success' | 'running' | 'failed';
}

const MOCK_STATS: StatCard[] = [
  { label: 'Active Agents', value: '4', delta: '+2', positive: true },
  { label: 'Total Executions', value: '1,284', delta: '+38', positive: true },
  { label: 'Memory Usage', value: '2.1 GB', delta: '+0.3 GB', positive: false },
  { label: 'API Calls', value: '9,432', delta: '+521', positive: true },
];

const MOCK_ACTIVITY: ActivityItem[] = [
  { id: '1', agentName: 'research-agent', action: 'Completed research on AI trends', time: '2m ago', status: 'success' },
  { id: '2', agentName: 'coding-agent', action: 'Generating TypeScript types', time: '5m ago', status: 'running' },
  { id: '3', agentName: 'llm-agent', action: 'Answered user query', time: '8m ago', status: 'success' },
  { id: '4', agentName: 'automation-agent', action: 'Workflow execution failed', time: '15m ago', status: 'failed' },
  { id: '5', agentName: 'terminal-agent', action: 'Ran build script', time: '22m ago', status: 'success' },
];

const STATUS_COLORS = {
  success: '#00FF88',
  running: '#00F5FF',
  failed: '#FF4560',
};

export default function DashboardScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<StatCard[]>(MOCK_STATS);
  const [activity] = useState<ActivityItem[]>(MOCK_ACTIVITY);

  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: fetch from API
    await new Promise(resolve => setTimeout(resolve, 1000));
    setStats([...MOCK_STATS]);
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00F5FF" />}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>AiOS Dashboard</Text>
          <Text style={styles.headerSubtitle}>System overview</Text>
        </View>

        <Text style={styles.sectionTitle}>Stats</Text>
        <View style={styles.statsGrid}>
          {stats.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
              {stat.delta && (
                <Text style={[styles.statDelta, { color: stat.positive ? '#00FF88' : '#FF4560' }]}>
                  {stat.delta}
                </Text>
              )}
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityList}>
          {activity.map((item) => (
            <View key={item.id} style={styles.activityItem}>
              <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[item.status] }]} />
              <View style={styles.activityContent}>
                <Text style={styles.activityAgent}>{item.agentName}</Text>
                <Text style={styles.activityAction}>{item.action}</Text>
              </View>
              <Text style={styles.activityTime}>{item.time}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080810',
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B6B8A',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B6B8A',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 12,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#0D0D1A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1A1A2E',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#00F5FF',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B6B8A',
    marginTop: 4,
  },
  statDelta: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  activityList: {
    gap: 4,
    paddingBottom: 32,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D0D1A',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1A1A2E',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityAgent: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  activityAction: {
    fontSize: 12,
    color: '#6B6B8A',
    marginTop: 2,
  },
  activityTime: {
    fontSize: 11,
    color: '#4A4A6A',
    marginLeft: 8,
  },
});
