import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/src/store/authStore';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuthStore();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter your email and password');
      return;
    }
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Login Failed', err.message ?? 'Invalid credentials');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Logo / Brand */}
        <View style={styles.brandContainer}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>AI</Text>
          </View>
          <Text style={styles.brand}>AIOS</Text>
          <Text style={styles.tagline}>Enterprise AI Platform</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to your workspace</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="you@company.com"
                placeholderTextColor="#4b5563"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#4b5563"
                secureTextEntry={!showPassword}
                autoComplete="password"
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, isLoading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginBtnText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          © {new Date().getFullYear()} AIOS Platform. All rights reserved.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  brandContainer: { alignItems: 'center', marginBottom: 40 },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoText: { fontSize: 28, fontWeight: '800', color: '#fff' },
  brand: { fontSize: 32, fontWeight: '800', color: '#ffffff', letterSpacing: 2 },
  tagline: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  card: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  title: { fontSize: 24, fontWeight: '700', color: '#ffffff', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#9ca3af', marginBottom: 28 },
  field: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#d1d5db', marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    paddingHorizontal: 14,
    height: 50,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: '#ffffff', fontSize: 15 },
  eyeBtn: { padding: 4 },
  loginBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  forgotBtn: { alignItems: 'center', marginTop: 16 },
  forgotText: { color: '#6366f1', fontSize: 14 },
  footer: { textAlign: 'center', color: '#374151', fontSize: 12, marginTop: 32 },
});
