import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Button, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { requestNotificationPermissions, sendImmediateNotification, setupNotificationChannel } from '../utils/notifications';
import { checkProStatus, initRevenueCat, purchasePro } from '../utils/revenuecat';

export default function DashboardScreen({ navigation }) {
  const [expenses, setExpenses] = useState([]);
  const [budget, setBudget] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    setupNotificationChannel();
    requestNotificationPermissions();
    fetchDashboard();
    // Initialize RevenueCat (replace with actual user ID)
    initRevenueCat('user_id');
    checkProStatus().then(setIsPro);
  }, []);

  const fetchDashboard = async () => {
    // Fetch budget
    const { data: budgetData } = await supabase.from('budgets').select('*').single();
    setBudget(budgetData);

    // Fetch recent expenses
    const { data: expensesData } = await supabase
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false });
    setExpenses(expensesData || []);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboard().then(() => setRefreshing(false));
  }, []);

  const signOut = async () => {
    await SecureStore.deleteItemAsync('session');
    navigation.replace('SignIn');
  };

  const handleUpgrade = async () => {
    try {
      await purchasePro();
      setIsPro(true);
      Alert.alert('Success', 'You are now a Pro user!');
    } catch (e) {
      Alert.alert('Error', e.message || 'Purchase failed');
    }
  };

  const renderExpense = ({ item }) => (
    <View style={styles.expenseItem}>
      <Text style={styles.expenseDesc}>{item.description}</Text>
      <Text style={styles.expenseDetails}>
        {item.amount} {item.currency} | {item.category}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      {budget && (
        <View style={styles.section}>
          <Text>Budget: {budget.amount} {budget.currency}</Text>
        </View>
      )}
      <View style={styles.section}>
        <Text style={styles.subtitle}>Expenses</Text>
        <FlatList
          data={expenses}
          keyExtractor={item => item.id}
          renderItem={renderExpense}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 32 }}>No expenses yet.</Text>}
        />
      </View>
      <Button title="Add Expense" onPress={() => navigation.navigate('AddExpense')} />
      {!isPro && <Button title="Upgrade to Pro" onPress={handleUpgrade} />}
      <Button title="Test Notification" onPress={() => sendImmediateNotification('Talk Tracker', 'This is a test notification!')} />
      <Button title="Sign Out" onPress={signOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  section: { marginBottom: 24 },
  subtitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  expenseItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  expenseDesc: { fontSize: 16, fontWeight: 'bold' },
  expenseDetails: { fontSize: 14, color: '#555' },
}); 