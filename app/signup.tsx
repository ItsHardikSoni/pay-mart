import { FontAwesome, Ionicons } from '@expo/vector-icons';
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

export default function SignupScreen() {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullNameError, setFullNameError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
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
    setFullNameError('');
    setUsernameError('');
    setPhoneError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

    if (fullName.trim() === '') {
      setFullNameError('Full name is required');
      valid = false;
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
        setUsernameError('Username must contain only characters, digits, and underscores (_)');
        valid = false;
    }

    if (phoneNumber.length !== 10) {
      setPhoneError('Phone number must be 10 digits');
      valid = false;
    }

    if (!email.includes('@gmail.com')) {
      setEmailError('Email must be a valid @gmail.com address');
      valid = false;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      setPasswordError('Password must contain at least 1 digit, 1 special character, 1 uppercase and 1 lowercase letter');
      valid = false;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      valid = false;
    }

    return valid;
  };

  const handleSignUp = async () => {
    if (validate()) {
      try {
        // Check if username is already taken
        const { data: usernameData, error: usernameError } = await supabase
            .from('users')
            .select('username')
            .eq('username', username);

        if (usernameError) throw usernameError;
        if (usernameData && usernameData.length > 0) {
            setToastMessage('Username already taken');
            setToastType('error');
            return;
        }

        // Check if email or phone number already exists
        const { data: existingUsers, error: existingUserError } = await supabase
          .from('users')
          .select('email, phone_number')
          .or(`email.eq.${email},phone_number.eq.${phoneNumber}`);

        if (existingUserError) {
          throw existingUserError;
        }

        if (existingUsers && existingUsers.length > 0) {
          setToastMessage('User with this email or phone number already exists');
          setToastType('error');
          return;
        }

        // Insert new user
        const { data, error } = await supabase
          .from('users')
          .insert([
            {
              full_name: fullName,
              username: username,
              phone_number: phoneNumber,
              email: email,
              password: password,
            },
          ]);

        if (error) {
          throw error;
        }

        setToastMessage('Successfully registered!');
        setToastType('success');
        router.replace('/login');
      } catch (error) {
        setToastMessage(error.message || 'An error occurred during registration.');
        setToastType('error');
      }
    }
  };

  const handleGoogleSignUp = () => {
    // Handle Google sign-up logic here
    console.log('Signing up with Google...');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
          <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
                <Ionicons name="person-add-outline" size={80} color={Colors.light.primary} />
                <Text style={styles.title}>Create an Account</Text>
                <Text style={styles.subtitle}>Start your journey with Pay Mart</Text>
            </View>

            <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                    <Ionicons name="person-outline" size={22} color={Colors.light.icon} style={styles.inputIcon} />
                    <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    value={fullName}
                    onChangeText={setFullName}
                    placeholderTextColor={Colors.light.icon}
                    />
                </View>
                {!!fullNameError && <Text style={styles.errorText}>{fullNameError}</Text>}

                <View style={styles.inputGroup}>
                    <Ionicons name="at-outline" size={22} color={Colors.light.icon} style={styles.inputIcon} />
                    <TextInput
                    style={styles.input}
                    placeholder="Username"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    placeholderTextColor={Colors.light.icon}
                    />
                </View>
                {!!usernameError && <Text style={styles.errorText}>{usernameError}</Text>}

                <View style={styles.inputGroup}>
                    <Ionicons name="call-outline" size={22} color={Colors.light.icon} style={styles.inputIcon} />
                    <TextInput
                    style={styles.input}
                    placeholder="Phone Number"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    maxLength={10}
                    placeholderTextColor={Colors.light.icon}
                    />
                </View>
                {!!phoneError && <Text style={styles.errorText}>{phoneError}</Text>}

                <View style={styles.inputGroup}>
                    <Ionicons name="mail-outline" size={22} color={Colors.light.icon} style={styles.inputIcon} />
                    <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor={Colors.light.icon}
                    />
                </View>
                {!!emailError && <Text style={styles.errorText}>{emailError}</Text>}

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

                <View style={styles.inputGroup}>
                    <Ionicons name="lock-closed-outline" size={22} color={Colors.light.icon} style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showConfirmPassword}
                        placeholderTextColor={Colors.light.icon}
                    />
                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                        <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color={Colors.light.icon} />
                    </TouchableOpacity>
                </View>
                {!!confirmPasswordError && <Text style={styles.errorText}>{confirmPasswordError}</Text>}

                <TouchableOpacity style={styles.signInButton} onPress={handleSignUp}>
                    <Text style={styles.signInButtonText}>Sign Up</Text>
                </TouchableOpacity>

                <Text style={styles.orText}>or continue with</Text>

                <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignUp}>
                    <FontAwesome name="google" size={20} color="#DB4437" />
                    <Text style={styles.googleButtonText}>Sign Up with Google</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <Link href="/login" asChild>
                    <TouchableOpacity>
                        <Text style={styles.signInLink}>Sign in</Text>
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
    marginTop: 20,
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
  signInLink: {
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
