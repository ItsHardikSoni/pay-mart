
import React, { useEffect, useState, useRef } from 'react';
import {
  Alert,
  AppState,
} from 'react-native';
import { Tabs, useRouter, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

// --- Location Configuration ---
const ALLOWED_LOCATION = {
  latitude: 25.610465587079343, // Griham Hostel
  longitude: 85.05561450520987,
};
const MAX_DISTANCE = 100; // in meters

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

export default function AdminLayout() {
  const router = useRouter();
  const navigation = useNavigation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const appState = useRef(AppState.currentState);

  // --- SINGLE SOURCE OF TRUTH FOR LOGOUT CONFIRMATION ---
  useEffect(() => {
    const backListener = navigation.addListener('beforeRemove', (e) => {
      // If we are already logging out, just let the navigation happen.
      if (isLoggingOut) {
        return;
      }
      // Otherwise, prevent the default action and show the confirmation alert.
      e.preventDefault();
      Alert.alert(
        'Logout Confirmation',
        'Are you sure you want to log out from the admin panel?',
        [
          { text: "Cancel", style: 'cancel', onPress: () => {} },
          {
            text: 'Logout',
            style: 'destructive',
            // If the user confirms, set the flag and re-dispatch the navigation action.
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


  // --- Automatic Security Logout Logic ---
  const handleSecurityLogout = async (reason: string) => {
    if (isLoggingOut) return;
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

  // --- Location and App State Monitoring ---
  useEffect(() => {
    if (isLoggingOut) return;

    let locationSubscription: Location.LocationSubscription | undefined;
    let serviceCheckInterval: number | undefined;

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
                handleSecurityLogout('Location services were disabled.');
                if (locationSubscription) {
                    locationSubscription.remove();
                    locationSubscription = undefined;
                }
            } else if (!locationSubscription) {
                locationSubscription = await Location.watchPositionAsync(
                    { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 1, distanceInterval: 1 },
                    (newLocation) => {
                        const distance = getDistance(newLocation.coords.latitude, newLocation.coords.longitude, ALLOWED_LOCATION.latitude, ALLOWED_LOCATION.longitude);
                        if (distance > MAX_DISTANCE) {
                            handleSecurityLogout(`You have moved out of the allowed range (Distance: ${Math.round(distance)}m).`);
                        }
                    }
                );
            }
        }, 1000);

      } catch (error) {
        console.error("Location Monitoring Error:", error);
        handleSecurityLogout('An unexpected error occurred with location services.');
      }
    };

    startMonitoring();
    
    const handleAppStateChange = async (nextAppState: any) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        const enabled = await Location.hasServicesEnabledAsync();
        if (!enabled) {
          handleSecurityLogout('Location services were disabled upon returning to the app.');
        }
      }
      appState.current = nextAppState;
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      if (locationSubscription) locationSubscription.remove();
      if (serviceCheckInterval) clearInterval(serviceCheckInterval);
      appStateSubscription.remove();
    };
  }, [isLoggingOut]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.primary,
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#fff',
          height: 70,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
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
            // Prevent the default tab action
            e.preventDefault();
            // This triggers the 'beforeRemove' listener, showing the single confirmation dialog
            navigation.goBack();
          },
        }}
      />
       <Tabs.Screen name="edit" options={{ href: null }} />
    </Tabs>
  );
}
