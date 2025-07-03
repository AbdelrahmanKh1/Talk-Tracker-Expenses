import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

const PENDING_KEY = 'pending_voice_recordings';

export async function savePendingRecording({ uri, metadata }) {
  const pending = await getPendingRecordings();
  pending.push({ uri, metadata });
  await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(pending));
}

export async function getPendingRecordings() {
  const json = await AsyncStorage.getItem(PENDING_KEY);
  return json ? JSON.parse(json) : [];
}

export async function removePendingRecording(uri) {
  const pending = await getPendingRecordings();
  const filtered = pending.filter(item => item.uri !== uri);
  await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(filtered));
}

export async function syncPendingRecordings() {
  const pending = await getPendingRecordings();
  for (const item of pending) {
    try {
      // TODO: Implement upload and AI processing logic
      // Example: await uploadAndProcessAudio(item.uri, item.metadata);
      // Simulate success:
      await new Promise(res => setTimeout(res, 1000));
      // Remove file after successful upload
      await FileSystem.deleteAsync(item.uri, { idempotent: true });
      await removePendingRecording(item.uri);
    } catch (e) {
      // If upload fails, keep the recording for next sync
    }
  }
} 