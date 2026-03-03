import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, focused }: { name: IoniconsName; focused: boolean }) {
  return <Ionicons name={name} size={24} color={focused ? '#6366f1' : '#6b7280'} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#111827',
          borderTopColor: '#1f2937',
          borderTopWidth: 1,
          paddingBottom: 4,
          height: 60,
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#6b7280',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerStyle: { backgroundColor: '#0a0a0a' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'grid' : 'grid-outline'} focused={focused} />,
          headerTitle: 'AIOS Dashboard',
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: 'Projects',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'folder' : 'folder-outline'} focused={focused} />,
          headerTitle: 'Projects',
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'chatbubbles' : 'chatbubbles-outline'} focused={focused} />,
          headerTitle: 'AI Assistant',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'settings' : 'settings-outline'} focused={focused} />,
          headerTitle: 'Settings',
        }}
      />
    </Tabs>
  );
}
