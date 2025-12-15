import { Tabs } from 'expo-router';
import { BookOpen, Home, MessageCircle, PenTool, User } from 'lucide-react-native';


export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0077ffff',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: 8,
          height: 65,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => <Home size={size} color={color} />,
        }}
      />
    <Tabs.Screen
        name="library-screen"
        options={{
          title: 'Library',
          tabBarIcon: ({ size, color }) => (
            <BookOpen size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create-novel"
        options={{
          title: 'Create',
          tabBarIcon: ({ size, color }) => <PenTool size={size} color={color} />,
        }}
      />
      
      <Tabs.Screen
        name="social"
        options={{
          title: 'Social',
          tabBarIcon: ({ size, color }) => (
            <MessageCircle size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile-screen"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => (
            <User size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}