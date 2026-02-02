import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoBackground}>
            <Ionicons name="cart-outline" size={40} color="white" />
          </View>
          <Text style={styles.title}>Pay Mart</Text>
          <Text style={styles.subtitle}>Scan & Pay - Skip the queue</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.welcomeText}>Welcome Back</Text>
          <Text style={styles.signInText}>Sign in to continue shopping</Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.signInButton}>
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>

          <Link href="/signup" asChild>
            <TouchableOpacity>
              <Text style={styles.signUpText}>
                Don't have an account? <Text style={{fontWeight: 'bold', color: '#6c63ff'}}>Sign up</Text>
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoBackground: {
    backgroundColor: '#6c63ff',
    borderRadius: 50,
    padding: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  signInText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  signInButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  signInButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signUpText: {
    textAlign: 'center',
    color: '#666',
  },
  demoContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  demoText: {
    color: '#666',
    fontSize: 12,
  },
});
