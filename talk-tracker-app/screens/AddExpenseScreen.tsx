import { Picker } from '@react-native-picker/picker';
import { Audio } from 'expo-av';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

const currencyList = [
  'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'SAR', 'AED', 'EGP', 'INR', 'CNY', 'BRL', 'ZAR',
];

export default function AddExpenseScreen({ navigation }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [processingAudio, setProcessingAudio] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('categories').select('*');
    if (error) {
      Alert.alert('Error', 'Failed to fetch categories');
      setCategories([]);
    } else {
      setCategories(data || []);
      if (data && data.length > 0) setCategory(data[0].name);
    }
    setLoading(false);
  };

  const addExpense = async () => {
    if (!description || !amount || !currency || !category) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    const { error } = await supabase.from('expenses').insert([
      { description, amount: parseFloat(amount), currency, category }
    ]);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      navigation.goBack();
    }
  };

  // Voice recording logic
  const startRecording = async () => {
    try {
      setIsRecording(true);
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please grant audio recording permissions.');
        setIsRecording(false);
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await rec.startAsync();
      setRecording(rec);
    } catch (err) {
      Alert.alert('Error', 'Failed to start recording.');
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      if (uri) {
        setProcessingAudio(true);
        await sendAudioForAI(uri);
        setProcessingAudio(false);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to stop recording.');
    }
  };

  // Placeholder: send audio to backend for AI parsing
  const sendAudioForAI = async (uri) => {
    // TODO: Implement upload to Supabase Edge Function or your backend
    // For now, simulate AI response
    setTimeout(() => {
      // Simulated AI result
      setDescription('Coffee at Starbucks');
      setAmount('4.50');
      setCategory(categories[0]?.name || '');
      // Optionally set currency
    }, 2000);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Expense</Text>
      <TextInput style={styles.input} placeholder="Description" value={description} onChangeText={setDescription} />
      <TextInput style={styles.input} placeholder="Amount" value={amount} onChangeText={setAmount} keyboardType="numeric" />
      <Text style={styles.label}>Currency</Text>
      <Picker
        selectedValue={currency}
        onValueChange={setCurrency}
        style={styles.picker}
      >
        {currencyList.map(cur => (
          <Picker.Item key={cur} label={cur} value={cur} />
        ))}
      </Picker>
      <Text style={styles.label}>Category</Text>
      <Picker
        selectedValue={category}
        onValueChange={setCategory}
        style={styles.picker}
      >
        {categories.map(cat => (
          <Picker.Item key={cat.id} label={cat.name} value={cat.name} />
        ))}
      </Picker>
      <View style={styles.voiceRow}>
        <TouchableOpacity
          style={[styles.voiceButton, isRecording && styles.voiceButtonActive]}
          onPress={isRecording ? stopRecording : startRecording}
          disabled={processingAudio}
        >
          <Text style={styles.voiceButtonText}>{isRecording ? 'Stop Recording' : 'Record Voice'}</Text>
        </TouchableOpacity>
        {processingAudio && <ActivityIndicator style={{ marginLeft: 12 }} />}
      </View>
      <Button title="Add Expense" onPress={addExpense} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 16 },
  label: { fontWeight: 'bold', marginTop: 8 },
  picker: { marginBottom: 16 },
  voiceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  voiceButton: { backgroundColor: '#007bff', padding: 12, borderRadius: 8 },
  voiceButtonActive: { backgroundColor: '#d9534f' },
  voiceButtonText: { color: '#fff', fontWeight: 'bold' },
}); 