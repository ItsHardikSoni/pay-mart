import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient'; // Adjust the path as necessary
import { cartState, CartItem } from '../app/cartState';

interface Product {
  id: number;
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
  const [error, setError] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState(cartState.items);

  useFocusEffect(
    useCallback(() => {
      setCartItems([...cartState.items]);
    }, [])
  );

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, mrp, stock');

        if (error) {
          throw error;
        }

        const products = (data || []).map((product: any) => ({
          ...product,
          id: Number(product.id),
          name: product.name.trim(),
          mrp: Number(product.mrp),
          stock: Number(product.stock),
        }));

        setAllProducts(products);
        setFilteredProducts(products);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

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

  const addToCart = (product: Product) => {
    const trimmedName = product.name.trim();
    const existingItem = cartState.items.find(
      (item) =>
        item.id === product.id.toString() &&
        item.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cartState.items.push({
        id: product.id.toString(),
        name: trimmedName,
        mrp: product.mrp,
        quantity: 1,
      });
    }
    setCartItems([...cartState.items]);
    console.log('Cart items:', cartState.items);
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.productContainer}>
      <View>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productDetails}>MRP: ${item.mrp.toFixed(2)}</Text>
        <Text style={styles.productDetails}>Stock: {item.stock}</Text>
      </View>
      <TouchableOpacity style={styles.addToCartButton} onPress={() => addToCart(item)}>
        <Text style={styles.addToCartButtonText}>Add to Cart</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" style={{ flex: 1, justifyContent: 'center' }} />;
  }

  if (error) {
    return <View style={styles.container}><Text>Error: {error}</Text></View>;
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
        keyExtractor={(item, index) => `${item.id}-${index}`}
        ListEmptyComponent={
          <View style={styles.noProducts}>
            <Ionicons name="search" size={90} color="#E0E0E0" />
            <Text style={styles.noProductsText}>No products found</Text>
            <Text style={styles.tryDifferentText}>Try a different search term</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20
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
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  productDetails: {
    fontSize: 14,
    color: 'gray',
  },
  addToCartButton: {
    backgroundColor: '#007BFF',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 5,
  },
  addToCartButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  noProducts: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50
  },
  noProductsText: {
    marginTop: 20,
    fontSize: 18,
    color: 'gray'
  },
  tryDifferentText: {
    marginTop: 5,
    fontSize: 14,
    color: 'darkgray'
  }
});