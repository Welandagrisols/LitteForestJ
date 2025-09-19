
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function InventoryScreen() {
  const [plants, setPlants] = useState([
    { id: 1, name: 'Monstera Deliciosa', quantity: 25, price: 45, status: 'Healthy' },
    { id: 2, name: 'Fiddle Leaf Fig', quantity: 18, price: 65, status: 'Healthy' },
    { id: 3, name: 'Snake Plant', quantity: 32, price: 35, status: 'Needs Water' },
    { id: 4, name: 'Pothos', quantity: 40, price: 25, status: 'Healthy' },
  ]);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [newPlant, setNewPlant] = useState({ name: '', quantity: '', price: '' });

  const addPlant = () => {
    if (newPlant.name && newPlant.quantity && newPlant.price) {
      setPlants([...plants, {
        id: Date.now(),
        name: newPlant.name,
        quantity: parseInt(newPlant.quantity),
        price: parseFloat(newPlant.price),
        status: 'Healthy'
      }]);
      setNewPlant({ name: '', quantity: '', price: '' });
      setModalVisible(false);
      Alert.alert('Success', 'Plant added to inventory!');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Healthy': return '#22A45D';
      case 'Needs Water': return '#F59E0B';
      case 'Needs Care': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Plant Inventory</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {plants.map((plant) => (
          <View key={plant.id} style={styles.plantCard}>
            <View style={styles.plantInfo}>
              <Text style={styles.plantName}>{plant.name}</Text>
              <Text style={styles.plantDetails}>Qty: {plant.quantity} • ${plant.price}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(plant.status) }]}>
              <Text style={styles.statusText}>{plant.status}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Plant</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Plant Name"
              value={newPlant.name}
              onChangeText={(text) => setNewPlant({...newPlant, name: text})}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Quantity"
              value={newPlant.quantity}
              onChangeText={(text) => setNewPlant({...newPlant, quantity: text})}
              keyboardType="numeric"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Price"
              value={newPlant.price}
              onChangeText={(text) => setNewPlant({...newPlant, price: text})}
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.addPlantButton]}
                onPress={addPlant}
              >
                <Text style={styles.addButtonText}>Add Plant</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: '#22A45D',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  addButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 20,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  plantCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  plantInfo: {
    flex: 1,
  },
  plantName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  plantDetails: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  addPlantButton: {
    backgroundColor: '#22A45D',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontWeight: '600',
    textAlign: 'center',
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
});
