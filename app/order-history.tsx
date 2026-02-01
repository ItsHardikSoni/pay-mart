
import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Order {
    id: string;
    date: string;
    total: number;
}

export default function OrderHistoryScreen() {
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState<Order[]>([]);

  const renderItem = ({ item }: { item: Order }) => (
    <View style={styles.itemContainer}>
        <Text style={styles.itemHeader}>Order #{item.id}</Text>
        <Text style={styles.itemDate}>{item.date}</Text>
        <Text style={styles.itemTotal}>Total: ${item.total.toFixed(2)}</Text>
        <TouchableOpacity style={styles.detailsButton}>
            <Text style={styles.detailsButtonText}>View Details</Text>
        </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="close" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order History</Text>
        <View style={styles.ordersBadge}>
          <Text style={styles.ordersBadgeText}>{orders.length} orders</Text>
        </View>
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bag-handle-outline" size={100} color="#ccc" />
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptySubtitle}>Start shopping to see your orders here</Text>
          <TouchableOpacity style={styles.startButton}>
            <Text style={styles.startButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
            data={orders}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{paddingHorizontal: 16}}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  ordersBadge: {
    backgroundColor: '#6c63ff',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  ordersBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  startButton: {
    backgroundColor: '#6c63ff',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginTop: 24,
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  itemDate: {
    fontSize: 14,
    color: 'gray',
    marginBottom: 10,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  detailsButton: {
      marginTop: 10,
      alignSelf: 'flex-end',
  },
  detailsButtonText: {
      color: '#6c63ff',
      fontSize: 14,
      fontWeight: 'bold',
  }
});
