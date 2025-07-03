import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';

const API_KEY = Platform.select({
  ios: 'REVENUECAT_IOS_API_KEY',
  android: 'REVENUECAT_ANDROID_API_KEY',
});
const PRO_PRODUCT_ID = 'pro_monthly'; // Replace with your actual product identifier

export async function initRevenueCat(userId) {
  await Purchases.configure({ apiKey: API_KEY, appUserID: userId });
}

export async function checkProStatus() {
  const purchaserInfo = await Purchases.getCustomerInfo();
  return purchaserInfo.activeSubscriptions.includes(PRO_PRODUCT_ID);
}

export async function purchasePro() {
  const offerings = await Purchases.getOfferings();
  const proOffering = offerings.current?.availablePackages.find(pkg => pkg.identifier === PRO_PRODUCT_ID);
  if (proOffering) {
    await Purchases.purchasePackage(proOffering);
  } else {
    throw new Error('Pro subscription not available');
  }
} 