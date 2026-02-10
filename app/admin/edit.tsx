
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Button,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../supabaseClient';
import { Colors } from '../../constants/theme';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

interface Product {
  id: number;
  name: string;
  mrp: number;
  stock: number;
  barcode?: string;
}

export default function EditProductScreen() {
  const router = useRouter();
  const { product: productString } = useLocalSearchParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [name, setName] = useState('');
  const [mrp, setMrp] = useState('');
  const [stock, setStock] = useState('');
  const [barcode, setBarcode] = useState('');
  const [isScannerVisible, setScannerVisible] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [sound, setSound] = useState<Audio.Sound>();
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (productString && typeof productString === 'string') {
      const productData = JSON.parse(productString);
      setProduct(productData);
      setName(productData.name);
      setMrp(productData.mrp.toString());
      setStock(productData.stock.toString());
      setBarcode(productData.barcode || '');
    } else {
      Alert.alert('Error', 'No product data found. Please go back and try again.');
      router.back();
    }
  }, [productString]);

  async function playSound() {
    const { sound } = await Audio.Sound.createAsync( require('../../assets/sounds/beep.mp3') );
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

  const handleBarCodeScanned = async ({ data }: BarcodeScanningResult) => {
    setScanned(true);
    setScannerVisible(false);
    setBarcode(data);
    await playSound();
  };

  const handleSaveChanges = async () => {
    if (!name || !mrp || !stock) {
      Alert.alert('Validation Error', 'Please fill all required fields.');
      return;
    }
    if (!product) return;

    const productData = {
      name,
      mrp: parseFloat(mrp),
      stock: parseInt(stock, 10),
      barcode: barcode || null,
    };

    try {
      const { error } = await supabase.from('products').update(productData).eq('id', product.id);
      if (error) throw error;

      Alert.alert('Success', 'Product updated successfully.', [
        { text: 'OK', onPress: () => router.push('/admin') }
      ]);
      
    } catch (e) {
      Alert.alert('Error', 'Failed to update product.');
    }
  };

  const handleScanPress = () => {
    if (permission?.granted) {
        const nextScannerState = !isScannerVisible;
        setScannerVisible(nextScannerState);
        setScanned(false);
        if(nextScannerState) {
            setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 200);
        }
    } else {
        requestPermission();
    }
  }

  if (!product) {
    return null; 
  }

  return (
    <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
    >
        <View style={styles.header}>
            <Text style={styles.headerTitle}>Edit Product</Text>
        </View>
        <ScrollView ref={scrollViewRef} contentContainerStyle={styles.scrollContent}>
            {!permission?.granted && !isScannerVisible ? (
                <View style={styles.permissionContainer}>
                    <Text style={styles.permissionText}>Camera permission is needed to scan barcodes.</Text>
                    <Button onPress={requestPermission} title="Grant Permission" color={Colors.light.primary} />
                </View>
            ) : null}

            <Text style={styles.label}>Product Name</Text>
            <TextInput style={styles.input} placeholder="Enter product name" value={name} onChangeText={setName} placeholderTextColor="#999" />
            
            <Text style={styles.label}>MRP</Text>
            <TextInput style={styles.input} placeholder="Enter MRP" value={mrp} onChangeText={setMrp} keyboardType="numeric" placeholderTextColor="#999" />

            <Text style={styles.label}>Stock</Text>
            <TextInput style={styles.input} placeholder="Enter stock quantity" value={stock} onChangeText={setStock} keyboardType="numeric" placeholderTextColor="#999" />

            <Text style={styles.label}>Barcode</Text>
            <View style={styles.barcodeContainer}>
                <TextInput style={styles.barcodeInput} placeholder="Scan or enter barcode" value={barcode} onChangeText={setBarcode} keyboardType="numeric" placeholderTextColor="#999" />
                <TouchableOpacity style={styles.scanButton} onPress={handleScanPress} disabled={!permission?.granted}>
                    <Ionicons name={isScannerVisible ? "close" : "scan-outline"} size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {isScannerVisible && permission.granted && (
                <View style={styles.scannerWrapper}>
                    <CameraView
                        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                        style={styles.scanner}
                        barcodeScannerSettings={{
                            barcodeTypes: ["codabar", "code39", "code93", "code128", "ean13", "ean8", "itf14", "upc_a", "upc_e"],
                        }}
                    />
                </View>
            )}

            <View style={styles.buttonContainer}>
                <Button title="Save Changes" onPress={handleSaveChanges} color={Colors.light.primary} />
            </View>
        </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: Colors.light.primary,
    padding: 24,
    paddingTop: 28,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  barcodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  barcodeInput: {
    flex: 1,
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  scanButton: {
    marginLeft: 8,
    backgroundColor: Colors.light.primary,
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
      marginTop: 20,
  },
  scannerWrapper: {
    height: 300,
    marginTop: 16,
    borderRadius: 8,
    overflow: 'hidden',
    borderColor: '#ddd',
    borderWidth: 1,
  },
  scanner: {
    flex: 1,
  },
  permissionContainer: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  permissionText: {
    color: '#664d03',
    marginBottom: 12,
    fontSize: 15,
  },
});
