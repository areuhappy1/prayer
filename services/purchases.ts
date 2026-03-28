import { setSubscribedFlag, getSubscribedFlag } from './storage';

const RC_KEY =
  typeof process !== 'undefined' ? process.env.EXPO_PUBLIC_REVENUECAT_API_KEY : '';

export async function initPurchasesIfConfigured(): Promise<void> {
  if (!RC_KEY) return;
  try {
    const Purchases = require('react-native-purchases').default;
    Purchases.configure({ apiKey: RC_KEY });
  } catch {
    // Expo Go 또는 네이티브 미빌드
  }
}

export async function hasActiveSubscription(): Promise<boolean> {
  if (await getSubscribedFlag()) return true;
  if (!RC_KEY) return false;
  try {
    const Purchases = require('react-native-purchases').default;
    const info = await Purchases.getCustomerInfo();
    const active = info?.entitlements?.active || {};
    return Object.keys(active).length > 0;
  } catch {
    return false;
  }
}

export async function purchaseSubscription(): Promise<boolean> {
  if (!RC_KEY) {
    if (__DEV__) {
      await setSubscribedFlag(true);
      return true;
    }
    return false;
  }
  try {
    const Purchases = require('react-native-purchases').default;
    const offerings = await Purchases.getOfferings();
    const pkg =
      offerings?.current?.availablePackages?.[0] ||
      offerings?.current?.monthly ||
      offerings?.current?.annual;
    if (!pkg) {
      await setSubscribedFlag(true);
      return true;
    }
    await Purchases.purchasePackage(pkg);
    await setSubscribedFlag(true);
    return true;
  } catch {
    return false;
  }
}

export async function restorePurchases(): Promise<boolean> {
  if (!RC_KEY) {
    return getSubscribedFlag();
  }
  try {
    const Purchases = require('react-native-purchases').default;
    await Purchases.restorePurchases();
    const ok = await hasActiveSubscription();
    if (ok) await setSubscribedFlag(true);
    return ok;
  } catch {
    return false;
  }
}
