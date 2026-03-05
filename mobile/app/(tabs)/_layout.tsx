import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';

const ACCENT = '#00F5FF';
const BG = '#080810';
const INACTIVE = '#4A4A6A';

function TabIcon({ focused, symbol }: { focused: boolean; symbol: string }) {
  return (
    <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
      {/* Symbol placeholder — replace with vector icons when @expo/vector-icons is added */}
      <View style={[styles.iconDot, { backgroundColor: focused ? ACCENT : INACTIVE }]} />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: ACCENT,
        tabBarInactiveTintColor: INACTIVE,
        headerStyle: { backgroundColor: BG },
        headerTintColor: ACCENT,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} symbol="grid" />,
        }}
      />
      <Tabs.Screen
        name="agents"
        options={{
          title: 'Agents',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} symbol="cpu" />,
        }}
      />
      <Tabs.Screen
        name="monitor"
        options={{
          title: 'Monitor',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} symbol="activity" />,
        }}
      />
      <Tabs.Screen
        name="terminal"
        options={{
          title: 'Terminal',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} symbol="terminal" />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} symbol="settings" />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0D0D1A',
    borderTopColor: '#1A1A2E',
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 24,
    borderRadius: 6,
  },
  iconContainerActive: {
    backgroundColor: 'rgba(0, 245, 255, 0.1)',
  },
  iconDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
