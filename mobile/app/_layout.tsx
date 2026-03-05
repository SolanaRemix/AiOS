import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#080810' },
          headerTintColor: '#00F5FF',
          contentStyle: { backgroundColor: '#080810' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="agent/[id]" options={{ title: 'Agent Detail' }} />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
