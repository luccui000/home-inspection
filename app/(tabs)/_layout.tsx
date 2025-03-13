import React from 'react';
import { Tabs } from 'expo-router';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: useClientOnlyValue(false, true),
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: (props) => (
            <Ionicons name="home" size={24} color={props.color} />
          ),
        }}
      />

      <Tabs.Screen
        name="setting"
        options={{
          title: 'Setting',
          headerShown: false,
          tabBarIcon: (props) => (
            <Ionicons name="settings-outline" size={24} color="black" />
          ),
        }}
      />
    </Tabs>
  );
}
