
import React, { useEffect, useState, useRef } from 'react';
import {
  Alert,
  AppState,
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Tabs, useRouter, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { supabase } from '../../supabaseClient';

// --- Helper function to calculate distance ---
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

function AdminTabs() {
  const navigation = useNavigation();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.primary,
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Products',
          tabBarIcon: ({ color, size }) => <Ionicons name="list-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
          tabBarIcon: ({ color, size }) => <Ionicons name="add-circle-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="delete"
        options={{
          title: 'Delete',
          tabBarIcon: ({ color, size }) => <Ionicons name="trash-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="logout"
        options={{
          title: 'Logout',
          tabBarIcon: ({ color, size }) => <Ionicons name="log-out-outline" size={size} color={color} />,
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            navigation.goBack();
          },
        }}
      />
       <Tabs.Screen name="edit" options={{ href: null }} />
    </Tabs>
  );
}

export default function AdminLayout() {
  const router = useRouter();
  const navigation = useNavigation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const appState = useRef(AppState.currentState);

  // State for location settings
  const [allowedLatitude, setAllowedLatitude] = useState<number | null>(null);
  const [allowedLongitude, setAllowedLongitude] = useState<number | null>(null);
  const [maxDistance, setMaxDistance] = useState<number | null>(null);

  // New state to manage the loading/verification process
  const [isReady, setIsReady] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Initializing security checks...');

  // --- Automatic Security Logout Logic ---
  const handleSecurityLogout = async (reason: string) => {
    if (isLoggingOut) return;

    setIsReady(false); // Immediately hide the admin panel
    setStatusMessage(reason); // Show the reason for logout
    setIsLoggingOut(true);

    Alert.alert(
      'Security Logout',
      reason,
      [
        {
          text: 'OK',
          onPress: async () => {
            await AsyncStorage.removeItem('paymart:adminLoggedIn');
            router.replace('/admin-login');
          },
        },
      ],
      { cancelable: false }
    );
  };
  
  // --- Manual Logout Confirmation ---
  useEffect(() => {
    const backListener = navigation.addListener('beforeRemove', (e) => {
      if (isLoggingOut) return;
      e.preventDefault();
      Alert.alert(
        'Logout Confirmation',
        'Are you sure you want to log out from the admin panel?',
        [
          { text: "Cancel", style: 'cancel', onPress: () => {} },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: async () => {
              setIsLoggingOut(true);
              await AsyncStorage.removeItem('paymart:adminLoggedIn');
              navigation.dispatch(e.data.action);
            },
          },
        ]
      );
    });
    return () => navigation.removeListener('beforeRemove', backListener);
  }, [navigation, isLoggingOut]);

  // --- Settings Polling Effect ---
  useEffect(() => {
    if (isLoggingOut) return;
    setStatusMessage('Fetching security settings...');

    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase.from('admin_settings').select('latitude, longitude, max_distance').single();
        if (error || !data) throw new Error(error?.message || "Could not fetch settings.");
        setAllowedLatitude(data.latitude);
        setAllowedLongitude(data.longitude);
        setMaxDistance(data.max_distance);
        if (!isReady) setStatusMessage('Verifying your location...');
      } catch (error: any) {
        handleSecurityLogout(`Settings verification failed: ${error.message}`);
      }
    };

    fetchSettings();
    const intervalId = setInterval(fetchSettings, 1000);

    return () => clearInterval(intervalId);
  }, [isLoggingOut]);

  // --- Location and App State Monitoring ---
  useEffect(() => {
    if (isLoggingOut || !maxDistance) return;

    let locationSubscription: Location.LocationSubscription | undefined;
    let serviceCheckInterval: ReturnType<typeof setInterval> | undefined;

    const startMonitoring = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          handleSecurityLogout('Location permission is required for admin access.');
          return;
        }

        serviceCheckInterval = setInterval(async () => {
            const enabled = await Location.hasServicesEnabledAsync();
            if (!enabled) {
                if (locationSubscription) locationSubscription.remove();
                locationSubscription = undefined;
                handleSecurityLogout('Location services were disabled.');
            } else if (!locationSubscription) {
                locationSubscription = await Location.watchPositionAsync(
                    { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 1000, distanceInterval: 1 },
                    (newLocation) => {
                        const distance = getDistance(newLocation.coords.latitude, newLocation.coords.longitude, allowedLatitude!, allowedLongitude!);
                        if (distance > maxDistance!) {
                             if (isReady) setIsReady(false);
                             setStatusMessage(`You are outside the allowed area. Please move closer. (${Math.round(distance)}m away)`);
                        } else {
                            if (!isReady) {
                                setIsReady(true);
                            }
                        }
                    }
                );
            }
        }, 1000);
      } catch (error) {
        handleSecurityLogout('An unexpected error occurred with location services.');
      }
    };

    startMonitoring();
    
    const handleAppStateChange = async (nextAppState: any) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        const enabled = await Location.hasServicesEnabledAsync();
        if (!enabled) handleSecurityLogout('Location services were disabled while app was in background.');
      }
      appState.current = nextAppState;
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      if (locationSubscription) locationSubscription.remove();
      if (serviceCheckInterval) clearInterval(serviceCheckInterval);
      appStateSubscription.remove();
    };
  }, [isLoggingOut, allowedLatitude, allowedLongitude, maxDistance]);

  if (!isReady) {
    return (
      <View style={styles.statusContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.statusText}>
          {statusMessage}
        </Text>
      </View>
    );
  }

  return <AdminTabs />;
}

const styles = StyleSheet.create({
  statusContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  statusText: {
    marginTop: 20,
    fontSize: 16,
    color: Colors.light.text,
    textAlign: 'center',
  },
  tabBar: {
    backgroundColor: '#fff',
    height: 70,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});
