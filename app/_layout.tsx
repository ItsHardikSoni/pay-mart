
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React, { useState, useEffect } from 'react';
import SplashScreen from './splash';
import * as Location from 'expo-location';
import { Alert } from 'react-native';
import { SessionProvider } from '../context/SessionProvider';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isLoading, setIsLoading] = useState(true);
  const theme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 5000); // Splash screen timeout

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      (async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Denied',
            'Location permission is required to use the barcode scanner feature. Please enable it in your device settings.',
            [{ text: 'OK' }]
          );
        }
      })();
    }
  }, [isLoading]);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SessionProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <ThemeProvider value={theme}>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="scan" options={{ headerShown: false }} />
              <Stack.Screen name="account" options={{ headerShown: false }} />
              <Stack.Screen 
                name="search" 
                options={{ 
                  headerShown: false,
                }} 
              />
              <Stack.Screen name="help-and-support" options={{ headerShown: false }} />
              <Stack.Screen name="order-history" options={{ headerShown: false }} />
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="signup" options={{ headerShown: false }} />
              <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
              <Stack.Screen name="admin-login" options={{ headerShown: false }} />
              <Stack.Screen 
                name="admin" 
                options={{ 
                  headerShown: false,
                  gestureEnabled: false 
                }} 
              />
            </Stack>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          </ThemeProvider>
        </SafeAreaView>
      </SessionProvider>
    </GestureHandlerRootView>
  );
}
