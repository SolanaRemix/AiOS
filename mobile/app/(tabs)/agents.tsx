import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Agent {
  id: string;
  name: string;
  model: string;
  status: 'running' | 'stopped' | 'paused' | 'failed';
  description: string;
  lastRun?: string;
}

const MOCK_AGENTS: Agent[] = [
  {
    id: 'ag_1',
    name: 'research-agent',
    model: 'gpt-4o',
    status: 'running',
    description: 'Web research and summarization',
    lastRun: '2m ago',
  },
  {
    id: 'ag_2',
    name: 'coding-agent',
    model: 'claude-3-5-sonnet-20241022',
    status: 'running',
    description: 'Code generation and debugging',
    lastRun: '5m ago',
  },
  {
    id: 'ag_3',
    name: 'llm-agent',
    model: 'gpt-4o-mini',
    status: 'stopped',
    description: 'General-purpose conversational assistant',
    lastRun: '1h ago',
  },
  {
    id: 'ag_4',
    name: 'automation-agent',
    model: 'gpt-4o',
    status: 'paused',
    description: 'Workflow automation and task chaining',
    lastRun: '3h ago',
  },
];

const STATUS_STYLES: Record<Agent['status'], { bg: string; text: string; label: string }> = {
  running: { bg: 'rgba(0, 255, 136, 0.15)', text: '#00FF88', label: 'Running' },
  stopped: { bg: 'rgba(106, 106, 138, 0.15)', text: '#6B6B8A', label: 'Stopped' },
  paused: { bg: 'rgba(255, 180, 0, 0.15)', text: '#FFB400', label: 'Paused' },
  failed: { bg: 'rgba(255, 69, 96, 0.15)', text: '#FF4560', label: 'Failed' },
};

function AgentCard({ agent }: { agent: Agent }) {
  const router = useRouter();
  const statusStyle = STATUS_STYLES[agent.status];

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/agent/${agent.id}`)}
      activeOpacity={0.75}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.agentName}>{agent.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: statusStyle.text }]} />
            <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
          </View>
        </View>
        <Text style={styles.agentDescription}>{agent.description}</Text>
      </View>
      <View style={styles.cardFooter}>
        <View style={styles.modelBadge}>
          <Text style={styles.modelText}>{agent.model}</Text>
        </View>
        {agent.lastRun && (
          <Text style={styles.lastRun}>Last run: {agent.lastRun}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Text style={styles.emptyIconText}>⬡</Text>
      </View>
      <Text style={styles.emptyTitle}>No agents yet</Text>
      <Text style={styles.emptySubtitle}>
        Tap the + button to create your first agent
      </Text>
    </View>
  );
}

export default function AgentsScreen() {
  const [agents] = useState<Agent[]>(MOCK_AGENTS);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>Agents</Text>
        <Text style={styles.screenSubtitle}>{agents.length} registered</Text>
      </View>

      <FlatList
        data={agents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <AgentCard agent={item} />}
        contentContainerStyle={[styles.list, agents.length === 0 && styles.listEmpty]}
        ListEmptyComponent={<EmptyState />}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080810',
  },
  screenHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  screenSubtitle: {
    fontSize: 13,
    color: '#6B6B8A',
    marginTop: 2,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  listEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#0D0D1A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1A1A2E',
    gap: 12,
  },
  cardHeader: {
    gap: 6,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  agentName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  agentDescription: {
    fontSize: 13,
    color: '#6B6B8A',
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modelBadge: {
    backgroundColor: 'rgba(0, 245, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.2)',
  },
  modelText: {
    fontSize: 11,
    color: '#00F5FF',
    fontWeight: '500',
  },
  lastRun: {
    fontSize: 12,
    color: '#4A4A6A',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0D0D1A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1A1A2E',
  },
  emptyIconText: {
    fontSize: 28,
    color: '#4A4A6A',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B6B8A',
    textAlign: 'center',
    maxWidth: 240,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#00F5FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00F5FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontSize: 28,
    fontWeight: '300',
    color: '#080810',
    lineHeight: 32,
  },
});
