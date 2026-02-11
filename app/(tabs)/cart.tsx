
import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, SafeAreaView, Modal, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cartState, CartItem } from '../cartState';
import { router, useFocusEffect } from 'expo-router';
import { Colors } from '../../constants/theme';

export default function CartScreen() {
  const [cartItems, setCartItems] = useState(cartState.items);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      setCartItems([...cartState.items]);
    }, [])
  );

  const updateQuantity = (item: CartItem, newQuantity: number) => {
    const itemIndex = cartState.items.findIndex(i => i.id === item.id && i.name === item.name);

    if (itemIndex === -1) return;

    if (newQuantity > 0) {
      cartState.items[itemIndex].quantity = newQuantity;
    } else {
      cartState.items.splice(itemIndex, 1);
    }
    setCartItems([...cartState.items]);
  };

  const renderItem = ({ item }: { item: CartItem }) => {
    const itemPrice = (item as any).mrp ?? (item as any).price ?? 0;

    return (
      <View style={styles.itemContainer}>
        <View style={styles.itemDetails}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemPrice}>₹{itemPrice.toFixed(2)}</Text>
        </View>
        <View style={styles.itemQuantityContainer}>
          <TouchableOpacity style={styles.quantityButton} onPress={() => updateQuantity(item, item.quantity - 1)}>
            <Ionicons name="remove" size={22} color={Colors.light.primary} />
          </TouchableOpacity>
          <Text style={styles.itemQuantity}>{item.quantity}</Text>
          <TouchableOpacity style={styles.quantityButton} onPress={() => updateQuantity(item, item.quantity + 1)}>
            <Ionicons name="add" size={22} color={Colors.light.primary} />
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

  const handleCheckout = () => {
    setPaymentModalVisible(true);
  };

  const renderPaymentModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={paymentModalVisible}
      onRequestClose={() => {
        setPaymentModalVisible(!paymentModalVisible);
      }}
    >
      <TouchableWithoutFeedback onPress={() => setPaymentModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Payment Method</Text>
              <TouchableOpacity style={styles.paymentOption} onPress={() => console.log('Online Payment')}>
                <Ionicons name="card-outline" size={24} color="white" style={styles.paymentOptionIcon} />
                <Text style={styles.paymentOptionText}>Online Payment</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.paymentOption} onPress={() => console.log('Cash Payment')}>
                <Ionicons name="cash-outline" size={24} color="white" style={styles.paymentOptionIcon} />
                <Text style={styles.paymentOptionText}>Cash Payment</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Cart</Text>
        <View style={styles.itemsBadge}>
          <Text style={styles.itemsBadgeText}>{cartItems.length} items</Text>
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
          <FlatList
            data={cartItems}
            renderItem={renderItem}
            keyExtractor={(item, index) => `${item.id}-${item.name}-${index}`}
            contentContainerStyle={styles.list}
          />
          <View style={styles.footer}>
            <View style={styles.totalRow}>
                <Text style={styles.totalText}>Total</Text>
                <Text style={styles.totalAmount}>₹{getTotal()}</Text>
            </View>
            <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
              <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
      {renderPaymentModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  header: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#333',
  },
  itemsBadge: {
    backgroundColor: Colors.light.primary,
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  itemsBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    color: '#444',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#777',
    marginTop: 10,
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginTop: 30,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  list: {
      paddingHorizontal: 16,
      paddingVertical: 16,
  },
  itemContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  itemDetails: {
    flex: 1,
    marginRight: 10,
  },
  itemName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  itemPrice: {
    fontSize: 15,
    color: Colors.light.primary,
    marginTop: 4,
    fontWeight: '500',
  },
  itemQuantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    borderRadius: 20,
  },
  quantityButton: {
    padding: 8,
  },
  itemQuantity: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 12,
    color: '#333',
  },
  footer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 20, // For safe area
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  totalText: {
    fontSize: 18,
    color: '#555',
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  checkoutButton: {
    backgroundColor: Colors.light.primary,
    padding: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 22,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
    color: '#333',
  },
  paymentOption: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentOptionIcon: {
    marginRight: 15,
  },
  paymentOptionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
