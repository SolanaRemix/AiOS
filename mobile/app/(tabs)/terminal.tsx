import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const APP_VERSION: string = (require('../../package.json') as { version: string }).version;

interface OutputLine {
  id: string;
  text: string;
  type: 'input' | 'output' | 'error' | 'system';
}

const BANNER = [
  '  █████╗ ██╗ ██████╗ ███████╗',
  ' ██╔══██╗██║██╔═══██╗██╔════╝',
  ' ███████║██║██║   ██║███████╗ ',
  ' ██╔══██║██║██║   ██║╚════██║',
  ' ██║  ██║██║╚██████╔╝███████║',
  ' ╚═╝  ╚═╝╚═╝ ╚═════╝ ╚══════╝',
  '',
  ` AiOS Terminal  v${APP_VERSION}`,
  ' Type "help" for available commands.',
  '',
];

const COMMANDS: Record<string, () => string[]> = {
  help: () => [
    'Available commands:',
    '  help     - Show this help message',
    '  status   - Show system status',
    '  version  - Show AiOS version information',
    '  clear    - Clear terminal output',
    '  agents   - List active agent processes',
    '  ps       - Alias for agents',
  ],
  version: () => [
    'AiOS Platform v1.0.0',
    'Runtime: Node.js 20.x',
    'SDK: @aios/core v1.0.0',
    'Build: production',
  ],
  status: () => [
    'System Status:',
    '  API Server    [●] Running  (port 4000)',
    '  PostgreSQL    [●] Running  (connected)',
    '  Redis         [●] Running  (connected)',
    '  LLM Router    [●] Running',
    '  Tool Sandbox  [◐] Degraded (high latency)',
    '',
    'Active Agents: 4',
    'Memory Usage:  2.1 GB / 8 GB',
  ],
  agents: () => [
    'PID          NAME               STATE     MODEL',
    '──────────────────────────────────────────────────',
    'proc_a1f3   research-agent     running   gpt-4o',
    'proc_b2c9   coding-agent       running   claude-3-5-sonnet',
    'proc_c4d7   llm-agent          stopped   gpt-4o-mini',
    'proc_e5f1   automation-agent   paused    gpt-4o',
  ],
  ps: () => COMMANDS.agents(),
};

let lineCounter = BANNER.length + 1;

function makeId() {
  return String(lineCounter++);
}

export default function TerminalScreen() {
  const [input, setInput] = useState('');
  const [lines, setLines] = useState<OutputLine[]>([
    ...BANNER.map((text) => ({ id: makeId(), text, type: 'system' as const })),
  ]);
  const scrollRef = useRef<ScrollView>(null);

  const scrollToBottom = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  };

  const runCommand = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;

    const newLines: OutputLine[] = [
      { id: makeId(), text: `$ ${trimmed}`, type: 'input' },
    ];

    if (trimmed === 'clear') {
      setLines([{ id: makeId(), text: '$ clear', type: 'input' }]);
      setInput('');
      scrollToBottom();
      return;
    }

    const cmd = COMMANDS[trimmed.toLowerCase()];
    if (cmd) {
      cmd().forEach((line) => {
        newLines.push({ id: makeId(), text: line, type: 'output' });
      });
    } else {
      newLines.push({
        id: makeId(),
        text: `command not found: ${trimmed}`,
        type: 'error',
      });
      newLines.push({ id: makeId(), text: 'Type "help" for available commands.', type: 'output' });
    }

    newLines.push({ id: makeId(), text: '', type: 'output' });

    setLines((prev) => [...prev, ...newLines]);
    setInput('');
    scrollToBottom();
  };

  const getLineColor = (type: OutputLine['type']) => {
    switch (type) {
      case 'input':
        return '#00F5FF';
      case 'error':
        return '#FF4560';
      case 'system':
        return '#00FF41';
      default:
        return '#00FF41';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.titleBar}>
        <View style={styles.trafficLights}>
          <View style={[styles.light, { backgroundColor: '#FF5F57' }]} />
          <View style={[styles.light, { backgroundColor: '#FFBD2E' }]} />
          <View style={[styles.light, { backgroundColor: '#28C840' }]} />
        </View>
        <Text style={styles.titleBarText}>aios-terminal</Text>
        <View style={styles.trafficLights} />
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.output}
        contentContainerStyle={styles.outputContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={scrollToBottom}
      >
        {lines.map((line) => (
          <Text key={line.id} style={[styles.outputLine, { color: getLineColor(line.type) }]}>
            {line.text}
          </Text>
        ))}
        <Text style={styles.cursor}>▌</Text>
      </ScrollView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={88}
      >
        <View style={styles.inputRow}>
          <Text style={styles.prompt}>$</Text>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => runCommand(input)}
            placeholder="enter command..."
            placeholderTextColor="#1A3A1A"
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="send"
            blurOnSubmit={false}
            selectionColor="#00FF41"
          />
          <TouchableOpacity style={styles.sendBtn} onPress={() => runCommand(input)}>
            <Text style={styles.sendBtnText}>↵</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020A02',
  },
  titleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#0A140A',
    borderBottomWidth: 1,
    borderBottomColor: '#0F2A0F',
  },
  trafficLights: {
    flexDirection: 'row',
    gap: 6,
    width: 56,
  },
  light: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  titleBarText: {
    fontSize: 13,
    color: '#00FF41',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    opacity: 0.7,
  },
  output: {
    flex: 1,
    paddingHorizontal: 12,
  },
  outputContent: {
    paddingTop: 12,
    paddingBottom: 4,
  },
  outputLine: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    lineHeight: 18,
    color: '#00FF41',
  },
  cursor: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
    color: '#00FF41',
    opacity: 0.8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#0F2A0F',
    backgroundColor: '#020A02',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  prompt: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
    color: '#00FF41',
    paddingBottom: 2,
  },
  input: {
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    color: '#00FF41',
    paddingVertical: 6,
  },
  sendBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 255, 65, 0.1)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 65, 0.3)',
  },
  sendBtnText: {
    color: '#00FF41',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
