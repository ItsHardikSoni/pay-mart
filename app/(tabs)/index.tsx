
import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Welcome back,</Text>
        <Text style={styles.subHeaderText}>Shopper 👋</Text>
      </View>

      <View style={styles.scanAndPayContainer}>
        <View style={styles.scanAndPayContent}>
          <Ionicons name="scan-circle-outline" size={24} color="white" />
          <View style={styles.scanAndPayTextContainer}>
            <Text style={styles.scanAndPayTitle}>Scan & Pay - Skip the Queue</Text>
            <Text style={styles.scanAndPaySubtitle}>Fast checkout, zero wait!</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardContainer}>
        <View style={styles.card}>
          <Ionicons name="cart-outline" size={32} color="#6c63ff" />
          <Text style={styles.cardText}>0</Text>
          <Text style={styles.cardSubText}>Items in Cart</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.rupeeIcon}>₹</Text>
          <Text style={styles.cardText}>₹0.00</Text>
          <Text style={styles.cardSubText}>Cart Amount</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.scanButton}>
        <Ionicons name="scan" size={24} color="white" />
        <Text style={styles.scanButtonText}>Scan Product</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.optionButton}>
        <Ionicons name="cart" size={24} color="#6c63ff" />
        <View>
          <Text style={styles.optionButtonText}>View Cart</Text>
          <Text style={styles.optionButtonSubText}>0 items • ₹0.00</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.optionButton}>
        <Ionicons name="search" size={24} color="#6c63ff" />
        <View>
          <Text style={styles.optionButtonText}>Search Products</Text>
          <Text style={styles.optionButtonSubText}>Browse and add manually</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.howItWorksContainer}>
        <Text style={styles.howItWorksTitle}>How it works</Text>
        <Text style={styles.howItWorksStep}>1. Scan product barcodes using your camera</Text>
        <Text style={styles.howItWorksStep}>2. Review items and proceed to checkout</Text>
        <Text style={styles.howItWorksStep}>3. Pay online or at counter - it's that simple!</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    backgroundColor: '#6c63ff',
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subHeaderText: {
    fontSize: 18,
    color: 'white',
  },
  scanAndPayContainer: {
    marginHorizontal: 20,
    marginTop: -20,
    backgroundColor: 'orange',
    borderRadius: 15,
    padding: 15,
  },
  scanAndPayContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scanAndPayTextContainer: {
    marginLeft: 10,
  },
  scanAndPayTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  scanAndPaySubtitle: {
    color: 'white',
    fontSize: 14,
  },
  cardContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    width: '40%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  cardText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  cardSubText: {
    fontSize: 14,
    color: 'gray',
  },
  rupeeIcon: {
    fontSize: 24,
    color: '#6c63ff',
  },
  scanButton: {
    backgroundColor: '#6c63ff',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    borderRadius: 15,
    marginHorizontal: 20,
    marginVertical: 10,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  optionButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 15,
    marginHorizontal: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  optionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  optionButtonSubText: {
    fontSize: 14,
    color: 'gray',
    marginLeft: 10,
  },
  howItWorksContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 20,
    marginVertical: 20,
  },
  howItWorksTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  howItWorksStep: {
    fontSize: 14,
    color: 'gray',
    marginBottom: 5,
  },
});
