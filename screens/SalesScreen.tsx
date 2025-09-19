
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SalesScreen() {
  const [sales] = useState([
    { id: 1, customer: 'John Doe', plant: 'Monstera Deliciosa', quantity: 2, total: 90, date: '2024-01-15' },
    { id: 2, customer: 'Jane Smith', plant: 'Fiddle Leaf Fig', quantity: 1, total: 65, date: '2024-01-14' },
    { id: 3, customer: 'Mike Johnson', plant: 'Snake Plant', quantity: 3, total: 105, date: '2024-01-13' },
    { id: 4, customer: 'Sarah Wilson', plant: 'Pothos', quantity: 5, total: 125, date: '2024-01-12' },
  ]);

  const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);

  const recordSale = () => {
    Alert.alert('Record Sale', 'This feature will be available soon!');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sales History</Text>
        <TouchableOpacity style={styles.recordButton} onPress={recordSale}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Sales</Text>
        <Text style={styles.summaryValue}>${totalSales}</Text>
        <Text style={styles.summarySubtext}>{sales.length} transactions</Text>
      </View>

      <ScrollView style={styles.content}>
        {sales.map((sale) => (
          <View key={sale.id} style={styles.saleCard}>
            <View style={styles.saleHeader}>
              <Text style={styles.customerName}>{sale.customer}</Text>
              <Text style={styles.saleAmount}>${sale.total}</Text>
            </View>
            <View style={styles.saleDetails}>
              <Text style={styles.plantName}>{sale.plant}</Text>
              <Text style={styles.quantity}>Qty: {sale.quantity}</Text>
            </View>
            <Text style={styles.saleDate}>{sale.date}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#3B82F6',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  recordButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 20,
  },
  summaryCard: {
    backgroundColor: 'white',
    margin: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 4,
  },
  summarySubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  saleCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  saleAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  saleDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  plantName: {
    fontSize: 14,
    color: '#6b7280',
  },
  quantity: {
    fontSize: 14,
    color: '#6b7280',
  },
  saleDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
});
