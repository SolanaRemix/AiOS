import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '@/src/store/authStore';

interface SettingRowProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value?: string;
  onPress?: () => void;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (v: boolean) => void;
  danger?: boolean;
}

function SettingRow({ icon, label, value, onPress, toggle, toggleValue, onToggle, danger }: SettingRowProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={toggle} activeOpacity={0.7}>
      <View style={[styles.rowIcon, { backgroundColor: danger ? '#ef444422' : '#1f2937' }]}>
        <Ionicons name={icon} size={18} color={danger ? '#ef4444' : '#9ca3af'} />
      </View>
      <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
      {value && <Text style={styles.rowValue}>{value}</Text>}
      {toggle ? (
        <Switch value={toggleValue} onValueChange={onToggle} trackColor={{ true: '#6366f1', false: '#374151' }} thumbColor="#fff" />
      ) : (
        <Ionicons name="chevron-forward" size={16} color="#374151" />
      )}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();
  const [notifications, setNotifications] = useState(true);
  const [biometrics, setBiometrics] = useState(false);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.name ?? 'U').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user?.name ?? 'User'}</Text>
          <Text style={styles.profileEmail}>{user?.email ?? ''}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role ?? 'MEMBER'}</Text>
          </View>
        </View>
      </View>

      {/* Account */}
      <Text style={styles.sectionLabel}>Account</Text>
      <View style={styles.section}>
        <SettingRow icon="person-outline" label="Edit Profile" onPress={() => {}} />
        <SettingRow icon="key-outline" label="Change Password" onPress={() => {}} />
        <SettingRow icon="shield-checkmark-outline" label="Two-Factor Auth" onPress={() => {}} />
      </View>

      {/* Preferences */}
      <Text style={styles.sectionLabel}>Preferences</Text>
      <View style={styles.section}>
        <SettingRow
          icon="notifications-outline"
          label="Push Notifications"
          toggle
          toggleValue={notifications}
          onToggle={setNotifications}
        />
        <SettingRow
          icon="finger-print-outline"
          label="Biometric Login"
          toggle
          toggleValue={biometrics}
          onToggle={setBiometrics}
        />
        <SettingRow icon="color-palette-outline" label="Theme" value="Dark" onPress={() => {}} />
      </View>

      {/* App Info */}
      <Text style={styles.sectionLabel}>App</Text>
      <View style={styles.section}>
        <SettingRow icon="information-circle-outline" label="Version" value="1.0.0" />
        <SettingRow icon="document-text-outline" label="Privacy Policy" onPress={() => {}} />
        <SettingRow icon="help-circle-outline" label="Help & Support" onPress={() => {}} />
      </View>

      {/* Sign Out */}
      <View style={styles.section}>
        <SettingRow icon="log-out-outline" label="Sign Out" onPress={handleLogout} danger />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 20, paddingBottom: 48 },
  profileCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: { fontSize: 24, fontWeight: '800', color: '#fff' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: '700', color: '#ffffff' },
  profileEmail: { fontSize: 13, color: '#9ca3af', marginTop: 2 },
  roleBadge: {
    marginTop: 6,
    backgroundColor: '#6366f133',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  roleText: { fontSize: 11, fontWeight: '700', color: '#6366f1' },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#6b7280', letterSpacing: 1, marginBottom: 8, marginTop: 4 },
  section: {
    backgroundColor: '#111827',
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1f2937',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  rowLabel: { flex: 1, fontSize: 15, color: '#e5e7eb' },
  rowLabelDanger: { color: '#ef4444' },
  rowValue: { fontSize: 13, color: '#6b7280', marginRight: 8 },
});
