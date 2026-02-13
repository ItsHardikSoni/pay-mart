
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
        .order('order_date', { ascending: false })
        .order('order_time', { ascending: false });

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
        orderNumber: order.order_number,
        cashierName: order.cashier_name,
        razorpayPaymentId: order.razorpay_payment_id,
        order_date: order.order_date, 
        order_time: order.order_time,
      },
    });
  };

  const renderItem = ({ item }: { item: any }) => {
    const orderDateTime = new Date(`${item.order_date}T${item.order_time}`);
    const formattedDate = orderDateTime.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
    const formattedTime = orderDateTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });

    return (
      <TouchableOpacity onPress={() => handleOrderPress(item)} style={styles.orderCard}>
        <View style={styles.cardTopSection}>
            <View style={styles.orderIdContainer}>
                <Ionicons name="receipt-outline" size={18} color="#34495e" />
                <Text style={styles.orderId}>Order #{item.order_number}</Text>
            </View>
            <Text style={styles.totalAmount}>₹{item.total_amount.toFixed(2)}</Text>
        </View>

        <View style={styles.cardBottomSection}>
          <Text style={styles.dateTimeText}>{formattedDate}, {formattedTime}</Text>
          <View style={styles.paymentModeContainer}>
            <Ionicons 
              name={item.payment_mode === 'Online' ? 'card' : 'cash'} 
              size={16} 
              color={item.payment_mode === 'Online' ? Colors.light.primary : '#27ae60'} 
            />
            <Text style={[styles.paymentModeText, { color: item.payment_mode === 'Online' ? Colors.light.primary : '#27ae60' }]}>
              {item.payment_mode}
            </Text>
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
        backgroundColor: '#f4f6f8',
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
      borderBottomColor: '#eef0f2',
    },
    backButton: {
      padding: 5,
    },
    pageTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    listContainer: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    orderCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#95a5a6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 7,
        elevation: 4,
    },
    cardTopSection: {
      marginBottom: 12,
    },
    orderIdContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    orderId: {
      fontSize: 16,
      fontWeight: '600',
      color: '#34495e',
      marginLeft: 8,
    },
    totalAmount: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#2c3e50',
      marginTop: 8,
    },
    cardBottomSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: '#f4f6f8',
    },
    dateTimeText: {
      fontSize: 14,
      color: '#7f8c8d',
      fontWeight: '500',
    },
    paymentModeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 6,
      paddingVertical: 4,
      paddingHorizontal: 8,
      backgroundColor: '#ecf0f1',
    },
    paymentModeText: {
      marginLeft: 6,
      fontSize: 13,
      fontWeight: '600',
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
