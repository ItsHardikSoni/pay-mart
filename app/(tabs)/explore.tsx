
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Camera, BarCodeScannedEvent } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = ({ type, data }: BarCodeScannedEvent) => {
    setScanned(true);
    Alert.alert(`Bar code with type ${type} and data ${data} has been scanned!`);
  };

  if (hasPermission === null) {
    return <Text>Requesting for camera permission</Text>;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={{flex: 1, backgroundColor: '#f0f2f5'}}>
        <ScrollView 
            style={styles.container}
            contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
        >
            <View style={styles.header}>
                <TouchableOpacity>
                    <Ionicons name="close" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Scan Product</Text>
        </View>
        <View style={styles.scanContainer}>
            <Ionicons name="camera-outline" size={80} color="#6c63ff" />
            <Text style={styles.readyToScanText}>Ready to Scan</Text>
            <Text style={styles.promptText}>Point your camera at the product barcode</Text>
            <TouchableOpacity style={styles.startButton}>
            <Ionicons name="camera" size={20} color="white" />
            <Text style={styles.startButtonText}>Start Camera</Text>
            </TouchableOpacity>
        </View>

        <View style={styles.manualContainer}>
            <Text style={styles.manualEntryTitle}>Manual Barcode Entry</Text>
            <View style={styles.inputContainer}>
            <TextInput
                style={styles.input}
                placeholder="Enter barcode number"
            />
            <TouchableOpacity style={styles.searchButton}>
                <Ionicons name="search" size={24} color="white" />
            </TouchableOpacity>
            </View>
            <Text style={styles.inputCaption}>Use this if the barcode is damaged or unreadable</Text>
        </View>
        </ScrollView>
    </View>
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
});
