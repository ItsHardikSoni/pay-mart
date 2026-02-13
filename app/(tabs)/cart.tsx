
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, SafeAreaView, Modal, TouchableWithoutFeedback, TextInput, Alert, Platform, KeyboardAvoidingView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cartState, CartItem } from '../cartState';
import { router, useFocusEffect } from 'expo-router';
import { Colors } from '../../constants/theme';
import { supabase } from '../../supabaseClient';
import { useSession } from '../../context/SessionProvider';
import RazorpayCheckout from 'react-native-razorpay';

export default function CartScreen() {
  const [cartItems, setCartItems] = useState(cartState.items);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [cashierModalVisible, setCashierModalVisible] = useState(false);
  const [cashierId, setCashierId] = useState('');
  const [cashierPhone, setCashierPhone] = useState('');
  const [cashierName, setCashierName] = useState<string | null>(null);
  const [cashierData, setCashierData] = useState<any | null>(null);
  const { username } = useSession();
  const [userDetails, setUserDetails] = useState({ email: '', phone: '', name: '' });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchUserDetails = async () => {
        if (username) {
            const { data, error } = await supabase
                .from('users')
                .select('email, phone_number, full_name')
                .eq('username', username)
                .single();
            if (data) {
                setUserDetails({
                    email: data.email || '',
                    phone: data.phone_number || '',
                    name: data.full_name || '',
                });
            } else if (error) {
                console.error("Error fetching user details:", error.message)
            }
        }
    };
    fetchUserDetails();
  }, [username]);

  const sanitizeAndConsolidateCart = () => {
    const sanitizedItems: { [key: string]: CartItem } = {};

    for (const item of cartState.items) {
        const id = item.id.toString();

        if (sanitizedItems[id]) {
            sanitizedItems[id].quantity += item.quantity;
        } else {
            sanitizedItems[id] = { ...item, id };
        }
    }

    cartState.items = Object.values(sanitizedItems);
    setCartItems([...cartState.items]);
  };


  const fetchStockLevels = async () => {
    if (cartState.items.length === 0) return;
    const productIds = cartState.items.map(item => item.id).filter(id => id && id !== 'NaN');

    if (productIds.length === 0) return;

    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('id, stock')
        .in('id', productIds);

      if (error) throw error;

      const stockMap = products.reduce((acc, product) => {
        acc[product.id.toString()] = product.stock;
        return acc;
      }, {} as { [key: string]: number });

      const updatedCartItems = cartState.items.map(item => ({
        ...item,
        stock: stockMap[item.id] ?? 0, // Fallback to 0 if stock not found
      }));

      cartState.items = updatedCartItems;
      setCartItems([...updatedCartItems]);

    } catch (e) {
      console.error('Failed to fetch stock levels:', e);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      sanitizeAndConsolidateCart();
      fetchStockLevels();
    }, [])
  );

  useEffect(() => {
    const fetchCashierName = async () => {
      if (cashierId && cashierPhone) {
        try {
          const { data } = await supabase
            .from('cashers')
            .select('casher_name, payment_count')
            .eq('casher_id', cashierId)
            .eq('phone', cashierPhone)
            .single();

          if (data) {
            setCashierName(data.casher_name);
            setCashierData(data);
          } else {
            setCashierName(null);
            setCashierData(null);
          }
        } catch (e) {
          setCashierName(null);
          setCashierData(null);
        }
      }
    };

    const handler = setTimeout(() => {
      fetchCashierName();
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [cashierId, cashierPhone]);

  const updateQuantity = (item: CartItem, newQuantity: number) => {
    const itemIndex = cartState.items.findIndex(i => i.id === item.id);
    if (itemIndex === -1) return;

    const stockLimit = item.stock ?? 0;
    if (newQuantity > stockLimit) {
        Alert.alert('Stock Limit', `You can only add up to ${stockLimit} of ${item.name}.`);
        return;
    }

    if (newQuantity > 0) {
      cartState.items[itemIndex].quantity = newQuantity;
    } else {
      cartState.items.splice(itemIndex, 1);
    }
    setCartItems([...cartState.items]);
  };

  const renderItem = ({ item }: { item: CartItem }) => {
    const itemPrice = (item as any).mrp ?? (item as any).price ?? 0;
    const isAddDisabled = item.quantity >= (item.stock ?? 0);

    return (
      <View style={styles.itemContainer}>
        <View style={styles.itemDetails}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemPrice}>₹{itemPrice.toFixed(2)}</Text>
           {item.stock !== undefined && (
            <Text style={styles.itemStock}>In Stock: {item.stock}</Text>
          )}
        </View>
        <View style={styles.itemQuantityContainer}>
          <TouchableOpacity style={styles.quantityButton} onPress={() => updateQuantity(item, item.quantity - 1)}>
            <Ionicons name="remove" size={22} color={Colors.light.primary} />
          </TouchableOpacity>
          <Text style={styles.itemQuantity}>{item.quantity}</Text>
          <TouchableOpacity style={[styles.quantityButton, isAddDisabled && styles.disabledButton]} onPress={() => updateQuantity(item, item.quantity + 1)} disabled={isAddDisabled}>
            <Ionicons name="add" size={22} color={isAddDisabled ? '#c0c0c0' : Colors.light.primary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const getTotal = () => {
    return cartItems.reduce((total, item) => {
        const itemPrice = (item as any).mrp ?? (item as any).price ?? 0;
        return total + itemPrice * item.quantity;
    }, 0).toFixed(2);
  };

  const getTotalQuantity = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const handleCheckout = () => {
    setPaymentModalVisible(true);
  };
  
  const handleCashPayment = () => {
    setPaymentModalVisible(false);
    setCashierModalVisible(true);
  };

  const processOrder = async (paymentMode: 'Cash' | 'Online', orderId: string, options: { razorpayPaymentId?: string; cashierName?: string | null }) => {
    try {
        const finalTotal = getTotal();
        const { razorpayPaymentId, cashierName } = options;
        const now = new Date();
        const order_date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const order_time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        
        const processedCartItems = [...cartState.items];

        const { error: rpcError } = await supabase.rpc('process_new_order', {
            p_order_number: orderId,
            p_username: username,
            p_total_amount: parseFloat(finalTotal),
            p_cart_items: processedCartItems,
            p_payment_mode: paymentMode,
            p_order_time: order_time,
            p_order_date: order_date,
            p_razorpay_payment_id: razorpayPaymentId || null,
            p_cashier_name: cashierName || null
        });

        if (rpcError) {
            throw rpcError;
        }

        const itemsForInvoice = cartState.items.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            mrp: (item as any).mrp ?? (item as any).price ?? 0
        }));

        cartState.items = [];
        setCartItems([]);

        return { processedCartItems: itemsForInvoice, finalTotal };

    } catch (e: any) {
        console.error('Transaction Error:', e);
        Alert.alert('Transaction Error', e.message || 'An unexpected error occurred and the transaction was rolled back.');
        return null;
    }
  }

  const handleRazorpayPayment = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    if (!RazorpayCheckout || !RazorpayCheckout.open) {
        Alert.alert('Setup Incomplete', 'The payment library is not available. Please build the app with `npx expo run:android` or `npx expo run:ios`.');
        setIsProcessing(false);
        return;
    }

    const finalTotal = getTotal();

    try {
        // 1. Create Order on Server
        const { data: orderData, error: orderError } = await supabase.functions.invoke('create-razorpay-order', {
            body: { amount: parseFloat(finalTotal) },
        });

        if (orderError) throw new Error(orderError.message);
        if (!orderData || !orderData.id) throw new Error('Failed to create order on server.');

        const serverOrderId = orderData.id;

        // 2. Open Razorpay Checkout
        const options = {
            description: 'Your order from PayMart Supermarket',
            image: 'https://i.imgur.com/3g7nmJC.png',
            currency: 'INR',
            key: 'rzp_live_SFgkbtmRPxIgyq', // Live Key
            amount: parseFloat(finalTotal) * 100,
            name: 'PayMart Supermarket',
            order_id: serverOrderId,
            prefill: {
                email: userDetails.email,
                contact: userDetails.phone,
                name: userDetails.name
            },
            theme: { color: Colors.light.primary }
        };

        RazorpayCheckout.open(options).then(async (data) => {
            // 3. Process Order on Success
            const result = await processOrder('Online', serverOrderId, { razorpayPaymentId: data.razorpay_payment_id });
            if (result) {
                setPaymentModalVisible(false);
                router.push({
                    pathname: '/e-invoice',
                    params: {
                        cart: JSON.stringify(result.processedCartItems),
                        total: result.finalTotal,
                        paymentMode: 'Online',
                        razorpayPaymentId: data.razorpay_payment_id,
                        orderNumber: serverOrderId
                    }
                });
            }
        }).catch((error) => {
            // 4. Handle Payment Failure/Cancellation
            if (error.code === 0) {
                 console.log('Payment cancelled by user.');
            } else if (error.code === 2) {
                Alert.alert('Payment Error', 'The payment failed. This might be due to an issue with the server. Please try again.');
            } else {
                 Alert.alert('Payment Failed', error.description || 'An unexpected error occurred.');
            }
        }).finally(() => {
            setIsProcessing(false);
        });

    } catch (e: any) {
        Alert.alert('Error Preparing Payment', e.message);
        setIsProcessing(false);
    }
  };


  const handleCashierVerification = async () => {
    if (!cashierData) {
      Alert.alert('Error', 'Cashier not verified. Please check the details.');
      return;
    }
    const order_id = `PAYMART-CASH-${Date.now()}`;

    const result = await processOrder('Cash', order_id, { cashierName: cashierName });
    if (result) {
        const newPaymentCount = (cashierData.payment_count || 0) + 1;
        await supabase.from('cashers').update({ payment_count: newPaymentCount }).eq('casher_id', cashierId);

        setCashierModalVisible(false);
        setCashierId('');
        setCashierPhone('');
        setCashierData(null);

        router.push({ 
            pathname: '/e-invoice', 
            params: { 
                cart: JSON.stringify(result.processedCartItems), 
                total: result.finalTotal, 
                paymentMode: 'Cash',
                cashierName: cashierName, 
                orderNumber: order_id
            } 
        });
        setCashierName(null);
    }
  };

  const renderPaymentModal = () => (
    <Modal animationType="fade" transparent={true} visible={paymentModalVisible} onRequestClose={() => setPaymentModalVisible(false)}>
      <TouchableWithoutFeedback onPress={() => setPaymentModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              {isProcessing ? (
                <View style={styles.processingContainer}>
                    <ActivityIndicator size="large" color={Colors.light.primary} />
                    <Text style={styles.processingText}>Preparing your order...</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.modalTitle}>Select Payment Method</Text>
                  <TouchableOpacity style={styles.paymentOption} onPress={handleRazorpayPayment}>
                    <Ionicons name="card-outline" size={24} color="white" style={styles.paymentOptionIcon} />
                    <Text style={styles.paymentOptionText}>Online Payment</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.paymentOption} onPress={handleCashPayment}>
                    <Ionicons name="cash-outline" size={24} color="white" style={styles.paymentOptionIcon} />
                    <Text style={styles.paymentOptionText}>Cash Payment</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  const renderCashierModal = () => (
    <Modal animationType="slide" transparent={true} visible={cashierModalVisible} onRequestClose={() => setCashierModalVisible(false)}>
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <TouchableWithoutFeedback onPress={() => setCashierModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Cashier Verification</Text>
                            <TextInput style={styles.input} placeholder="Cashier ID" value={cashierId} onChangeText={setCashierId} />
                            <TextInput style={styles.input} placeholder="Phone Number" value={cashierPhone} onChangeText={setCashierPhone} keyboardType="phone-pad" maxLength={10} />
                            {cashierName && (
                                <View style={styles.cashierNameContainer}>
                                    <Ionicons name="checkmark-circle" size={20} color="green" />
                                    <Text style={styles.cashierNameText}>{cashierName}</Text>
                                </View>
                            )}
                            <TouchableOpacity style={[styles.verifyButton, !cashierName && styles.disabledVerifyButton]} onPress={handleCashierVerification} disabled={!cashierName}>
                                <Text style={styles.checkoutButtonText}>Verify & Proceed</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    </Modal>
  );

  return (
    <>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Cart</Text>
          <View style={styles.itemsBadge}>
            <Text style={styles.itemsBadgeText}>{getTotalQuantity()} items</Text>
          </View>
        </View>

        {cartItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cart-outline" size={100} color="#d0d0d0" />
            <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
            <Text style={styles.emptySubtitle}>Looks like you haven't added anything to your cart yet.</Text>
            <TouchableOpacity style={styles.startButton} onPress={() => router.push('/scan')}>
              <Text style={styles.startButtonText}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <FlatList data={cartItems} renderItem={renderItem} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} />
            <View style={styles.footer}>
              <View style={styles.totalRow}>
                  <Text style={styles.totalText}>Total ({getTotalQuantity()} items)</Text>
                  <Text style={styles.totalAmount}>₹{getTotal()}</Text>
              </View>
              <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
                <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </SafeAreaView>
      {renderPaymentModal()}
      {renderCashierModal()}
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  header: { backgroundColor: 'white', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  headerTitle: { fontSize: 25, fontWeight: 'bold', color: '#333' },
  itemsBadge: { backgroundColor: Colors.light.primary, borderRadius: 15, paddingVertical: 5, paddingHorizontal: 10 },
  itemsBadgeText: { color: 'white', fontSize: 12, fontWeight: '600' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 24, fontWeight: 'bold', marginTop: 20, color: '#444' },
  emptySubtitle: { fontSize: 16, color: '#777', marginTop: 10, textAlign: 'center' },
  startButton: { backgroundColor: Colors.light.primary, paddingVertical: 14, paddingHorizontal: 40, borderRadius: 30, marginTop: 30, shadowColor: Colors.light.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 6 },
  startButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  list: { paddingHorizontal: 16, paddingVertical: 16 },
  itemContainer: { backgroundColor: 'white', borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
  itemDetails: { flex: 1, marginRight: 10 },
  itemName: { fontSize: 17, fontWeight: '600', color: '#333' },
  itemPrice: { fontSize: 15, color: Colors.light.primary, marginTop: 4, fontWeight: '500' },
  itemStock: { fontSize: 14, color: '#888', marginTop: 4 },
  itemQuantityContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f2f5', borderRadius: 20 },
  quantityButton: { padding: 8 },
  disabledButton: { backgroundColor: '#f0f0f0' },
  itemQuantity: { fontSize: 16, fontWeight: 'bold', marginHorizontal: 12, color: '#333' },
  footer: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  totalText: { fontSize: 18, color: '#555', fontWeight: '500' },
  totalAmount: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  checkoutButton: { backgroundColor: Colors.light.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  checkoutButtonText: { color: 'white', fontSize: 15, fontWeight: 'bold' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: 'white', padding: 22, borderTopLeftRadius: 20, borderTopRightRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 25, textAlign: 'center', color: '#333' },
  paymentOption: { backgroundColor: Colors.light.primary, paddingVertical: 15, paddingHorizontal: 20, borderRadius: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  paymentOptionIcon: { marginRight: 15 },
  paymentOptionText: { color: 'white', fontSize: 18, fontWeight: '600' },
  input: { height: 50, borderColor: '#ddd', borderWidth: 1, borderRadius: 10, paddingHorizontal: 15, marginBottom: 15, fontSize: 16 },
  verifyButton: { backgroundColor: Colors.light.primary, padding: 15, borderRadius: 10, alignItems: 'center' },
  disabledVerifyButton: { backgroundColor: '#A9A9A9' },
  cashierNameContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, paddingHorizontal: 5 },
  cashierNameText: { marginLeft: 10, fontSize: 16, color: 'green', fontWeight: 'bold' },
  processingContainer: { paddingVertical: 20, alignItems: 'center', justifyContent: 'center' },
  processingText: { marginTop: 15, fontSize: 16, fontWeight: '500', color: '#555' },
});
