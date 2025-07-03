import React, { useEffect, useState } from 'react';
import { Button, FlatList, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../lib/supabase';

export default function DebtTrackerScreen({ navigation }) {
  const [debts, setDebts] = useState([]);
  const [netBalance, setNetBalance] = useState(0);

  useEffect(() => {
    fetchDebts();
  }, []);

  const fetchDebts = async () => {
    const { data, error } = await supabase.from('debts').select('*');
    if (data) {
      setDebts(data);
      const net = data.reduce((sum, d) => sum + d.amount, 0);
      setNetBalance(net);
    } else {
      setDebts([]);
      setNetBalance(0);
    }
  };

  const renderDebt = ({ item }) => (
    <View style={styles.debtItem}>
      <Text style={item.amount >= 0 ? styles.positive : styles.negative}>
        {item.amount >= 0 ? '+' : ''}{item.amount} {item.currency}
      </Text>
      <Text style={styles.debtDesc}>{item.description}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Debt Tracker</Text>
      <View style={styles.summary}>
        <Text style={[styles.net, netBalance >= 0 ? styles.positive : styles.negative]}>
          Net Balance: {netBalance >= 0 ? '+' : ''}{netBalance}
        </Text>
      </View>
      <FlatList
        data={debts}
        keyExtractor={item => item.id}
        renderItem={renderDebt}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 32 }}>No debts yet.</Text>}
      />
      <Button title="Back to Dashboard" onPress={() => navigation.goBack()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  summary: { marginBottom: 24 },
  net: { fontSize: 18, fontWeight: 'bold' },
  positive: { color: 'green' },
  negative: { color: 'red' },
  debtItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  debtDesc: { fontSize: 14, color: '#555' },
}); 