import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MOCK_AGENT_DETAILS: Record<string, {
  name: string;
  model: string;
  status: string;
  description: string;
  systemPrompt: string;
  tools: string[];
  temperature: number;
  maxTokens: number;
  executions: number;
  tokensUsed: number;
}> = {
  ag_1: {
    name: 'research-agent',
    model: 'gpt-4o',
    status: 'running',
    description: 'Web research and summarization',
    systemPrompt: 'You are a research assistant. Gather information from multiple sources and provide well-cited summaries.',
    tools: ['web_search', 'url_fetch', 'text_summarizer'],
    temperature: 0.3,
    maxTokens: 2048,
    executions: 142,
    tokensUsed: 284320,
  },
};

export default function AgentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();

  const agent = MOCK_AGENT_DETAILS[id] ?? {
    name: `agent-${id}`,
    model: 'gpt-4o-mini',
    status: 'stopped',
    description: 'No details available',
    systemPrompt: '',
    tools: [],
    temperature: 0.7,
    maxTokens: 1024,
    executions: 0,
    tokensUsed: 0,
  };

  useEffect(() => {
    navigation.setOptions({ title: agent.name });
  }, [agent.name, navigation]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.agentHeader}>
          <Text style={styles.agentName}>{agent.name}</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: agent.status === 'running' ? 'rgba(0,255,136,0.15)' : 'rgba(106,106,138,0.15)' }
          ]}>
            <Text style={[
              styles.statusText,
              { color: agent.status === 'running' ? '#00FF88' : '#6B6B8A' }
            ]}>
              {agent.status}
            </Text>
          </View>
        </View>
        <Text style={styles.description}>{agent.description}</Text>

        {/* Stats */}
        <Text style={styles.sectionTitle}>Lifetime Stats</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{agent.executions.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Executions</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{(agent.tokensUsed / 1000).toFixed(1)}k</Text>
            <Text style={styles.statLabel}>Tokens Used</Text>
          </View>
        </View>

        {/* Configuration */}
        <Text style={styles.sectionTitle}>Configuration</Text>
        <View style={styles.card}>
          {[
            { label: 'Model', value: agent.model },
            { label: 'Temperature', value: String(agent.temperature) },
            { label: 'Max Tokens', value: agent.maxTokens.toLocaleString() },
          ].map((row, idx, arr) => (
            <View key={row.label}>
              <View style={styles.configRow}>
                <Text style={styles.configLabel}>{row.label}</Text>
                <Text style={styles.configValue}>{row.value}</Text>
              </View>
              {idx < arr.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* Tools */}
        <Text style={styles.sectionTitle}>Bound Tools</Text>
        <View style={styles.toolsWrap}>
          {agent.tools.length > 0
            ? agent.tools.map((tool) => (
                <View key={tool} style={styles.toolChip}>
                  <Text style={styles.toolChipText}>{tool}</Text>
                </View>
              ))
            : <Text style={styles.emptyText}>No tools bound</Text>
          }
        </View>

        {/* System Prompt */}
        {agent.systemPrompt ? (
          <>
            <Text style={styles.sectionTitle}>System Prompt</Text>
            <View style={styles.promptCard}>
              <Text style={styles.promptText}>{agent.systemPrompt}</Text>
            </View>
          </>
        ) : null}

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080810' },
  scroll: { flex: 1, paddingHorizontal: 16 },
  agentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingBottom: 6,
  },
  agentName: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', flex: 1 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  description: { fontSize: 14, color: '#6B6B8A', lineHeight: 20, marginBottom: 20 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B6B8A',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 10,
    marginTop: 4,
  },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statBox: {
    flex: 1,
    backgroundColor: '#0D0D1A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1A1A2E',
    alignItems: 'center',
  },
  statValue: { fontSize: 22, fontWeight: '700', color: '#00F5FF' },
  statLabel: { fontSize: 12, color: '#6B6B8A', marginTop: 4 },
  card: {
    backgroundColor: '#0D0D1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1A1A2E',
    marginBottom: 20,
    overflow: 'hidden',
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  configLabel: { fontSize: 14, color: '#AAAACC' },
  configValue: { fontSize: 14, color: '#FFFFFF', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#1A1A2E', marginHorizontal: 16 },
  toolsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  toolChip: {
    backgroundColor: 'rgba(0, 245, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.2)',
  },
  toolChipText: { fontSize: 13, color: '#00F5FF', fontWeight: '500' },
  emptyText: { fontSize: 14, color: '#4A4A6A', fontStyle: 'italic' },
  promptCard: {
    backgroundColor: '#0D0D1A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1A1A2E',
    marginBottom: 20,
  },
  promptText: { fontSize: 13, color: '#AAAACC', lineHeight: 20 },
  bottomPad: { height: 32 },
});
