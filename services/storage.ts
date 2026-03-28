import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  FREE_USED: '@grace/free_prayer_used',
  HISTORY: '@grace/prayer_history',
  SUBSCRIBED: '@grace/subscribed',
} as const;

export async function getFreePrayerUsed(): Promise<boolean> {
  const v = await AsyncStorage.getItem(KEYS.FREE_USED);
  return v === 'true';
}

export async function setFreePrayerUsed(value: boolean): Promise<void> {
  await AsyncStorage.setItem(KEYS.FREE_USED, value ? 'true' : 'false');
}

export async function getPrayerHistoryJson(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.HISTORY);
}

export async function setPrayerHistoryJson(json: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.HISTORY, json);
}

export async function getSubscribedFlag(): Promise<boolean> {
  const v = await AsyncStorage.getItem(KEYS.SUBSCRIBED);
  return v === 'true';
}

export async function setSubscribedFlag(value: boolean): Promise<void> {
  await AsyncStorage.setItem(KEYS.SUBSCRIBED, value ? 'true' : 'false');
}
