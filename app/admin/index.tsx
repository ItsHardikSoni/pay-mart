
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
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../supabaseClient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';

interface Product {
  id: number;
  name: string;
  mrp: number;
  stock: number;
  barcode?: string;
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, mrp, stock, barcode')
        .order('name', { ascending: true });
      if (error) throw error;
      setProducts(data || []);
    } catch (e: any) {
      Alert.alert('Error', 'Failed to fetch products.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const checkAdmin = async () => {
        const adminLoggedIn = await AsyncStorage.getItem('paymart:adminLoggedIn');
        if (adminLoggedIn !== 'true') {
          router.replace('/admin-login');
        } else {
          fetchProducts();
        }
      };
      checkAdmin();
    }, [router, fetchProducts])
  );

  const handleEdit = (product: Product) => {
    const productString = JSON.stringify(product);
    router.push({
      pathname: '/admin/edit',
      params: { product: productString },
    });
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
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for a product..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.productItem}>
            <View style={styles.productDetails}>
              <Text style={styles.productName}>{item.name}</Text>
              <View style={styles.productMeta}>
                <Text style={styles.productMrp}>MRP: ₹{item.mrp.toFixed(2)}</Text>
                <Text style={styles.productStock}>Stock: {item.stock}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.editButton} onPress={() => handleEdit(item)}>
              <Ionicons name="pencil" size={22} color={Colors.light.primary} />
            </TouchableOpacity>
          </View>
        )}
        onRefresh={fetchProducts}
        refreshing={loading}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={<Text style={styles.emptyText}>No products found.</Text>}
      />

      <TouchableOpacity
        style={[styles.fab, styles.fabCreate]}
        onPress={() => router.push('/admin/create')}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.fab, styles.fabDelete]}
        onPress={() => router.push('/admin/delete')}
      >
        <Ionicons name="trash" size={24} color="#fff" />
      </TouchableOpacity>
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100, // To avoid FAB overlap
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
  editButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#e7f3ff',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#666',
  },
  fab: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabCreate: {
    right: 30,
    bottom: 100,
    width: 60,
    height: 60,
    backgroundColor: Colors.light.primary,
  },
  fabDelete: {
    right: 30,
    bottom: 30,
    width: 56,
    height: 56,
    backgroundColor: '#FF0000',
  },
});
