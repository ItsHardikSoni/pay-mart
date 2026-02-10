
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../../supabaseClient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import { Swipeable } from 'react-native-gesture-handler';

interface Product {
  id: number;
  name: string;
  mrp: number;
  stock: number;
}

export default function DeleteProductScreen() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('products').select('id, name, mrp, stock').order('name', { ascending: true });
      if (error) throw error;
      setProducts(data || []);
    } catch (e) {
      Alert.alert('Error', 'Failed to fetch products.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, [fetchProducts])
  );

  const handleDelete = (productId: number) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this product?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('products').delete().eq('id', productId);
            if (error) throw error;
            fetchProducts(); // Refresh the list
          } catch (e) {
            Alert.alert('Error', 'Failed to delete product.');
          }
        },
      },
    ]);
  };

  const renderRightActions = (productId: number) => {
    return (
      <TouchableOpacity
        onPress={() => handleDelete(productId)}
        style={styles.deleteButton}
      >
        <Ionicons name="trash-bin" size={24} color="#fff" />
      </TouchableOpacity>
    );
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
        <View style={styles.header}>
            <Text style={styles.headerTitle}>Manage Products</Text>
        </View>
        <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
                style={styles.searchInput}
                placeholder="Search for a product..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#999"
            />
        </View>
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
            <Swipeable renderRightActions={() => renderRightActions(item.id)}>
                <View style={styles.productItem}>
                    <View style={styles.productDetails}>
                        <Text style={styles.productName}>{item.name}</Text>
                        <View style={styles.productMeta}>
                            <Text style={styles.productMrp}>MRP: ₹{item.mrp.toFixed(2)}</Text>
                            <Text style={styles.productStock}>Stock: {item.stock}</Text>
                        </View>
                    </View>
                    <View style={styles.swipeIndicator}>
                        <Ionicons name="chevron-back-outline" size={24} color="#ccc" />
                    </View>
                </View>
            </Swipeable>
        )}
        onRefresh={fetchProducts}
        refreshing={loading}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        backgroundColor: Colors.light.primary,
        padding: 24,
        paddingTop: 28,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        margin: 16,
        paddingHorizontal: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        height: 50,
        fontSize: 16,
        color: '#333',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    listContainer: {
        paddingHorizontal: 16,
        paddingBottom: 24,
    },
    productItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    productDetails: {
        flex: 1,
    },
    productName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    productMeta: {
        flexDirection: 'row',
        marginTop: 8,
    },
    productMrp: {
        fontSize: 14,
        color: '#666',
        marginRight: 16,
    },
    productStock: {
        fontSize: 14,
        color: Colors.light.primary,
        fontWeight: 'bold',
    },
    deleteButton: {
        backgroundColor: '#FF0000',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        height: '100%',
        borderTopRightRadius: 12,
        borderBottomRightRadius: 12,
    },
    swipeIndicator: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingLeft: 10,
    },
});
