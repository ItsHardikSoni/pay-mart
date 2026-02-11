
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../constants/theme';

const EInvoiceScreen = () => {
  const { cart, total } = useLocalSearchParams();
  const cartItems = JSON.parse(cart as string);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>E-Invoice</Text>
      <View style={styles.detailsContainer}>
        <Text style={styles.total}>Total: ${total}</Text>
        {cartItems.map((item: any) => (
          <View key={item.id} style={styles.itemContainer}>
            <Text>{item.name}</Text>
            <Text>{item.quantity} x ${item.mrp}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity style={styles.doneButton} onPress={() => router.replace('/(tabs)')}>
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  detailsContainer: {
    marginBottom: 20,
  },
  total: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  doneButton: {
    backgroundColor: Colors.light.primary,
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default EInvoiceScreen;
