
import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Ionicons name="scan-circle-outline" size={100} color="#6c63ff" />
        <Text style={styles.appName}>Pay Mart</Text>
        <Text style={styles.tagline}>Scan & Pay - Skip the Queue</Text>
        <Text style={styles.subTagline}>Fast checkout, zero wait!</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  content: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#6c63ff',
    marginTop: 20,
  },
  tagline: {
    fontSize: 22,
    color: '#333',
    marginTop: 10,
  },
  subTagline: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
});
