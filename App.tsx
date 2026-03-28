import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text } from 'react-native';
import BibleScreen from './screens/BibleScreen';
import PrayerScreen from './screens/PrayerScreen';
import IntercessoryScreen from './screens/IntercessoryScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: '#C9A96E',
          tabBarInactiveTintColor: '#6B7280',
          tabBarLabelStyle: styles.tabLabel,
          tabBarIcon: ({ focused, color }) => {
            const icons: Record<string, string> = {
              '오늘의 말씀': '📖',
              '기도문': '🙏',
              '중보기도방': '💞',
            };
            return (
              <Text style={{ fontSize: focused ? 22 : 18 }}>
                {icons[route.name]}
              </Text>
            );
          },
        })}
      >
        <Tab.Screen name="오늘의 말씀" component={BibleScreen} />
        <Tab.Screen name="기도문" component={PrayerScreen} />
        <Tab.Screen name="중보기도방" component={IntercessoryScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0F1117',
    borderTopColor: '#1E2235',
    borderTopWidth: 1,
    paddingTop: 6,
    paddingBottom: 10,
    height: 70,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
});
