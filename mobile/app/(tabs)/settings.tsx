import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const APP_VERSION = '1.0.0';
const BUILD_NUMBER = '100';

interface SettingRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

function SettingRow({ label, description, children }: SettingRowProps) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingLabel}>
        <Text style={styles.settingLabelText}>{label}</Text>
        {description && <Text style={styles.settingDescription}>{description}</Text>}
      </View>
      <View style={styles.settingControl}>{children}</View>
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

export default function SettingsScreen() {
  const [apiEndpoint, setApiEndpoint] = useState('http://localhost:4000');
  const [streamResponses, setStreamResponses] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const handleSaveEndpoint = () => {
    // TODO: persist to AsyncStorage and update API client
    Alert.alert('Saved', `API endpoint set to:\n${apiEndpoint}`);
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            // TODO: clear credentials and navigate to login
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        {/* Connection */}
        <SectionHeader title="Connection" />
        <View style={styles.card}>
          <View style={styles.endpointBlock}>
            <Text style={styles.settingLabelText}>API Endpoint</Text>
            <Text style={styles.settingDescription}>
              The URL of your AiOS API server
            </Text>
            <View style={styles.endpointRow}>
              <TextInput
                style={styles.endpointInput}
                value={apiEndpoint}
                onChangeText={setApiEndpoint}
                placeholder="http://localhost:4000"
                placeholderTextColor="#4A4A6A"
                autoCorrect={false}
                autoCapitalize="none"
                keyboardType="url"
                selectionColor="#00F5FF"
              />
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEndpoint}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Behaviour */}
        <SectionHeader title="Behaviour" />
        <View style={styles.card}>
          <SettingRow
            label="Stream Responses"
            description="Show agent output token by token as it's generated"
          >
            <Switch
              value={streamResponses}
              onValueChange={setStreamResponses}
              trackColor={{ false: '#1A1A2E', true: 'rgba(0, 245, 255, 0.4)' }}
              thumbColor={streamResponses ? '#00F5FF' : '#4A4A6A'}
            />
          </SettingRow>
          <View style={styles.rowDivider} />
          <SettingRow
            label="Auto-Refresh"
            description="Automatically refresh monitor and dashboard data"
          >
            <Switch
              value={autoRefresh}
              onValueChange={setAutoRefresh}
              trackColor={{ false: '#1A1A2E', true: 'rgba(0, 245, 255, 0.4)' }}
              thumbColor={autoRefresh ? '#00F5FF' : '#4A4A6A'}
            />
          </SettingRow>
          <View style={styles.rowDivider} />
          <SettingRow
            label="Notifications"
            description="Alert when agents complete or fail"
          >
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#1A1A2E', true: 'rgba(0, 245, 255, 0.4)' }}
              thumbColor={notificationsEnabled ? '#00F5FF' : '#4A4A6A'}
            />
          </SettingRow>
        </View>

        {/* Appearance */}
        <SectionHeader title="Appearance" />
        <View style={styles.card}>
          <SettingRow label="Theme" description="Only dark mode is available in this release">
            <View style={styles.themeChip}>
              <Text style={styles.themeChipText}>Dark</Text>
            </View>
          </SettingRow>
        </View>

        {/* About */}
        <SectionHeader title="About" />
        <View style={styles.card}>
          <SettingRow label="Version">
            <Text style={styles.infoText}>
              {APP_VERSION} ({BUILD_NUMBER})
            </Text>
          </SettingRow>
          <View style={styles.rowDivider} />
          <SettingRow label="Platform">
            <Text style={styles.infoText}>AiOS Mobile (Expo)</Text>
          </SettingRow>
          <View style={styles.rowDivider} />
          <SettingRow label="SDK">
            <Text style={styles.infoText}>@aios/sdk v{APP_VERSION}</Text>
          </SettingRow>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.75}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>AiOS Platform · MIT License</Text>
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
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B6B8A',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 8,
    marginTop: 8,
  },
  card: {
    backgroundColor: '#0D0D1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1A1A2E',
    marginBottom: 20,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  settingLabel: {
    flex: 1,
    gap: 2,
  },
  settingLabelText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 12,
    color: '#6B6B8A',
    lineHeight: 16,
    marginTop: 1,
  },
  settingControl: {
    alignItems: 'flex-end',
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#1A1A2E',
    marginHorizontal: 16,
  },
  endpointBlock: {
    padding: 16,
    gap: 10,
  },
  endpointRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  endpointInput: {
    flex: 1,
    backgroundColor: '#080810',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1A1A2E',
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: 'monospace',
  },
  saveBtn: {
    backgroundColor: '#00F5FF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#080810',
    fontWeight: '700',
    fontSize: 14,
  },
  themeChip: {
    backgroundColor: 'rgba(0, 245, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.3)',
  },
  themeChipText: {
    color: '#00F5FF',
    fontSize: 13,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 13,
    color: '#6B6B8A',
  },
  signOutBtn: {
    backgroundColor: 'rgba(255, 69, 96, 0.1)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 96, 0.3)',
    marginBottom: 24,
  },
  signOutText: {
    color: '#FF4560',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 32,
  },
  footerText: {
    fontSize: 12,
    color: '#4A4A6A',
  },
});
