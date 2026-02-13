
import NoInternetModal from '@/components/NoInternetModal';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as Location from 'expo-location';
import { Stack } from 'expo-router';
import { usePreventScreenCapture } from 'expo-screen-capture';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SessionProvider } from '../context/SessionProvider';
import SplashScreen from './splash';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  usePreventScreenCapture(); // protect from screen capture
  const colorScheme = useColorScheme();
  const [isLoading, setIsLoading] = useState(true);
  const theme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000); // Splash screen timeout

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
      <NoInternetModal />
      <SessionProvider> 
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <ThemeProvider value={theme}>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="scan" options={{ headerShown: false }} />
              <Stack.Screen name="account" options={{ headerShown: false }} />
              <Stack.Screen name="search" options={{ headerShown: false }} />
              <Stack.Screen name="help-and-support" options={{ headerShown: false }} />
              <Stack.Screen name="order-history" options={{ headerShown: false }} />
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="signup" options={{ headerShown: false }} />
              <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
              <Stack.Screen name="e-invoice" options={{ headerShown: false }} />
              <Stack.Screen name="admin-login" options={{ headerShown: false }} />
              <Stack.Screen name="admin" options={{ headerShown: false, gestureEnabled: false }} />
            </Stack>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          </ThemeProvider>
        </SafeAreaView>
      </SessionProvider>
    </GestureHandlerRootView>
  );
}
