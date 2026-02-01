
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, BarCodeScanningResult, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';

export default function ScanScreen() {
  const [showCamera, setShowCamera] = useState(false);
  const [barcode, setBarcode] = useState<string | null>(null);
  const [manualBarcode, setManualBarcode] = useState('');

  const insets = useSafeAreaInsets();
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [sound, setSound] = useState<Audio.Sound>();

  async function playSound() {
    // console.log('Loading Sound');
    const { sound } = await Audio.Sound.createAsync( require('../../assets/sounds/beep.mp3'));
    setSound(sound);

    // console.log('Playing Sound');
    await sound.playAsync();
  }

  useEffect(() => {
    return sound
      ? () => {
          // console.log('Unloading Sound');
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);


  const handleBarCodeScanned = ({ data }: BarCodeScanningResult) => {
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
    <View style={{ flex: 1, backgroundColor: '#f0f2f5' }}>
      <ScrollView
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
            onPress={() => {
              setScanned(false);
              setShowCamera(true);
            }}
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
              value={manualBarcode}
              onChangeText={setManualBarcode}
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
          />
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
