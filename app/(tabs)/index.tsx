
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useSession } from '../../context/SessionProvider';
import { Colors } from '../../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../supabaseClient';
import { HelloWave } from '../../components/hello-wave';

const QuickAction = ({ icon, label, screen }) => (
  <Link href={screen} asChild>
    <TouchableOpacity style={styles.quickAction}>
      <Ionicons name={icon} size={30} color={Colors.light.primary} />
      <Text style={styles.quickActionText}>{label}</Text>
    </TouchableOpacity>
  </Link>
);

const HowItWorksStep = ({ icon, title, description }) => (
    <View style={styles.stepContainer}>
        <Ionicons name={icon} size={40} color={Colors.light.primary} style={styles.stepIcon} />
        <View style={styles.stepTextContainer}>
            <Text style={styles.stepTitle}>{title}</Text>
            <Text style={styles.stepDescription}>{description}</Text>
        </View>
    </View>
);

export default function HomeScreen() {
  const { isLoggedIn } = useSession();
  const [fullName, setFullName] = useState('Shopper');

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const identifier = await AsyncStorage.getItem('paymart:loginIdentifier');
        if (!identifier) return;

        const { data, error } = await supabase
          .from('users')
          .select('full_name')
          .or(`phone_number.eq.${identifier},email.eq.${identifier},username.eq.${identifier}`)
          .single();

        if (error) {
          console.error('Error fetching user name:', error);
          return;
        }

        if (data?.full_name) {
          setFullName(data.full_name);
        }
      } catch (e) {
        console.error('Error loading user name:', e);
      }
    };

    if (isLoggedIn) {
        fetchUserName();
    }
  }, [isLoggedIn]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome back,</Text>
        <View style={styles.userNameContainer}>
            <Text style={styles.userName}>{fullName}</Text>
            <HelloWave />
        </View>
      </View>

      <View style={styles.promoBanner}>
        <Text style={styles.promoText}>New! Try our Scan & Go service.</Text>
        <Text style={styles.promoSubText}>Skip the checkout line and save time.</Text>
      </View>

      <View style={styles.quickActionsContainer}>
        <Text style={styles.quickActionsTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <QuickAction icon="scan-outline" label="Scan" screen="/scan" />
          <QuickAction icon="search-outline" label="Search" screen="/search" />
          <QuickAction icon="receipt-outline" label="Orders" screen="/order-history" />
          <QuickAction icon="person-outline" label="Account" screen="/account" />
        </View>
      </View>

      <View style={styles.howItWorksContainer}>
        <Text style={styles.howItWorksTitle}>How It Works</Text>
        <HowItWorksStep
            icon="scan-circle-outline"
            title="Scan & Add to Cart"
            description="Use your phone&apos;s camera to scan product barcodes. Items are instantly added to your digital cart."
        />
        <HowItWorksStep
            icon="cart-outline"
            title="Review & Edit Your Cart"
            description="Easily view your cart, adjust quantities, or remove items before you finalize your purchase."
        />
        <HowItWorksStep
            icon="card-outline"
            title="Seamless Checkout"
            description="Choose to pay securely online with a card or UPI. Or, pay at the counter—your choice!"
        />
        <HowItWorksStep
            icon="receipt-outline"
            title="E-Receipt & History"
            description="After payment, receive a digital receipt instantly. Access all past orders anytime in your account."
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  userNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  promoBanner: {
    backgroundColor: Colors.light.secondary,
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 20,
    alignItems: 'center',
  },
  promoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  promoSubText: {
    fontSize: 14,
    color: '#333',
    marginTop: 5,
  },
  quickActionsContainer: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  quickActionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAction: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    width: '48%',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  quickActionText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  howItWorksContainer: {
      backgroundColor: 'white',
      borderRadius: 15,
      padding: 20,
      marginHorizontal: 20,
      marginVertical: 20,
  },
  howItWorksTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 20,
      textAlign: 'center',
  },
  stepContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
  },
  stepIcon: {
      marginRight: 15,
  },
  stepTextContainer: {
      flex: 1,
  },
  stepTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#333',
  },
  stepDescription: {
      fontSize: 14,
      color: 'gray',
      marginTop: 4,
  },
});
