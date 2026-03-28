import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text } from 'react-native';
import HomeScreen from './screens/HomeScreen';
import BibleScreen from './screens/BibleScreen';
import PrayerScreen from './screens/PrayerScreen';
import IntercessoryScreen from './screens/IntercessoryScreen';
import type { MainTabParamList } from './screens/HomeScreen';
import { initPurchasesIfConfigured } from './services/purchases';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function App() {
  useEffect(() => {
    void initPurchasesIfConfigured();
  }, []);

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
          tabBarIcon: ({ focused }) => {
            const icons: Record<string, string> = {
              홈: '🏠',
              '오늘의 말씀': '📖',
              기도문: '🙏',
              중보기도방: '💞',
            };
            return (
              <Text style={{ fontSize: focused ? 22 : 18 }}>
                {icons[route.name]}
              </Text>
            );
          },
        })}
      >
        <Tab.Screen name="홈" component={HomeScreen} />
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
