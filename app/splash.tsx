
import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import LottieView from 'lottie-react-native';

export default function SplashScreen() {

  return (
    <View style={styles.container}>
        <LottieView
            source={require('../assets/lottie/scanner0.5.json')}
            autoPlay
            loop
            style={styles.lottie}
        />
        <View style={styles.textContainer}>
            <Text style={styles.appName}>Pay Mart</Text>
            <Text style={styles.tagline}>Scan & Pay - Skip the Queue</Text>
            <Text style={styles.subTagline}>Fast checkout, zero wait!</Text>
        </View>
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
  lottie: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 20,
    borderRadius: 10,
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
