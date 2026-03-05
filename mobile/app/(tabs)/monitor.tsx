import { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  latencyMs?: number;
}

interface SystemMetrics {
  cpuPercent: number;
  memoryUsedGb: number;
  memoryTotalGb: number;
  uptimeHours: number;
}

interface EventEntry {
  id: string;
  type: string;
  message: string;
  time: string;
  severity: 'info' | 'warn' | 'error';
}

const STATUS_COLOR: Record<ServiceStatus['status'], string> = {
  healthy: '#00FF88',
  degraded: '#FFB400',
  down: '#FF4560',
};

const SEVERITY_COLOR: Record<EventEntry['severity'], string> = {
  info: '#00F5FF',
  warn: '#FFB400',
  error: '#FF4560',
};

function MetricBar({ label, value, max, unit }: { label: string; value: number; max: number; unit: string }) {
  const pct = Math.min((value / max) * 100, 100);
  const color = pct > 80 ? '#FF4560' : pct > 60 ? '#FFB400' : '#00F5FF';

  return (
    <View style={styles.metricRow}>
      <View style={styles.metricHeader}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={[styles.metricValue, { color }]}>
          {value.toFixed(1)}{unit}
        </Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export default function MonitorScreen() {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpuPercent: 34,
    memoryUsedGb: 2.1,
    memoryTotalGb: 8,
    uptimeHours: 47,
  });

  const [services] = useState<ServiceStatus[]>([
    { name: 'API Server', status: 'healthy', latencyMs: 12 },
    { name: 'PostgreSQL', status: 'healthy', latencyMs: 4 },
    { name: 'Redis', status: 'healthy', latencyMs: 1 },
    { name: 'LLM Router', status: 'healthy', latencyMs: 230 },
    { name: 'Tool Sandbox', status: 'degraded', latencyMs: 850 },
  ]);

  const [events] = useState<EventEntry[]>([
    { id: '1', type: 'agent.tool.executed', message: 'web_search completed in 340ms', time: '0:12', severity: 'info' },
    { id: '2', type: 'system.health', message: 'Tool sandbox latency elevated (850ms)', time: '0:38', severity: 'warn' },
    { id: '3', type: 'agent.lifecycle', message: 'coding-agent proc_a2f started', time: '1:05', severity: 'info' },
    { id: '4', type: 'agent.lifecycle', message: 'automation-agent proc_b9c failed', time: '2:15', severity: 'error' },
    { id: '5', type: 'memory.updated', message: 'Long-term memory write: user_preference', time: '3:40', severity: 'info' },
  ]);

  // Auto-refresh every 10 seconds
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      // TODO: fetch real metrics from /health and /metrics
      setMetrics(prev => ({
        ...prev,
        cpuPercent: Math.max(5, Math.min(95, prev.cpuPercent + (Math.random() - 0.5) * 10)),
      }));
    }, 10000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>System Monitor</Text>
          <View style={styles.uptimeBadge}>
            <Text style={styles.uptimeText}>↑ {metrics.uptimeHours}h uptime</Text>
          </View>
        </View>

        {/* Health Metrics */}
        <Text style={styles.sectionTitle}>Health Metrics</Text>
        <View style={styles.metricsCard}>
          <MetricBar label="CPU" value={metrics.cpuPercent} max={100} unit="%" />
          <MetricBar
            label="Memory"
            value={metrics.memoryUsedGb}
            max={metrics.memoryTotalGb}
            unit={` / ${metrics.memoryTotalGb} GB`}
          />
        </View>

        {/* Services */}
        <Text style={styles.sectionTitle}>Services</Text>
        <View style={styles.servicesCard}>
          {services.map((svc, idx) => (
            <View key={svc.name} style={[styles.serviceRow, idx < services.length - 1 && styles.serviceRowBorder]}>
              <View style={[styles.serviceStatusDot, { backgroundColor: STATUS_COLOR[svc.status] }]} />
              <Text style={styles.serviceName}>{svc.name}</Text>
              <View style={styles.serviceRight}>
                {svc.latencyMs !== undefined && (
                  <Text style={styles.serviceLatency}>{svc.latencyMs}ms</Text>
                )}
                <Text style={[styles.serviceStatusText, { color: STATUS_COLOR[svc.status] }]}>
                  {svc.status}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Events Feed */}
        <Text style={styles.sectionTitle}>Recent Events</Text>
        <View style={styles.eventsCard}>
          {events.map((ev, idx) => (
            <View key={ev.id} style={[styles.eventRow, idx < events.length - 1 && styles.eventRowBorder]}>
              <Text style={[styles.eventSeverity, { color: SEVERITY_COLOR[ev.severity] }]}>
                {ev.severity.toUpperCase()}
              </Text>
              <View style={styles.eventContent}>
                <Text style={styles.eventType}>{ev.type}</Text>
                <Text style={styles.eventMessage}>{ev.message}</Text>
              </View>
              <Text style={styles.eventTime}>{ev.time}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Auto-refreshes every 10s</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  uptimeBadge: {
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.2)',
  },
  uptimeText: {
    fontSize: 12,
    color: '#00FF88',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B6B8A',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 10,
    marginTop: 8,
  },
  metricsCard: {
    backgroundColor: '#0D0D1A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1A1A2E',
    gap: 16,
    marginBottom: 20,
  },
  metricRow: {
    gap: 8,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricLabel: {
    fontSize: 13,
    color: '#AAAACC',
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  barTrack: {
    height: 6,
    backgroundColor: '#1A1A2E',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  servicesCard: {
    backgroundColor: '#0D0D1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1A1A2E',
    marginBottom: 20,
    overflow: 'hidden',
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  serviceRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A2E',
  },
  serviceStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  serviceName: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
  },
  serviceRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  serviceLatency: {
    fontSize: 12,
    color: '#4A4A6A',
  },
  serviceStatusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  eventsCard: {
    backgroundColor: '#0D0D1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1A1A2E',
    marginBottom: 20,
    overflow: 'hidden',
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    gap: 10,
  },
  eventRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A2E',
  },
  eventSeverity: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    paddingTop: 2,
    minWidth: 36,
  },
  eventContent: {
    flex: 1,
    gap: 2,
  },
  eventType: {
    fontSize: 11,
    color: '#6B6B8A',
  },
  eventMessage: {
    fontSize: 13,
    color: '#CCCCDD',
  },
  eventTime: {
    fontSize: 11,
    color: '#4A4A6A',
    paddingTop: 2,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 12,
    color: '#4A4A6A',
  },
});
