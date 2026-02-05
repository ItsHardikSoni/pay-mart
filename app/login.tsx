import { FontAwesome, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { supabase } from '../supabaseClient';
import { useSession } from './context/SessionProvider';

export default function LoginScreen() {
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [identifierError, setIdentifierError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const router = useRouter();
  const { isLoggedIn, isLoading, login } = useSession();
  const animation = useRef(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  useEffect(() => {
    if (!isLoading && isLoggedIn) {
      router.replace('/(tabs)');
    }
  }, [isLoading, isLoggedIn, router]);

  useEffect(() => {
    animation.current?.play();
  }, []);

  const validate = () => {
    let valid = true;
    setIdentifierError('');
    setPasswordError('');

    if (!loginIdentifier) {
      setIdentifierError('Phone/Email/Username is required');
      valid = false;
    }
    if (!password) {
      setPasswordError('Password is required');
      valid = false;
    }
    return valid;
  }

  const handleSignIn = async () => {
    if (!validate()) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`phone_number.eq.${loginIdentifier},email.eq.${loginIdentifier},username.eq.${loginIdentifier}`)
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
      await AsyncStorage.setItem('paymart:loginIdentifier', loginIdentifier);
      await login();
      router.replace('/(tabs)');

    } catch (error) {
      setToastMessage(error.message || 'An unexpected error occurred.');
      setToastType('error');
    }
  };

  const handleGoogleSignIn = () => {
    console.log('Signing in with Google...');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.logoContainer}>
            <LottieView
              ref={animation}
              source={require('../assets/lottie/Profile_Icon.json')}
              autoPlay={false}
              loop={false}
              style={styles.lottie}
            />
          <Text style={styles.title}>Pay Mart</Text>
          <Text style={styles.subtitle}>Scan & Pay - Skip the queue</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.welcomeText}>Welcome Back</Text>
          <Text style={styles.signInText}>Sign in to continue shopping</Text>

          <Text style={styles.label}>Phone/Email/Username <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your Phone/Email/Username"
            value={loginIdentifier}
            onChangeText={setLoginIdentifier}
            autoCapitalize="none"
          />
          {!!identifierError && <Text style={styles.errorText}>{identifierError}</Text>}


          <Text style={styles.label}>Password <Text style={styles.required}>*</Text></Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={24} color="#666" />
            </TouchableOpacity>
          </View>
          {!!passwordError && <Text style={styles.errorText}>{passwordError}</Text>}


          <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn}>
            <FontAwesome name="google" size={20} color="white" />
            <Text style={styles.googleButtonText}>Sign In with Google</Text>
          </TouchableOpacity>

          <Link href="/signup" asChild>
            <TouchableOpacity>
              <Text style={styles.signUpText}>
                Don't have an account? <Text style={{fontWeight: 'bold', color: '#6c63ff'}}>Sign up
                </Text>
              </Text>
            </TouchableOpacity>
          </Link>
        </View>

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
  lottie: {
    width: 150,
    height: 150,
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
  required: {
    color: 'red',
  },
  input: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 15,
    marginBottom: 5,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingRight: 15,
    marginBottom: 5,
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
  },
  signInButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 10,
  },
  signInButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  googleButton: {
    backgroundColor: '#4285F4',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  googleButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  signUpText: {
    textAlign: 'center',
    color: '#666',
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
    color: 'red',
    fontSize: 12,
    marginBottom: 10,
  },
});
