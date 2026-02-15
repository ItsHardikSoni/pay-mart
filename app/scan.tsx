
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/theme';
import { cartState } from '../context/cartState';
import { supabase } from '../supabaseClient';

// Haversine formula to calculate distance
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // in metres
}

type Product = {
  id: string;
  barcode: string;
  name: string;
  mrp: number;
  discount_rate: number;
  stock: number;
};

export default function ScanScreen() {
  const router = useRouter();
  const [showCamera, setShowCamera] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationError, setLocationError] = useState<string | null>('Initializing...');

  // State for real-time location settings
  const [allowedLatitude, setAllowedLatitude] = useState<number | null>(null);
  const [allowedLongitude, setAllowedLongitude] = useState<number | null>(null);
  const [maxDistance, setMaxDistance] = useState<number | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  const insets = useSafeAreaInsets();
  const [scanned, setScanned] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const soundRef = useRef<Audio.Sound | null>(null);
  const lineAnimation = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [isFetchingProduct, setIsFetchingProduct] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [productNotFoundError, setProductNotFoundError] = useState<string | null>(null);

  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const { sound } = await Audio.Sound.createAsync(require('../assets/sounds/beep.mp3'));
        soundRef.current = sound;
      } catch (error) { console.error('Failed to setup audio:', error); }
    };
    setupAudio();
    return () => { soundRef.current?.unloadAsync(); };
  }, []);

  // Effect for fetching location settings every second
  useEffect(() => {
    const fetchSettings = async (isInitial: boolean) => {
      if (isInitial) {
        setSettingsLoading(true);
      }
      try {
        const { data, error } = await supabase.from('admin_settings').select('latitude, longitude, max_distance').single();
        if (error) throw error;
        if (data) {
          setAllowedLatitude(data.latitude);
          setAllowedLongitude(data.longitude);
          setMaxDistance(data.max_distance);
          if (settingsError) setSettingsError(null); // Clear error on successful fetch
        } else {
          throw new Error("Location settings not found in database.");
        }
      } catch (error: any) {
        setSettingsError("Failed to update location settings.");
        console.error("Error fetching settings:", error);
      } finally {
        if (isInitial) {
          setSettingsLoading(false);
        }
      }
    };

    fetchSettings(true); // Fetch immediately on mount

    const intervalId = setInterval(() => fetchSettings(false), 1000); // Poll every second

    return () => clearInterval(intervalId); // Cleanup
  }, []);

  useEffect(() => {
    if (settingsLoading || settingsError) return;

    let locationSubscription: Location.LocationSubscription | undefined;
    let serviceCheckInterval: ReturnType<typeof setInterval> | undefined;

    const startWatching = async () => {
      try {
        let { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') status = (await Location.requestForegroundPermissionsAsync()).status;
        if (status !== 'granted') {
          setLocationError('Location permission is required. Please enable it in settings.');
          return;
        }

        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (!servicesEnabled) {
          setLocationError('Location services are disabled. Please enable them to use the scanner.');
          return;
        }

        setLocationError(null);

        locationSubscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: 1000, distanceInterval: 1 },
          (newLocation) => {
            setLocation(newLocation);
            if (allowedLatitude && allowedLongitude && maxDistance) {
              const distance = getDistance(newLocation.coords.latitude, newLocation.coords.longitude, allowedLatitude, allowedLongitude);
              if (distance > maxDistance) {
                setLocationError(`You are outside the allowed scanning area (${Math.round(distance)}m away).`);
              } else {
                setLocationError(null); // Location OK
              }
            } else {
              setLocationError('Cannot verify location, settings are missing.');
            }
          }
        );

        serviceCheckInterval = setInterval(async () => {
          if (!(await Location.hasServicesEnabledAsync())) {
            setLocation(null);
            setLocationError('Location services were disabled. Please re-enable them.');
            locationSubscription?.remove();
            locationSubscription = undefined;
          }
        }, 3000);

      } catch (err) {
        setLocationError('Failed to initialize location services.');
      }
    };

    startWatching();

    return () => {
      locationSubscription?.remove();
      if (serviceCheckInterval) clearInterval(serviceCheckInterval);
    };
  }, [settingsLoading, settingsError, allowedLatitude, allowedLongitude, maxDistance]);

  const playSound = useCallback(async () => {
    await soundRef.current?.setStatusAsync({ shouldPlay: true, positionMillis: 0 });
  }, []);

  const startLineAnimation = useCallback(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(lineAnimation, { toValue: 1, duration: 2000, useNativeDriver: false }),
      Animated.timing(lineAnimation, { toValue: 0, duration: 2000, useNativeDriver: false }),
    ])).start();
  }, [lineAnimation]);

  useEffect(() => {
    if (showCamera) startLineAnimation();
  }, [showCamera, startLineAnimation]);

  const fetchProductByBarcode = useCallback(async (code: string) => {
    setProductNotFoundError(null);
    setSelectedProduct(null);
    setIsFetchingProduct(true);
    try {
      const { data, error } = await supabase.from('products').select('id, barcode, name, mrp, discount_rate, stock').eq('barcode', code.trim()).maybeSingle();
      if (error) throw new Error('Could not fetch product details.');
      if (!data) throw new Error('No product found for this barcode.');
      setSelectedProduct({ id: data.id.toString(), barcode: data.barcode, name: data.name.trim(), mrp: Number(data.mrp), discount_rate: Number(data.discount_rate ?? 0), stock: Number(data.stock ?? 0) });
      setQuantity('1');
    } catch (err: any) {
      setProductNotFoundError(err.message);
    } finally {
      setIsFetchingProduct(false);
    }
  }, []);

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    const qtyNumber = parseInt(quantity, 10);
    if (isNaN(qtyNumber) || qtyNumber <= 0) {
      Alert.alert('Invalid quantity', 'Please enter a valid quantity.');
      return;
    }

    const existingItem = cartState.items.find(item => item.id === selectedProduct.id);
    const totalQuantity = (existingItem?.quantity || 0) + qtyNumber;

    if (totalQuantity > selectedProduct.stock) {
      Alert.alert('Stock Alert', `You can only add ${selectedProduct.stock - (existingItem?.quantity || 0)} more of this item.`);
      return;
    }

    if (existingItem) existingItem.quantity += qtyNumber;
    else cartState.items.push({ id: selectedProduct.id, name: selectedProduct.name.trim(), mrp: selectedProduct.mrp, quantity: qtyNumber });

    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(`${qtyNumber} x ${selectedProduct.name} added to cart.`);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 2500);

    setSelectedProduct(null);
    setManualBarcode('');
  };

  const updateQuantity = (amount: number) => {
    if (!selectedProduct) return;
    const currentQuantity = parseInt(quantity, 10) || 0;
    const alreadyInCart = cartState.items.find(item => item.id === selectedProduct.id)?.quantity || 0;
    let newQuantity = Math.max(1, currentQuantity + amount);
    if ((alreadyInCart + newQuantity) > selectedProduct.stock) {
      newQuantity = Math.max(1, selectedProduct.stock - alreadyInCart);
    }
    setQuantity(String(newQuantity));
  };

  const checkLocation = () => {
    if (settingsError) { Alert.alert('Settings Error', settingsError); return false; }
    if (locationError) { Alert.alert('Location Issue', locationError); return false; }
    if (!location || !allowedLatitude || !allowedLongitude || !maxDistance) {
      Alert.alert('Location Unavailable', 'Could not determine your location or settings. Please wait and try again.');
      return false;
    }
    const distance = getDistance(location.coords.latitude, location.coords.longitude, allowedLatitude, allowedLongitude);
    if (distance > maxDistance) {
      Alert.alert('Out of Range', 'You have moved too far from the allowed scanning area.');
      return false;
    }
    return true;
  };

  const handleBarCodeScanned = async ({ data }: BarcodeScanningResult) => {
    if (!checkLocation()) { setShowCamera(false); return; }
    setScanned(true);
    setManualBarcode(data);
    setShowCamera(false);
    await playSound();
    fetchProductByBarcode(data);
  };

  const handleManualBarcodeSearch = async () => {
    if (!checkLocation()) return;
    if (manualBarcode.trim() === '') { Alert.alert('Empty Barcode', 'Please enter a barcode number.'); return; }
    await playSound();
    fetchProductByBarcode(manualBarcode.trim());
  };

  const handleScanPress = () => {
    if (!checkLocation()) return;
    setScanned(false);
    setShowCamera(true);
  };

  if (settingsLoading) {
    return (
      <View style={styles.errorContainerCentered}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.errorText}>Loading location settings...</Text>
      </View>
    );
  }

  if (!cameraPermission) return <View />;

  if (!cameraPermission.granted) {
    return (
      <View style={styles.errorContainerCentered}>
        <Text style={styles.errorText}>Camera permission is required to scan products.</Text>
        <TouchableOpacity onPress={requestCameraPermission} style={styles.goBackButton}><Text style={styles.goBackButtonText}>Grant Permission</Text></TouchableOpacity>
      </View>
    );
  }

  if (settingsError || (locationError && !location)) {
    return (
      <View style={styles.errorContainerCentered}>
        <Ionicons name="location-outline" size={80} color="#E0E0E0" />
        <Text style={styles.errorText}>{settingsError || locationError}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.goBackButton}><Text style={styles.goBackButtonText}>Go Back</Text></TouchableOpacity>
      </View>
    );
  }

  const isIncreaseDisabled = () => {
    if (!selectedProduct) return true;
    const alreadyInCart = cartState.items.find(item => item.id === selectedProduct.id)?.quantity || 0;
    const currentQuantity = parseInt(quantity, 10) || 0;
    return (alreadyInCart + currentQuantity) >= selectedProduct.stock;
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={{ flex: 1, backgroundColor: '#f0f2f5' }}>
        <ScrollView ref={scrollViewRef} style={styles.container} contentContainerStyle={{ paddingVertical: 20 }}>
          <View style={styles.manualContainer}>
            <Text style={styles.manualEntryTitle}>Manual Barcode Entry</Text>
            <View style={styles.inputContainer}>
              <TextInput style={styles.input} placeholder="Enter barcode number" value={manualBarcode} onChangeText={setManualBarcode} keyboardType="numeric" maxLength={13} />
              <TouchableOpacity style={styles.searchButton} onPress={handleManualBarcodeSearch} disabled={!!locationError}><Ionicons name="search" size={24} color="white" /></TouchableOpacity>
            </View>
            <Text style={styles.inputCaption}>Use if the barcode is unreadable.</Text>
            {locationError && <Text style={styles.inlineErrorText}>{locationError}</Text>}
            <TouchableOpacity style={[styles.startButton, (!!locationError || !location) && styles.disabledButton]} onPress={handleScanPress} disabled={!!locationError || !location}>
              <Ionicons name="scan" size={20} color="white" />
              <Text style={styles.startButtonText}>Scan Products</Text>
            </TouchableOpacity>
          </View>

          {productNotFoundError && <View style={styles.errorProductContainer}><Text style={styles.errorProductText}>{productNotFoundError}</Text></View>}
          {isFetchingProduct && <ActivityIndicator size="large" color={Colors.light.primary} style={{ marginTop: 20 }} />}

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
                  <View style={styles.discountPill}><Text style={styles.discountText}>{selectedProduct.discount_rate}₹ Save</Text></View>
                </View>
                <Text style={styles.stockText}>Stock available: {selectedProduct.stock}</Text>
                <View style={styles.quantityRow}>
                  <Text style={styles.modalText}>Quantity</Text>
                  <View style={styles.quantityControl}>
                    <TouchableOpacity style={styles.quantityButton} onPress={() => updateQuantity(-1)}><Ionicons name="remove" size={22} color={Colors.light.primary} /></TouchableOpacity>
                    <Text style={styles.quantityValue}>{quantity}</Text>
                    <TouchableOpacity style={[styles.quantityButton, isIncreaseDisabled() && styles.disabledQuantityButton]} onPress={() => updateQuantity(1)} disabled={isIncreaseDisabled()}><Ionicons name="add" size={22} color={isIncreaseDisabled() ? '#999' : Colors.light.primary} /></TouchableOpacity>
                  </View>
                </View>
              </View>
              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => setSelectedProduct(null)}><Text style={styles.secondaryButtonText}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}><Text style={styles.addToCartButtonText}>Add to Cart</Text></TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>

        {showCamera && (
          <>
            <CameraView style={StyleSheet.absoluteFillObject} onBarcodeScanned={scanned ? undefined : handleBarCodeScanned} enableTorch={isFlashOn} focusable={true}>
              <View style={styles.cameraOverlay}>
                <TouchableOpacity style={styles.flashButton} onPress={() => setIsFlashOn(!isFlashOn)}><Ionicons name={isFlashOn ? 'flash' : 'flash-off'} size={28} color="white" /></TouchableOpacity>
                <Animated.View style={[styles.scanLine, { transform: [{ translateY: lineAnimation.interpolate({ inputRange: [0, 1], outputRange: [0, 200] }) }] }]} />
              </View>
            </CameraView>
            <TouchableOpacity style={{ position: 'absolute', top: insets.top + 10, left: 20, zIndex: 10 }} onPress={() => setShowCamera(false)}><Ionicons name="arrow-back" size={28} color="white" /></TouchableOpacity>
          </>
        )}
        {toastMessage && <View style={styles.toastContainer}><Text style={styles.toastText}>{toastMessage}</Text></View>}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5', paddingHorizontal: 16 },
  errorContainerCentered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  errorText: { fontSize: 16, textAlign: 'center', color: '#333', marginBottom: 20 },
  inlineErrorText: { fontSize: 14, textAlign: 'center', color: Colors.light.danger, marginTop: 12, marginBottom: -12 },
  goBackButton: { backgroundColor: Colors.light.primary, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 8 },
  goBackButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  manualContainer: { backgroundColor: 'white', borderRadius: 16, padding: 24 },
  manualEntryTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.light.primary },
  inputContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  input: { flex: 1, backgroundColor: '#f0f2f5', borderRadius: 8, padding: 12, fontSize: 16 },
  searchButton: { backgroundColor: Colors.light.primary, borderRadius: 8, padding: 12, marginLeft: 8 },
  inputCaption: { fontSize: 14, color: '#666', marginTop: 8 },
  startButton: { backgroundColor: Colors.light.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, marginTop: 24 },
  disabledButton: { backgroundColor: '#A9A9A9' },
  startButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  errorProductContainer: { marginTop: 16, backgroundColor: '#ffcdd2', borderRadius: 16, padding: 16, alignItems: 'center' },
  errorProductText: { color: '#b71c1c', fontSize: 16, fontWeight: 'bold' },
  productDetailsContainer: { marginTop: 16, backgroundColor: 'white', borderRadius: 16, overflow: 'hidden' },
  modalBody: { padding: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  modalSubtitle: { fontSize: 14, color: '#666', marginBottom: 12 },
  modalPriceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, marginBottom: 8 },
  priceLabel: { fontSize: 12, color: '#888', marginBottom: 2 },
  priceValue: { fontSize: 24, fontWeight: '700', color: '#111' },
  discountPill: { backgroundColor: Colors.light.secondary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  discountText: { color: '#000', fontSize: 13, fontWeight: '600' },
  stockText: { fontSize: 14, color: '#4caf50', marginTop: 8, fontWeight: '500' },
  quantityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  modalText: { fontSize: 16, fontWeight: '500', color: '#333' },
  quantityControl: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  quantityButton: { padding: 8, backgroundColor: '#f0f2f5', borderRadius: 20 },
  disabledQuantityButton: { backgroundColor: '#e0e0e0' },
  quantityValue: { fontSize: 18, fontWeight: 'bold', marginHorizontal: 15, color: '#333' },
  modalFooter: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  secondaryButton: { flex: 1, padding: 14, alignItems: 'center', backgroundColor: '#f9f9f9' },
  secondaryButtonText: { fontSize: 16, color: '#555', fontWeight: '500' },
  addToCartButton: { flex: 1.5, backgroundColor: Colors.light.primary, padding: 14, alignItems: 'center' },
  addToCartButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  cameraOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
  scanLine: { width: '80%', height: 2, backgroundColor: Colors.light.secondary, position: 'absolute' },
  flashButton: { position: 'absolute', top: 40, right: 20, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20, padding: 8 },
  toastContainer: { position: 'absolute', left: 16, right: 16, bottom: 32, backgroundColor: 'rgba(0,0,0,0.85)', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 12, alignItems: 'center' },
  toastText: { color: '#fff', fontSize: 14, fontWeight: '500' },
});
