
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors } from '../constants/theme';
import { supabase } from '../supabaseClient';
import { useSession } from '../context/SessionProvider';

const OrderHistory = () => {
  const router = useRouter();
  const { username } = useSession();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrderHistory = async (isRefreshing = false) => {
    if (!username) {
      setLoading(false);
      return;
    }

    try {
      if (!isRefreshing) {
        setLoading(true);
      }
      const { data, error } = await supabase
        .from('order_history')
        .select('*')
        .eq('username', username)
        .order('order_date', { ascending: false });

      if (error) {
        throw error;
      }
      setOrders(data || []);
    } catch (error: any) {
      console.error('Error fetching order history:', error.message);
    } finally {
      setLoading(false);
      if (isRefreshing) {
        setRefreshing(false);
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrderHistory();
    }, [username])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrderHistory(true);
  }, [username]);

  const handleOrderPress = (order: any) => {
    router.push({
      pathname: '/e-invoice',
      params: {
        cart: JSON.stringify(order.items),
        total: order.total_amount,
        paymentMode: order.payment_mode,
        isPastOrder: 'true',
        orderDate: order.order_date,
        orderNumber: order.order_number,
      },
    });
  };

  const renderItem = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity onPress={() => handleOrderPress(item)}>
        <View style={styles.orderContainer}>
          <View style={styles.orderHeader}>
              <Ionicons name="receipt-outline" size={30} color={Colors.light.primary} />
              <View style={styles.orderInfo}>
                <Text style={styles.orderId}>Order #{item.order_number}</Text>
                <Text style={styles.detailText}>{new Date(item.order_date).toLocaleDateString()}</Text>
              </View>
          </View>
          <View style={styles.itemsContainer}>
              {item.items.map((product: any, index: number) => (
                  <View key={index} style={styles.item}>
                      <Text style={styles.itemName}>{product.name}</Text>
                      <Text style={styles.itemQuantity}>x{product.quantity}</Text>
                  </View>
              ))}
          </View>
          <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalAmount}>₹{item.total_amount.toFixed(2)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
};


  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Loading your order history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.primary} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>My Orders</Text>
        <View style={{width: 24}}/>
      </View>
      
      <FlatList
        data={orders}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.light.primary]} />
        }
        ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Ionicons name="file-tray-stacked-outline" size={100} color="#d0d0d0" />
                <Text style={styles.emptyTitle}>No orders yet!</Text>
                <Text style={styles.emptySubtitle}>Your past orders will appear here.</Text>
            </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#555',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 15,
      backgroundColor: 'white',
      borderBottomWidth: 1,
      borderBottomColor: '#e0e0e0',
    },
    backButton: {
      padding: 5,
    },
    pageTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: Colors.light.primary,
    },
    listContainer: {
        padding: 16,
    },
    orderContainer: {
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 5,
    },
    orderHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 15,
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    orderInfo: {
      marginLeft: 15,
    },
    orderId: {
        fontSize: 17,
        fontWeight: 'bold',
        color: Colors.light.primary,
    },
    detailText: {
        fontSize: 14,
        color: '#555',
        marginTop: 4,
    },
    itemsContainer: {
        marginBottom: 15,
    },
    item: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    itemName: {
        fontSize: 16,
        color: '#444',
    },
    itemQuantity: {
      fontSize: 16,
      color: '#666',
      fontWeight: '500',
    },
    totalContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 15,
      borderTopWidth: 1,
      borderTopColor: '#f0f0f0',
    },
    totalLabel: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333',
    },
    totalAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.light.primary,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
    },
    emptyTitle: {
        marginTop: 20,
        fontSize: 22,
        fontWeight: 'bold',
        color: '#555',
    },
    emptySubtitle: {
        marginTop: 10,
        fontSize: 16,
        color: '#888',
        textAlign: 'center',
        paddingHorizontal: 40,
    },
});

export default OrderHistory;
