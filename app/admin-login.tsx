
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors } from '../constants/theme';
import { supabase } from '../supabaseClient';

export default function AdminLoginScreen() {
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [identifierError, setIdentifierError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const router = useRouter();

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const validate = () => {
    let valid = true;
    setIdentifierError('');
    setPasswordError('');

    if (!loginIdentifier) {
      setIdentifierError('This field is required');
      valid = false;
    } else if (!/^\d{10}$/.test(loginIdentifier)) {
      setIdentifierError('Phone number must be 10 digits');
      valid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      valid = false;
    } else {
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasDigit = /\d/.test(password);
      const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
      if (!hasUpperCase || !hasLowerCase || !hasDigit || !hasSpecialChar) {
        setPasswordError('Password must contain an uppercase letter, a lowercase letter, a digit, and a special character.');
        valid = false;
      }
    }

    return valid;
  }

  const handleSignIn = async () => {
    if (!validate()) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('adminuser')
        .select('*')
        .eq('phone_number', loginIdentifier)
        .single();

      if (error || !data) {
        setToastMessage('Invalid credentials');
        setToastType('error');
        return;
      }

      if (data.password !== password) {
        setToastMessage('Invalid credentials');
        setToastType('error');
        return;
      }

      setToastMessage('Login successful!');
      setToastType('success');
      await AsyncStorage.setItem('paymart:adminLoggedIn', 'true');
      router.replace('/admin');

    } catch (error) {
      setToastMessage(error.message || 'An unexpected error occurred.');
      setToastType('error');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
                <Ionicons name="shield-checkmark-outline" size={80} color={Colors.light.primary} />
                <Text style={styles.title}>Admin Login</Text>
                <Text style={styles.subtitle}>Sign in to the admin panel</Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Ionicons name="call-outline" size={22} color={Colors.light.icon} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Phone Number"
                  value={loginIdentifier}
                  onChangeText={setLoginIdentifier}
                  autoCapitalize="none"
                  keyboardType="phone-pad"
                  placeholderTextColor={Colors.light.icon}
                />
              </View>
              {!!identifierError && <Text style={styles.errorText}>{identifierError}</Text>}

              <View style={styles.inputGroup}>
                <Ionicons name="lock-closed-outline" size={22} color={Colors.light.icon} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholderTextColor={Colors.light.icon}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color={Colors.light.icon} />
                </TouchableOpacity>
              </View>
              {!!passwordError && <Text style={styles.errorText}>{passwordError}</Text>}

              <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
                <Text style={styles.signInButtonText}>Login</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.footer}>
              <Link href="/login" asChild>
                  <TouchableOpacity>
                    <Text style={styles.signUpLink}>Back to User Login</Text>
                  </TouchableOpacity>
              </Link>
            </View>
        </ScrollView>

        {!!toastMessage && (
          <View style={[styles.toast, toastType === 'success' ? styles.successToast : styles.errorToast]}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.icon,
    marginTop: 8,
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 55,
    fontSize: 16,
    color: Colors.light.text,
  },
  eyeIcon: {
      padding: 8,
  },
  signInButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 30,
  },
  signUpLink: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  toast: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 15,
    borderRadius: 8,
  },
  successToast: {
    backgroundColor: '#4CAF50',
  },
  errorToast: {
    backgroundColor: '#F44336',
  },
  toastText: {
    color: 'white',
    textAlign: 'center',
  },
  errorText: {
    color: Colors.danger,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 12,
  },
});
