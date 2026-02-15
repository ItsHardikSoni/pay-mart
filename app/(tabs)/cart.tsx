
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, KeyboardAvoidingView, Modal, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import { Colors } from '../../constants/theme';
import { useSession } from '../../context/SessionProvider';
import { supabase } from '../../supabaseClient';
import { CartItem, cartState } from '../cartState';

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
    const originalCount = cartState.items.length;
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

    const validItems = cartState.items.filter(item => {
        if (typeof item.id !== 'string' || !uuidRegex.test(item.id)) {
            console.warn('Removing invalid item from cart:', item);
            return false;
        }
        return true;
    });

    if (validItems.length < originalCount) {
        Alert.alert('Cart Updated', 'Some invalid items were removed from your cart.');
    }

    const consolidatedItems: { [key: string]: CartItem } = {};
    for (const item of validItems) {
        const key = item.id.toString();
        if (consolidatedItems[key]) {
            consolidatedItems[key].quantity += item.quantity;
        } else {
            consolidatedItems[key] = { ...item };
        }
    }

    const finalCart = Object.values(consolidatedItems);
    cartState.items = finalCart;
    setCartItems([...finalCart]);
  };


  const fetchStockLevels = async () => {
    if (cartState.items.length === 0) return;
    const productIds = cartState.items.map(item => item.id);

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

  const processOrder = async (paymentMode: 'Cash' | 'Online', orderId: string, options: { razorpayPaymentId?: string; cashierName?: string | null; razorpaySignature?: string; }) => {
    try {
        const finalTotal = getTotal();
        const { razorpayPaymentId, cashierName, razorpaySignature } = options;
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
            p_cashier_name: cashierName || null,
            p_razorpay_signature: razorpaySignature || null
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
        const { data: orderData, error: orderError } = await supabase.functions.invoke('create-razorpay-order', {
            body: { amount: parseFloat(finalTotal) },
        });

        if (orderError) throw new Error(orderError.message);
        if (!orderData || !orderData.id) throw new Error('Failed to create order on server.');

        const serverOrderId = orderData.id;

        const options = {
            description: 'Your order from PayMart Supermarket',
            image: Image.resolveAssetSource(require('../../assets/images/app.icon.jpeg')).uri,
            currency: 'INR',
            key: 'rzp_live_SFgkbtmRPxIgyq',
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

        RazorpayCheckout.open(options).then(async (paymentResponse) => {
            setIsProcessing(true);

            const { data: verificationData, error: verificationError } = await supabase.functions.invoke('verify-razorpay-payment', {
                body: {
                    razorpay_order_id: paymentResponse.razorpay_order_id,
                    razorpay_payment_id: paymentResponse.razorpay_payment_id,
                    razorpay_signature: paymentResponse.razorpay_signature,
                }
            });

            if (verificationError || !verificationData.verified) {
                Alert.alert('Payment Verification Failed', 'There was an issue verifying your payment. Please contact support if you have been charged.');
                setIsProcessing(false);
                return;
            }

            const result = await processOrder('Online', serverOrderId, { 
                razorpayPaymentId: paymentResponse.razorpay_payment_id,
                razorpaySignature: paymentResponse.razorpay_signature
            });

            if (result) {
                setPaymentModalVisible(false);
                router.push({
                    pathname: '/e-invoice',
                    params: {
                        cart: JSON.stringify(result.processedCartItems),
                        total: result.finalTotal,
                        paymentMode: 'Online',
                        razorpayPaymentId: paymentResponse.razorpay_payment_id,
                        orderNumber: serverOrderId
                    }
                });
            }
            setIsProcessing(false);

        }).catch((error) => {
            if (error.code !== 0) {
                 Alert.alert('Payment Failed', error.description || 'An unexpected error occurred.');
            }
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
    const order_id = `CASH-${Date.now()}`;

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
                    <Text style={styles.processingText}>Verifying Payment...</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.modalTitle}>Choose Payment Method</Text>
                  
                  <TouchableOpacity style={styles.paymentOptionCard} onPress={handleRazorpayPayment}>
                    <View style={[styles.iconContainer, { backgroundColor: '#e3f2fd' }]}>
                        <Ionicons name="card" size={24} color={Colors.light.primary} />
                    </View>
                    <View style={styles.optionTextContainer}>
                        <Text style={styles.optionTitle}>Online Payment</Text>
                        <Text style={styles.optionSubtitle}>UPI, Cards, Netbanking</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.paymentOptionCard} onPress={handleCashPayment}>
                    <View style={[styles.iconContainer, { backgroundColor: '#e8f5e9' }]}>
                        <Ionicons name="cash" size={24} color="#2e7d32" />
                    </View>
                    <View style={styles.optionTextContainer}>
                        <Text style={styles.optionTitle}>Cash Payment</Text>
                        <Text style={styles.optionSubtitle}>Pay at the counter</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.cancelButton} onPress={() => setPaymentModalVisible(false)}>
                      <Text style={styles.cancelButtonText}>Cancel</Text>
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
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Cashier Verification</Text>
                                <Text style={styles.modalSubtitle}>Please ask the cashier to verify your payment.</Text>
                            </View>

                            <View style={styles.inputContainer}>
                                <Ionicons name="person-outline" size={20} color="#888" style={styles.inputIcon} />
                                <TextInput 
                                    style={styles.inputField} 
                                    placeholder="Cashier ID" 
                                    placeholderTextColor="#aaa"
                                    value={cashierId} 
                                    onChangeText={setCashierId} 
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Ionicons name="call-outline" size={20} color="#888" style={styles.inputIcon} />
                                <TextInput 
                                    style={styles.inputField} 
                                    placeholder="Phone Number" 
                                    placeholderTextColor="#aaa"
                                    value={cashierPhone} 
                                    onChangeText={setCashierPhone} 
                                    keyboardType="phone-pad" 
                                    maxLength={10} 
                                />
                            </View>

                            {cashierName && (
                                <View style={styles.cashierNameContainer}>
                                    <View style={styles.verifiedIconBg}>
                                        <Ionicons name="checkmark" size={16} color="white" />
                                    </View>
                                    <Text style={styles.cashierNameText}>Verified: {cashierName}</Text>
                                </View>
                            )}
                            
                            <TouchableOpacity style={[styles.verifyButton, !cashierName && styles.disabledVerifyButton]} onPress={handleCashierVerification} disabled={!cashierName}>
                                <Text style={styles.verifyButtonText}>Verify & Proceed</Text>
                                <Ionicons name="arrow-forward" size={20} color="white" style={{ marginLeft: 8 }} />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.cancelButton} onPress={() => setCashierModalVisible(false)}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
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
  paymentOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  cancelButton: {
    marginTop: 10,
    paddingVertical: 12,
    alignItems: 'center',
    width: '100%',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: -20,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  inputField: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  verifyButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  disabledVerifyButton: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  cashierNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  verifiedIconBg: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2e7d32',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cashierNameText: {
    fontSize: 16,
    color: '#2e7d32',
    fontWeight: '600',
  },
  processingContainer: { paddingVertical: 20, alignItems: 'center', justifyContent: 'center' },
  processingText: { marginTop: 15, fontSize: 16, fontWeight: '500', color: '#555' },
});
