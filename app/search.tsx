
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Colors } from '../constants/theme';

interface Product {
  id: string; 
  name: string;
  mrp: number;
  stock: number;
}

export default function SearchProducts() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setError(null);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, mrp, stock');

      if (error) throw error;

      const products = (data || []).map((product: any) => ({
        ...product,
        id: product.id.toString(), // Ensure ID is a string
        name: product.name.trim(),
        mrp: Number(product.mrp),
        stock: Number(product.stock),
      }));

      setAllProducts(products);
      setFilteredProducts(products); // Initially show all products

    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  }, [fetchProducts]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query) {
      const filteredData = allProducts.filter((product) =>
        product.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredProducts(filteredData);
    } else {
      setFilteredProducts(allProducts);
    }
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.productContainer}>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productDetails}>MRP: ₹{item.mrp.toFixed(2)}</Text>
      </View>
      <View style={styles.stockInfo}>
        <Text style={[styles.stockText, item.stock > 0 ? styles.inStock : styles.outOfStock]}>
          {item.stock > 0 ? `In Stock: ${item.stock}` : 'Out of Stock'}
        </Text>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return <ActivityIndicator size="large" color={Colors.light.primary} style={{ flex: 1, justifyContent: 'center' }} />;
  }

  if (error) {
    return (
        <View style={styles.container}>
            <Text style={styles.errorText}>Error: {error}</Text>
            <TouchableOpacity onPress={fetchProducts} style={styles.goBackButton}>
                <Text style={styles.goBackButtonText}>Try Again</Text>
            </TouchableOpacity>
        </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="black" />
        <Text style={styles.pageTitle}>Search Products</Text>
      </TouchableOpacity>
      <View style={styles.searchSection}>
        <Ionicons name="search-outline" style={styles.searchIcon} size={22} color="gray" />
        <TextInput
          style={styles.input}
          placeholder="Search by name..."
          value={searchQuery}
          onChangeText={handleSearch}
        /> 
      </View>
      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.noProducts}>
            <Ionicons name="search" size={90} color="#E0E0E0" />
            <Text style={styles.noProductsText}>No products found</Text>
            <Text style={styles.tryDifferentText}>Try a different search term</Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.light.primary]}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 15,
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  productContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  productDetails: {
    fontSize: 14,
    color: 'gray',
  },
  stockInfo: {
    paddingLeft: 10,
  },
  stockText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  inStock: {
    color: '#2E8B57', // SeaGreen
  },
  outOfStock: {
    color: '#DC143C', // Crimson
  },
  noProducts: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  noProductsText: {
    marginTop: 20,
    fontSize: 18,
    color: 'gray',
  },
  tryDifferentText: {
    marginTop: 5,
    fontSize: 14,
    color: 'darkgray',
  },
  errorText: {
      fontSize: 16,
      textAlign: 'center',
      marginTop: 20,
      marginBottom: 20,
      color: '#DC143C'
  },
  goBackButton: {
      backgroundColor: Colors.light.primary,
      paddingHorizontal: 30,
      paddingVertical: 12,
      borderRadius: 8,
      alignSelf: 'center',
  },
  goBackButtonText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 16
  },
});
