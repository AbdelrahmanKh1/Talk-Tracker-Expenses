import i18n from 'i18n-js';
import { I18nManager } from 'react-native';
import * as Localization from 'react-native-localize';

const en = {
  dashboard: 'Dashboard',
  add_expense: 'Add Expense',
  sign_out: 'Sign Out',
  upgrade_pro: 'Upgrade to Pro',
  test_notification: 'Test Notification',
  debt_tracker: 'Debt Tracker',
  net_balance: 'Net Balance',
  no_expenses: 'No expenses yet.',
  no_debts: 'No debts yet.',
};

const ar = {
  dashboard: 'لوحة التحكم',
  add_expense: 'إضافة مصروف',
  sign_out: 'تسجيل الخروج',
  upgrade_pro: 'الترقية إلى برو',
  test_notification: 'اختبار الإشعار',
  debt_tracker: 'متتبع الديون',
  net_balance: 'صافي الرصيد',
  no_expenses: 'لا توجد مصروفات بعد.',
  no_debts: 'لا توجد ديون بعد.',
};

i18n.translations = { en, ar };

const fallback = { languageTag: 'en', isRTL: false };
const { languageTag, isRTL } =
  Localization.findBestAvailableLanguage(Object.keys(i18n.translations)) || fallback;

i18n.locale = languageTag;
I18nManager.forceRTL(isRTL);
i18n.fallbacks = true;

export const t = (key: string) => i18n.t(key); 