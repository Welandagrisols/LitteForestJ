
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

export default function TasksScreen() {
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Water greenhouse plants', priority: 'high', completed: false, dueDate: '2024-01-16' },
    { id: 2, title: 'Repot snake plants', priority: 'medium', completed: false, dueDate: '2024-01-18' },
    { id: 3, title: 'Check pest control', priority: 'high', completed: true, dueDate: '2024-01-15' },
    { id: 4, title: 'Order fertilizer', priority: 'low', completed: false, dueDate: '2024-01-20' },
  ]);

  const toggleTask = (taskId) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const addTask = () => {
    Alert.alert('Add Task', 'This feature will be available soon!');
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const incompleteTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tasks</Text>
        <TouchableOpacity style={styles.addButton} onPress={addTask}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Pending Tasks</Text>
        <Text style={styles.summaryValue}>{incompleteTasks.length}</Text>
        <Text style={styles.summarySubtext}>{completedTasks.length} completed</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Pending</Text>
        {incompleteTasks.map((task) => (
          <TouchableOpacity 
            key={task.id} 
            style={styles.taskCard}
            onPress={() => toggleTask(task.id)}
          >
            <View style={styles.taskContent}>
              <View style={styles.checkbox}>
                <Ionicons name="ellipse-outline" size={24} color="#d1d5db" />
              </View>
              
              <View style={styles.taskInfo}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={styles.taskDate}>Due: {task.dueDate}</Text>
              </View>
              
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}>
                <Text style={styles.priorityText}>{task.priority}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {completedTasks.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Completed</Text>
            {completedTasks.map((task) => (
              <TouchableOpacity 
                key={task.id} 
                style={[styles.taskCard, styles.completedCard]}
                onPress={() => toggleTask(task.id)}
              >
                <View style={styles.taskContent}>
                  <View style={styles.checkbox}>
                    <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  </View>
                  
                  <View style={styles.taskInfo}>
                    <Text style={[styles.taskTitle, styles.completedTitle]}>{task.title}</Text>
                    <Text style={styles.taskDate}>Completed</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}
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
    backgroundColor: '#F59E0B',
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
  summaryCard: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginBottom: 2,
  },
  summarySubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  taskCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  completedCard: {
    opacity: 0.7,
  },
  taskContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  checkbox: {
    marginRight: 12,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  taskDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});
