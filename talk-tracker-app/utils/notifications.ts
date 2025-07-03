import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function requestNotificationPermissions() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    alert('Enable notifications to receive reminders and alerts!');
  }
}

export async function sendImmediateNotification(title, body) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null,
  });
}

export async function scheduleNotification(title, body, secondsFromNow) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: { seconds: secondsFromNow },
  });
}

// Call this once on app start
export async function setupNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
} 