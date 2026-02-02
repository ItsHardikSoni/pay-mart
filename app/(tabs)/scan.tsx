
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, Alert, ScrollView, Animated, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, BarCodeScanningResult, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';

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
  latitude: 25.610958086828944, // Example: Griham Hostel
  longitude: 85.05541416931267,
};
const MAX_DISTANCE = 200; // in meters

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

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationError('Location permission not granted. Please enable it in settings.');
          return;
        }
        try {
          const location = await Location.getCurrentPositionAsync({});
          setLocation(location);
        } catch (error) {
          setLocationError('Could not fetch location. Please ensure location services are enabled.');
        }
      })();
    }, [])
  );

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

  useEffect(() => {
    if (showCamera) {
      startLineAnimation();
    }
  }, [showCamera]);

  const startLineAnimation = () => {
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
  };

  const SUPPORTED_TYPES = [
    'ean13',
    'ean8',
    'upc_a',
    'upc_e',
    'code39',
    'code128',
  ];  

  const handleBarCodeScanned = ({ type, data }: BarCodeScanningResult) => {
    if (!SUPPORTED_TYPES.includes(type)) {
      return; // ignore unsupported barcode
    }
    setScanned(true);
    setBarcode(data);
    setShowCamera(false);
    playSound();
  };

  const handleManualBarcodeSearch = () => {
    if (manualBarcode.trim() === '') {
      Alert.alert('Empty Barcode', 'Please enter a barcode number.');
      return;
    }
    setBarcode(manualBarcode);
    setManualBarcode('');
    Alert.alert('Barcode Entered', `You entered: ${manualBarcode}`);
    playSound();
  };

  const toggleFlash = () => {
    setIsFlashOn(!isFlashOn);
  };
  
  const handleScanPress = () => {
    if (locationError) {
      Alert.alert('Location Error', locationError);
      return;
    }

    if (!location) {
      Alert.alert('Location Not Found', 'Could not determine your location. Please ensure location services are enabled.');
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
          contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
        >
          <View style={styles.scanContainer}>
            <Ionicons name="camera-outline" size={80} color="#6c63ff" />
            <Text style={styles.readyToScanText}>Ready to Scan</Text>
            {barcode && (
              <Text style={{ marginTop: 12, fontSize: 18, fontWeight: 'bold', color: '#6c63ff' }}>
                Scanned Barcode: {barcode}
              </Text>
            )}

            <Text style={styles.promptText}>Point your camera at the product barcode</Text>
            <TouchableOpacity
              style={styles.startButton}
              onPress={handleScanPress}
            >
              <Ionicons name="scan" size={20} color="white" />
              <Text style={styles.startButtonText}>Scan Products</Text>
            </TouchableOpacity>


          </View>

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
          </View>
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
});
