import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/theme';

const orders = [
  {
    id: '1',
    date: '2023-10-27',
    items: ['Product 1, Product 2'],
    total: 50.0,
    status: 'Delivered',
  },
  {
    id: '2',
    date: '2023-10-25',
    items: ['Product 3'],
    total: 25.0,
    status: 'Cancelled',
  },
];

const OrderHistory = () => {
  const router = useRouter();

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Delivered':
        return {
          backgroundColor: '#e8f5e9',
          color: '#2e7d32',
        };
      case 'Cancelled':
        return {
          backgroundColor: '#ffcdd2',
          color: '#b71c1c',
        };
      default:
        return {
          backgroundColor: '#e0e0e0',
          color: '#333',
        };
    }
  };

  const renderItem = ({ item }) => {
    const statusStyle = getStatusStyle(item.status);
    return (
        <View style={styles.orderContainer}>
            <View style={styles.orderHeader}>
                <Text style={styles.orderId}>Order #{item.id}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
                    <Text style={[styles.statusText, { color: statusStyle.color }]}>{item.status}</Text>
                </View>
            </View>
            <View style={styles.orderDetails}>
                <Text style={styles.detailText}>Date: {item.date}</Text>
                <Text style={styles.detailText}>Total: ₹{item.total.toFixed(2)}</Text>
            </View>
            <View style={styles.itemsContainer}>
                <Text style={styles.itemsTitle}>Items:</Text>
                <Text style={styles.orderItems}>{item.items.join(', ')}</Text>
            </View>
        </View>
    );
};

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={Colors.light.primary} />
        <Text style={styles.pageTitle}>Order History</Text>
      </TouchableOpacity>
      
      <FlatList
        data={orders}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Ionicons name="receipt-outline" size={100} color="#d0d0d0" />
                <Text style={styles.emptyText}>No orders yet!</Text>
            </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f2f5',
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 20,
    },
    pageTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: Colors.light.primary,
        marginLeft: 15,
    },
    listContainer: {
        padding: 16,
    },
    orderContainer: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingBottom: 10,
        marginBottom: 10,
    },
    orderId: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.light.primary,
    },
    statusBadge: {
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    orderDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    detailText: {
        fontSize: 14,
        color: '#555',
    },
    itemsContainer: {
        marginTop: 4,
    },
    itemsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    orderItems: {
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 18,
        color: '#888',
    },
});

export default OrderHistory;
