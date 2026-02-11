
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient'; // Adjust the path as necessary
import { cartState } from '../app/cartState';
import * as Location from 'expo-location';
import { Colors } from '../constants/theme';

// Haversine formula to calculate distance between two coordinates
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180; // φ, λ in radians
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  const d = R * c; // in metres
  return d;
}

// Define the allowed location and radius
const ALLOWED_LOCATION = {
  latitude: 25.610465587079343, // Example: Griham Hostel
  longitude: 85.05561450520987,
};
const MAX_DISTANCE = 100; // in meters

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
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState(cartState.items);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationError, setLocationError] = useState<string | null>('Initializing location...');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | undefined;
    let serviceCheckInterval: ReturnType<typeof setInterval> | undefined;

    const startWatching = async () => {
      try {
        let { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') {
            status = (await Location.requestForegroundPermissionsAsync()).status;
        }
        if (status !== 'granted') {
            setLocationError('Location permission not granted. Please enable it in app settings.');
            return;
        }

        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (!servicesEnabled) {
            setLocationError('Location services are disabled. Please enable them in your device settings to continue.');
            return;
        }
        
        setLocationError(null); // Clear initial message

        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 1000,
            distanceInterval: 1,
          },
          (newLocation) => {
            setLocation(newLocation);
            setLocationError(null); 
          }
        );

        serviceCheckInterval = setInterval(async () => {
          const servicesStillEnabled = await Location.hasServicesEnabledAsync();
          if (!servicesStillEnabled) {
            setLocation(null);
            setLocationError('Location services were disabled. Please re-enable them.');
            if (locationSubscription) {
              locationSubscription.remove();
              locationSubscription = undefined;
            }
          }
        }, 3000);

      } catch (err) {
        console.error('Location setup failed:', err);
        setLocationError('Failed to start location tracking. Please ensure location is on and permissions are granted.');
      }
    };

    startWatching();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
      if (serviceCheckInterval) {
        clearInterval(serviceCheckInterval);
      }
    };
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, mrp, stock');

      if (error) throw error;

      const products = (data || []).map((product: any) => ({
        ...product,
        id: Number(product.id),
        name: product.name.trim(),
        mrp: Number(product.mrp),
        stock: Number(product.stock),
      }));

      setAllProducts(products);
      if (searchQuery) {
        const filteredData = products.filter((product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredProducts(filteredData);
      } else {
        setFilteredProducts(products);
      }

    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  }, [searchQuery]);

  useFocusEffect(
    useCallback(() => {
      setCartItems([...cartState.items]);
    }, [])
  );

  useEffect(() => {
    if (!locationError) {
        setLoading(true);
        fetchProducts();
    }
  }, [locationError]);

  const handleSearch = (query: string) => {
    if (!location) {
        Alert.alert('Location', 'Waiting for location data. Please ensure location services are on.');
        return;
    }
    const distance = getDistance(
      location.coords.latitude,
      location.coords.longitude,
      ALLOWED_LOCATION.latitude,
      ALLOWED_LOCATION.longitude
    );

    if (distance > MAX_DISTANCE) {
      Alert.alert('Out of Range', 'You are too far from the allowed area to search.');
      return;
    }

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
    if (product.stock === 0) {
      Alert.alert('Out of Stock', 'This item is currently unavailable.');
      return;
    }

    if (!location) {
      Alert.alert('Location', 'Cannot add to cart. Waiting for location data.');
      return;
    }
    const distance = getDistance(
      location.coords.latitude,
      location.coords.longitude,
      ALLOWED_LOCATION.latitude,
      ALLOWED_LOCATION.longitude
    );
    if (distance > MAX_DISTANCE) {
      Alert.alert('Out of Range', 'You are too far from the allowed area to add items to the cart.');
      return;
    }
    
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    const trimmedName = product.name.trim();
    const existingItem = cartState.items.find(
      (item) =>
        item.id === product.id.toString() &&
        item.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );

    let qtyNumber = 1;
    if (existingItem) {
      existingItem.quantity += 1;
      qtyNumber = existingItem.quantity;
    } else {
      cartState.items.push({
        id: product.id.toString(),
        name: trimmedName,
        mrp: product.mrp,
        quantity: 1,
      });
    }
    setCartItems([...cartState.items]);
    setToastMessage(`${trimmedName} added to cart.`);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 2500);
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.productContainer}>
      <View>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productDetails}>MRP: ${item.mrp.toFixed(2)}</Text>
        <Text style={styles.productDetails}>Stock: {item.stock}</Text>
      </View>
      {item.stock > 0 ? (
        <TouchableOpacity style={styles.addToCartButton} onPress={() => addToCart(item)}>
          <Text style={styles.addToCartButtonText}>Add to Cart</Text>
        </TouchableOpacity>
      ) : (
        <View style={[styles.addToCartButton, styles.outOfStockButton]}>
          <Text style={styles.addToCartButtonText}>Out of Stock</Text>
        </View>
      )}
    </View>
  );

  if (locationError) {
      return (
          <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name="location-outline" size={80} color="#E0E0E0" />
              <Text style={styles.errorText}>{locationError}</Text>
              <TouchableOpacity onPress={() => router.back()} style={styles.goBackButton}>
                  <Text style={styles.goBackButtonText}>Go Back</Text>
              </TouchableOpacity>
          </View>
      )
  }

  if (loading && !refreshing) {
    return <ActivityIndicator size="large" color={Colors.light.primary} style={{ flex: 1, justifyContent: 'center' }} />;
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
          editable={!locationError && !!location}
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.light.primary]}
          />
        }
      />
      {toastMessage && (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
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
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  productDetails: {
    fontSize: 14,
    color: 'gray',
  },
  addToCartButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 5,
  },
  outOfStockButton: {
    backgroundColor: '#A9A9A9',
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
  },
  errorText: {
      fontSize: 16,
      textAlign: 'center',
      marginTop: 20,
      marginBottom: 20,
      color: '#333'
  },
  goBackButton: {
      backgroundColor: Colors.light.primary,
      paddingHorizontal: 30,
      paddingVertical: 12,
      borderRadius: 8,
  },
  goBackButtonText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 16
  },
  toastContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
