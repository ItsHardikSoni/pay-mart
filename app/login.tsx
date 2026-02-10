
import { FontAwesome, Ionicons } from '@expo/vector-icons';
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
import { useSession } from '../context/SessionProvider';

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

  const validate = () => {
    let valid = true;
    setIdentifierError('');
    setPasswordError('');

    if (!loginIdentifier) {
      setIdentifierError('This field is required');
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
      await login(data.username, data.full_name);
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
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
                <Ionicons name="storefront-outline" size={80} color={Colors.light.primary} />
                <Text style={styles.title}>Welcome Back!</Text>
                <Text style={styles.subtitle}>Sign in to your Pay Mart account</Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Ionicons name="person-outline" size={22} color={Colors.light.icon} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Username, Email, or Phone"
                  value={loginIdentifier}
                  onChangeText={setLoginIdentifier}
                  autoCapitalize="none"
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
              
              <TouchableOpacity style={styles.forgotPasswordButton}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
                <Text style={styles.signInButtonText}>Login</Text>
              </TouchableOpacity>

              <Text style={styles.orText}>or continue with</Text>

              <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn}>
                <FontAwesome name="google" size={20} color="#DB4437" />
                <Text style={styles.googleButtonText}>Sign In with Google</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <Link href="/signup" asChild>
                  <TouchableOpacity>
                    <Text style={styles.signUpLink}>Sign up</Text>
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
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginTop: 12,
  },
  forgotPasswordText: {
    color: Colors.light.primary,
    fontSize: 14,
    fontWeight: '500',
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
  orText: {
      textAlign: 'center',
      marginVertical: 24,
      color: Colors.light.icon,
      fontSize: 14,
  },
  googleButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  googleButtonText: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 30,
  },
  footerText: {
      fontSize: 14,
      color: Colors.light.icon,
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
