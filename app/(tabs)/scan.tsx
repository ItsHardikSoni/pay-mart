import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../supabaseClient';
import { cartState, CartItem } from '../cartState';

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
// const ALLOWED_LOCATION = {
//   latitude: 25.612251780611935, // Example: Amity University
//   longitude: 85.0542689775534,
// };
const ALLOWED_LOCATION = {
  latitude: 25.610465587079343, // Example: Griham Hostel
  longitude: 85.05561450520987, 
};
const MAX_DISTANCE = 100; // in meters

type Product = {
  id: string;
  barcode: string;
  name: string;
  mrp: number;
  discount_rate: number;
  stock: number;
};

export default function ScanScreen() {
  const [showCamera, setShowCamera] = useState(false);
  const [barcode, setBarcode] = useState<string | null>(null);
  const [manualBarcode, setManualBarcode] = useState('');
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const insets = useSafeAreaInsets();
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [sound, setSound] = useState<Audio.Sound>();
  const lineAnimation = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [isFetchingProduct, setIsFetchingProduct] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [productNotFoundError, setProductNotFoundError] = useState<string | null>(null);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | undefined;
    let serviceCheckInterval: ReturnType<typeof setInterval> | undefined;

    const startWatching = async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission not granted. Please enable it in settings.');
        return;
      }

      // Watch for position updates
      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000, // Update every second
          distanceInterval: 1, // Update every meter
        },
        (newLocation) => {
          setLocation(newLocation);
          setLocationError(null); // Clear error on successful update
        }
      );

      // Periodically check if location services are enabled
      serviceCheckInterval = setInterval(async () => {
        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (!servicesEnabled) {
          setLocation(null); // Invalidate location
          setLocationError('Please turn on location services to use the scanner.');
        }
      }, 1000); // Check every second
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


  async function playSound() {
    const { sound } = await Audio.Sound.createAsync(require('../../assets/sounds/beep.mp3'));
    setSound(sound);
    await sound.playAsync();
  }

  useEffect(() => {
    return sound
      ? () => {
        sound.unloadAsync();
      }
      : undefined;
  }, [sound]);

  const startLineAnimation = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(lineAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(lineAnimation, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [lineAnimation]);

  useEffect(() => {
    if (showCamera) {
      startLineAnimation();
    }
  }, [showCamera, startLineAnimation]);

  const SUPPORTED_TYPES = [
    'ean13',
    'ean8',
    'upc_a',
    'upc_e',
    'code39',
    'code128',
  ];  

  const fetchProductByBarcode = useCallback(
    async (code: string) => {
      setProductNotFoundError(null);
      setSelectedProduct(null);

      try {
        setIsFetchingProduct(true);

        const { data, error } = await supabase
          .from('products')
          .select('id, barcode, name, mrp, discount_rate, stock')
          .eq('barcode', code.trim())
          .maybeSingle();

        if (error) {
          console.error('Error fetching product', error);
          setProductNotFoundError('Could not fetch product details. Please try again.');
          return;
        }

        if (!data) {
          setProductNotFoundError('No product found for this barcode.');
          return;
        }

        setSelectedProduct({
          id: data.id,
          barcode: data.barcode,
          name: data.name,
          mrp: Number(data.mrp),
          discount_rate: Number(data.discount_rate ?? 0),
          stock: Number(data.stock ?? 0),
        });
        setQuantity('1');
      } catch (err) {
        console.error('Unexpected error while fetching product', err);
        setProductNotFoundError('Something went wrong while fetching product.');
      } finally {
        setIsFetchingProduct(false);
      }
    },
    []
  );

  const handleAddToCart = () => {
    if (!selectedProduct) return;

    const qtyNumber = parseInt(quantity, 10);

    if (isNaN(qtyNumber) || qtyNumber <= 0) {
      Alert.alert('Invalid quantity', 'Please enter a valid quantity.');
      return;
    }

    if (qtyNumber > selectedProduct.stock) {
      Alert.alert('Stock', 'Requested quantity exceeds available stock.');
      return;
    }

    const existingItem = cartState.items.find((item) => item.id === selectedProduct.id);

    if (existingItem) {
      existingItem.quantity += qtyNumber;
    } else {
      cartState.items.push({
        id: selectedProduct.id,
        name: selectedProduct.name,
        price: selectedProduct.mrp,
        quantity: qtyNumber,
      });
    }

    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    const message = `${qtyNumber} x ${selectedProduct.name} added to cart.`;
    setToastMessage(message);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2500);

    setSelectedProduct(null);
    setManualBarcode('');
  };

  const handleBarCodeScanned = async ({ type, data }: BarcodeScanningResult) => {
    if (locationError) {
      Alert.alert('Location', locationError);
      setShowCamera(false);
      return;
    }
    if (!location) {
      Alert.alert('Location', 'Could not determine your location. Please ensure location services are enabled.');
      setShowCamera(false);
      return;
    }
    const distance = getDistance(
      location.coords.latitude,
      location.coords.longitude,
      ALLOWED_LOCATION.latitude,
      ALLOWED_LOCATION.longitude
    );
    if (distance > MAX_DISTANCE) {
      Alert.alert('Out of Range', 'You have moved too far from the allowed scanning area.');
      setShowCamera(false);
      return;
    }
    if (!SUPPORTED_TYPES.includes(type)) {
      return; // ignore unsupported barcode
    }
    setScanned(true);
    setBarcode(data);
    setManualBarcode(data);
    setShowCamera(false);
    await playSound();
    fetchProductByBarcode(data);
  };

  const handleManualBarcodeSearch = () => {
    if (locationError) {
      Alert.alert('Location', locationError);
      return;
    }

    if (!location) {
      Alert.alert('Location', 'Could not determine your location. Please ensure location services are enabled.');
      return;
    }

    const distance = getDistance(
      location.coords.latitude,
      location.coords.longitude,
      ALLOWED_LOCATION.latitude,
      ALLOWED_LOCATION.longitude
    );

    if (distance > MAX_DISTANCE) {
      Alert.alert('Out of Range', 'You are too far from the allowed scanning area.');
      return;
    }
    
    if (manualBarcode.trim() === '') {
      Alert.alert('Empty Barcode', 'Please enter a barcode number.');
      return;
    }
    const trimmed = manualBarcode.trim();
    setBarcode(trimmed);
    playSound();
    fetchProductByBarcode(trimmed);
  };

  const toggleFlash = () => {
    setIsFlashOn(!isFlashOn);
  };
  
  const handleScanPress = () => {
    if (locationError) {
      Alert.alert('Location', locationError);
      return;
    }

    if (!location) {
      Alert.alert('Location', 'Could not determine your location. Please ensure location services are enabled.');
      return;
    }

    const distance = getDistance(
      location.coords.latitude,
      location.coords.longitude,
      ALLOWED_LOCATION.latitude,
      ALLOWED_LOCATION.longitude
    );

    if (distance > MAX_DISTANCE) {
      Alert.alert('Out of Range', 'You are too far from the allowed scanning area.');
      return;
    }

    setScanned(false);
    setShowCamera(true);
  };

  if (!permission) return null;

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Camera permission required</Text>
        <TouchableOpacity onPress={requestPermission}>
          <Text style={{ color: '#6c63ff', marginTop: 10 }}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={{ flex: 1, backgroundColor: '#f0f2f5' }}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.container}
          contentContainerStyle={{ paddingTop: 20, paddingBottom: 20 }}
        >
          <View style={styles.manualContainer}>
            <Text style={styles.manualEntryTitle}>Manual Barcode Entry</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter barcode number"
                placeholderTextColor="#888"
                value={manualBarcode}
                onChangeText={setManualBarcode}
                keyboardType="numeric"
                maxLength={13}
                onFocus={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
              />
              <TouchableOpacity style={styles.searchButton} onPress={handleManualBarcodeSearch}>
                <Ionicons name="search" size={24} color="white" />
              </TouchableOpacity>
            </View>
            <Text style={styles.inputCaption}>Use this if the barcode is damaged or unreadable</Text>
            <TouchableOpacity
              style={styles.startButton}
              onPress={handleScanPress}
            >
              <Ionicons name="scan" size={20} color="white" />
              <Text style={styles.startButtonText}>Scan Products</Text>
            </TouchableOpacity>
          </View>

          {productNotFoundError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{productNotFoundError}</Text>
            </View>
          )}

          {isFetchingProduct && <Text>Fetching product...</Text>}

          {selectedProduct && (
            <View style={styles.productDetailsContainer}>
                <View style={styles.modalBody}>
                  <Text style={styles.modalTitle}>{selectedProduct.name}</Text>
                  <Text style={styles.modalSubtitle}>Barcode: {selectedProduct.barcode}</Text>

                  <View style={styles.modalPriceRow}>
                    <View>
                      <Text style={styles.priceLabel}>MRP</Text>
                      <Text style={styles.priceValue}>₹{selectedProduct.mrp.toFixed(2)}</Text>
                    </View>
                    <View style={styles.discountPill}>
                      <Text style={styles.discountText}>{selectedProduct.discount_rate}₹ Save</Text>
                    </View>
                  </View>

                  <Text style={styles.stockText}>Stock available: {selectedProduct.stock}</Text>

                  <View style={styles.quantityRow}>
                    <Text style={styles.modalText}>Quantity</Text>
                    <TextInput
                      style={styles.quantityInput}
                      keyboardType="numeric"
                      value={quantity}
                      onChangeText={setQuantity}
                    />
                  </View>
                </View>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => setSelectedProduct(null)}
                  >
                    <Text style={styles.secondaryButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.addToCartButton}
                    onPress={handleAddToCart}
                  >
                    <Text style={styles.addToCartButtonText}>Add to Cart</Text>
                  </TouchableOpacity>
                </View>
            </View>
          )}
        </ScrollView>

        {showCamera && (
          <>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              enableTorch={isFlashOn}
              focusable={true}
            >
              <View style={styles.cameraOverlay}>
                <TouchableOpacity
                  style={styles.flashButton}
                  onPress={toggleFlash}
                >
                  <Ionicons name={isFlashOn ? 'flash' : 'flash-off'} size={28} color="white" />
                </TouchableOpacity>
                <Animated.View
                  style={[
                    styles.scanLine,
                    {
                      transform: [
                        {
                          translateY: lineAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 200], // Adjust the range based on your scanner area
                          }),
                        },
                      ],
                    },
                  ]}
                />
              </View>
            </CameraView>
            <TouchableOpacity
              style={{
                position: 'absolute',
                top: insets.top + 10,
                left: 20,
                zIndex: 10,
              }}
              onPress={() => {
                setShowCamera(false);
                setScanned(false);
              }}
            >
              <Ionicons name="arrow-back" size={28} color="white" />
            </TouchableOpacity>
          </>
        )}
        {toastMessage && (
          <View style={styles.toastContainer}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    paddingHorizontal: 16,
  },
  scanContainer: {
    backgroundColor: '#e6e6fa',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  readyToScanText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 16,
  },
  promptText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: '#6c63ff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 24,
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  manualContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
  },
  manualEntryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
    marginLeft: 8,
  },
  inputCaption: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanLine: {
    width: '80%',
    height: 2,
    backgroundColor: 'red',
    position: 'absolute',
  },
  flashButton: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  toastContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 32,
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  toastText: {
    color: '#fff',
    fontSize: 14,
  },
  productDetailsContainer: {
    marginTop: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 10,
  },
  errorContainer: {
    marginTop: 16,
    backgroundColor: '#ffcdd2',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  errorText: {
    color: '#b71c1c',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#6c63ff',
  },
  modalTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  modalTagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 6,
  },
  modalPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
  },
  discountPill: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  discountText: {
    color: '#2e7d32',
    fontSize: 13,
    fontWeight: '600',
  },
  stockText: {
    fontSize: 13,
    color: '#4caf50',
    marginTop: 4,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  quantityInput: {
    marginLeft: 8,
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fafafa',
  },
  secondaryButton: {
    flex: 1,
    marginRight: 8,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  addToCartButton: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: '#6c63ff',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  addToCartButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
