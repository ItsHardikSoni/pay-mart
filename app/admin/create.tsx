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
import { useRouter } from 'expo-router';
import { supabase } from '../../supabaseClient';
import { Colors } from '../../constants/theme';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

export default function CreateProductScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [mrp, setMrp] = useState('');
  const [stock, setStock] = useState('');
  const [barcode, setBarcode] = useState('');
  const [isScannerVisible, setScannerVisible] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [sound, setSound] = useState<Audio.Sound>();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

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

  useEffect(() => {
    if (name.length > 2) {
      const handler = setTimeout(async () => {
        const { data } = await supabase
          .from('products')
          .select('name')
          .ilike('name', `%${name}%`)
          .limit(5);
        setSuggestions(data || []);
      }, 500);

      return () => clearTimeout(handler);
    } else {
      setSuggestions([]);
    }
  }, [name]);

  const handleBarCodeScanned = async ({ data }: BarcodeScanningResult) => {
    setScanned(true);
    setScannerVisible(false);
    setBarcode(data);
    await playSound();
  };

  const handleSaveProduct = async () => {
    if (!name || !mrp || !stock || !barcode) {
      Alert.alert('Validation Error', 'Please fill all required fields.');
      return;
    }

    const { data: existingProduct, error: fetchError } = await supabase
        .from('products')
        .select('id')
        .eq('barcode', barcode)
        .single();

    if (existingProduct) {
        Alert.alert('Duplicate Product', 'A product with this barcode already exists.');
        return;
    }

    const productData = {
      name,
      mrp: parseFloat(mrp),
      stock: parseInt(stock, 10),
      barcode: barcode,
    };

    try {
      const { error } = await supabase.from('products').insert([productData]);
      if (error) throw error;

      setToastMessage('Product created successfully.');
      setName('');
      setMrp('');
      setStock('');
      setBarcode('');
      setTimeout(() => {
          setToastMessage(null);
      }, 3000);

    } catch (e) {
      Alert.alert('Error', 'Failed to save product.');
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

  if (!permission) {
    return <View />;
  }

  return (
    <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
    >
        <View style={styles.header}>
            <Text style={styles.headerTitle}>Add New Product</Text>
        </View>
        <ScrollView ref={scrollViewRef} contentContainerStyle={styles.scrollContent}>
            
            {!permission.granted && !isScannerVisible ? (
                <View style={styles.permissionContainer}>
                    <Text style={styles.permissionText}>Camera permission is needed to scan barcodes.</Text>
                    <Button onPress={requestPermission} title="Grant Permission" color={Colors.light.primary} />
                </View>
            ) : null}

            <Text style={styles.label}>Product Name <Text style={styles.requiredMarker}>*</Text></Text>
            <TextInput style={styles.input} placeholder="Enter product name" value={name} onChangeText={setName} placeholderTextColor="#999" />
            {suggestions.length > 0 && (
              <View style={styles.suggestionContainer}>
                {suggestions.map((s) => (
                  <TouchableOpacity key={s.name} style={styles.suggestionItem} onPress={() => { setName(s.name); setSuggestions([]); }}>
                      <Text>{s.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.label}>MRP <Text style={styles.requiredMarker}>*</Text></Text>
            <TextInput style={styles.input} placeholder="Enter MRP" value={mrp} onChangeText={setMrp} keyboardType="numeric" placeholderTextColor="#999" />

            <Text style={styles.label}>Stock <Text style={styles.requiredMarker}>*</Text></Text>
            <TextInput style={styles.input} placeholder="Enter stock quantity" value={stock} onChangeText={setStock} keyboardType="numeric" placeholderTextColor="#999" />

            <Text style={styles.label}>Barcode <Text style={styles.requiredMarker}>*</Text></Text>
            <View style={styles.barcodeContainer}>
                <TextInput style={styles.barcodeInput} placeholder="Scan or enter barcode" value={barcode} onChangeText={setBarcode} keyboardType="numeric" placeholderTextColor="#999" />
                <TouchableOpacity style={styles.scanButton} onPress={handleScanPress} disabled={!permission.granted}>
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
                <Button title="Save Product" onPress={handleSaveProduct} color={Colors.light.primary} />
            </View>
        </ScrollView>
        {toastMessage && (
            <View style={styles.toastContainer}>
                <Text style={styles.toastText}>{toastMessage}</Text>
            </View>
        )}
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
  requiredMarker: {
    color: 'red',
    fontSize: 16,
  },
  toastContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 32,
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: 'center'
  },
  toastText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500'
  },
  suggestionContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginTop: -10,
    marginBottom: 10,
    borderColor: '#ddd',
    borderWidth: 1,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});