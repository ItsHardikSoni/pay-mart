
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { Colors } from '../constants/theme';
import { supabase } from '../supabaseClient';

// --- Location Configuration ---
const ALLOWED_LOCATION = {
  latitude: 25.610465587079343, // Griham Hostel
  longitude: 85.05561450520987, 
};
const MAX_DISTANCE = 100; // in meters

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;
  
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
    return R * c; // in metres
}
// -----------------------------

export default function AdminLoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationError, setLocationError] = useState<string | null>('Initializing location services...');
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const router = useRouter();

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | undefined;
    let serviceCheckInterval: number | undefined; // Correct type for setInterval in RN

    const startLocationTracking = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationError('Permission to access location was denied.');
          return;
        }

        // Main loop to check services and manage the watcher
        serviceCheckInterval = setInterval(async () => {
          const servicesEnabled = await Location.hasServicesEnabledAsync();
          if (!servicesEnabled) {
            setLocationError('Location services are disabled. Please enable them.');
            // Stop watching if services are off
            if (locationSubscription) {
              locationSubscription.remove();
              locationSubscription = undefined;
            }
            return;
          }

          // If services are on but we have no watcher, create one.
          // This handles initial start and re-enabling services.
          if (!locationSubscription) {
            locationSubscription = await Location.watchPositionAsync(
              { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 1000, distanceInterval: 1 },
              (newLocation) => {
                setLocation(newLocation);
                const distance = getDistance(newLocation.coords.latitude, newLocation.coords.longitude, ALLOWED_LOCATION.latitude, ALLOWED_LOCATION.longitude);
                if (distance > MAX_DISTANCE) {
                  setLocationError(`You are too far from the business location. (Distance: ${Math.round(distance)}m)`);
                } else {
                  setLocationError(null); // Location and distance are OK!
                }
              }
            );
          }
        }, 1000); // Check every second

      } catch (error) {
        console.error("Location Setup Error:", error);
        setLocationError('Failed to initialize location services.');
      }
    };

    startLocationTracking();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
      if (serviceCheckInterval) {
        clearInterval(serviceCheckInterval);
      }
    };
  }, []);

  const checkLocation = () => {
    if (locationError) {
      Alert.alert('Location Issue', locationError);
      return false;
    }
    if (!location) {
      Alert.alert('Location Unavailable', 'Waiting for location data. Please ensure location services are enabled and try again shortly.');
      return false;
    }
    return true; // The useEffect hook already handles distance checks
  };

  const handleLogin = async () => {
    if (!checkLocation()) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('adminuser')
        .select('*')
        .eq('phone_number', phoneNumber)
        .single();

      if (error || !data || data.password !== password) {
        setToastMessage('Invalid phone number or password.');
        setToastType('error');
        return;
      }
      
      setToastMessage('Login successful!');
      setToastType('success');
      
      setTimeout(async () => {
        await AsyncStorage.setItem('paymart:adminLoggedIn', 'true');
        router.replace('/admin');
      }, 3000);

    } catch (err) {
      setToastMessage('An unexpected error occurred during login.');
      setToastType('error');
    }
  };

  const LocationStatus = () => {
    let icon: React.ComponentProps<typeof Ionicons>['name'] = 'location-sharp';
    let color = Colors.light.success;
    let text = 'Location OK';

    if (locationError) {
        icon = 'location-outline';
        color = Colors.light.danger;
        text = locationError;
    }

    return (
        <View style={[styles.locationStatus, { backgroundColor: color }]}>
            <Ionicons name={icon} size={16} color="#fff" />
            <Text style={styles.locationText}>{text}</Text>
        </View>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Ionicons name="shield-checkmark-outline" size={80} color={Colors.light.primary} />
            <Text style={styles.title}>Admin Access</Text>
            <Text style={styles.subtitle}>Sign in to manage Pay Mart</Text>
          </View>

          <LocationStatus />

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Ionicons name="call-outline" size={22} color={Colors.light.icon} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                autoCapitalize="none"
                maxLength={10}
                placeholderTextColor={Colors.light.icon}
              />
            </View>

            <View style={styles.inputGroup}>
              <Ionicons name="lock-closed-outline" size={22} color={Colors.light.icon} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor={Colors.light.icon}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color={Colors.light.icon} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.signInButton} onPress={handleLogin}>
              <Text style={styles.signInButtonText}>Login</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/login')}>
            <Ionicons name="arrow-back-outline" size={20} color={Colors.light.primary} />
            <Text style={styles.backButtonText}>Back to User Login</Text>
          </TouchableOpacity>
        </ScrollView>
        {!!toastMessage && (
          <View style={[styles.toast, toastType === 'success' ? styles.successToast : styles.errorToast]}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.icon,
    marginTop: 8,
  },
  formContainer: {
    width: '100%',
    marginTop: 20,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 55,
    fontSize: 16,
    color: Colors.light.text,
  },
  eyeIcon: {
    padding: 8,
  },
  signInButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginLeft: 8,
  },
  locationStatus: {
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 8,
    textAlign: 'center',
  },
  toast: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 15,
    borderRadius: 8,
  },
  successToast: {
    backgroundColor: '#4CAF50',
  },
  errorToast: {
    backgroundColor: '#F44336',
  },
  toastText: {
    color: 'white',
    textAlign: 'center',
  },
});
