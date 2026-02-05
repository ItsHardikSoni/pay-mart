
import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cartState, CartItem } from '../cartState';
import { router, useFocusEffect } from 'expo-router';

export default function CartScreen() {
  const [cartItems, setCartItems] = useState(cartState.items);

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
            <Ionicons name="remove" size={22} color="#6c63ff" />
          </TouchableOpacity>
          <Text style={styles.itemQuantity}>{item.quantity}</Text>
          <TouchableOpacity style={styles.quantityButton} onPress={() => updateQuantity(item, item.quantity + 1)}>
            <Ionicons name="add" size={22} color="#6c63ff" />
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
          <TouchableOpacity style={styles.startButton} onPress={() => router.push('/(tabs)/scan')}>
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
            <TouchableOpacity style={styles.checkoutButton}>
              <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
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
    backgroundColor: '#6c63ff',
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
    backgroundColor: '#6c63ff',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginTop: 30,
    shadowColor: '#6c63ff',
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
    color: '#6c63ff',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  checkoutButton: {
    backgroundColor: '#6c63ff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
