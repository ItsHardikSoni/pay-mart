
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
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
  Alert
} from 'react-native';
import { Colors } from '../constants/theme';
import { supabase } from '../supabaseClient';

export default function ForgotPasswordScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [fullNameError, setFullNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneNumberError, setPhoneNumberError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const [isVerified, setIsVerified] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  const validateVerification = () => {
    let valid = true;
    setFullNameError('');
    setEmailError('');
    setPhoneNumberError('');

    if (!fullName) {
      setFullNameError('Full name is required');
      valid = false;
    }
    if (!email) {
      setEmailError('Email is required');
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
        setEmailError('Invalid email address');
        valid = false;
    }
    if (!phoneNumber) {
      setPhoneNumberError('Phone number is required');
      valid = false;
    }
    return valid;
  };

  const handleVerifyDetails = async () => {
    if (!validateVerification()) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('full_name', fullName)
        .eq('email', email)
        .eq('phone_number', phoneNumber)
        .single();

      if (error || !data) {
        setToastMessage('User details do not match any account.');
        setToastType('error');
        return;
      }

      setUserId(data.id);
      setIsVerified(true);
      setToastMessage('Verification successful. You can now reset your password.');
      setToastType('success');

    } catch (error: any) {
      setToastMessage(error.message || 'An unexpected error occurred.');
      setToastType('error');
    }
  };

  const validatePasswordReset = () => {
    let valid = true;
    setPasswordError('');
    setConfirmPasswordError('');

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!password) {
      setPasswordError('Password is required');
      valid = false;
    } else if (!passwordRegex.test(password)) {
      setPasswordError('Password must be 8+ characters with a digit, special character, uppercase and lowercase letter.');
      valid = false;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      valid = false;
    }
    return valid;
  };

  const handleResetPassword = async () => {
    if (!validatePasswordReset() || !userId) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ password })
        .eq('id', userId);

      if (error) throw error;

      Alert.alert(
        'Success',
        'Your password has been reset successfully. Please log in with your new password.',
        [{ text: 'OK', onPress: () => router.replace('/login') }]
      );

    } catch (error: any) {
      setToastMessage(error.message || 'Failed to reset password.');
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
            <Ionicons name="key-outline" size={80} color={Colors.light.primary} />
            <Text style={styles.title}>Forgot Password</Text>
            <Text style={styles.subtitle}>
              {isVerified ? 'Enter your new password below' : 'Verify your account details to proceed'}
            </Text>
          </View>

          <View style={styles.formContainer}>
            {!isVerified ? (
              <>
                <View style={styles.inputGroup}>
                  <Ionicons name="person-circle-outline" size={22} color={Colors.light.icon} style={styles.inputIcon} />
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
                  <Ionicons name="mail-outline" size={22} color={Colors.light.icon} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email Address"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor={Colors.light.icon}
                  />
                </View>
                {!!emailError && <Text style={styles.errorText}>{emailError}</Text>}

                <View style={styles.inputGroup}>
                  <Ionicons name="call-outline" size={22} color={Colors.light.icon} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Phone Number"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    placeholderTextColor={Colors.light.icon}
                  />
                </View>
                {!!phoneNumberError && <Text style={styles.errorText}>{phoneNumberError}</Text>}

                <TouchableOpacity style={styles.primaryButton} onPress={handleVerifyDetails}>
                  <Text style={styles.primaryButtonText}>Verify Account</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.inputGroup}>
                  <Ionicons name="lock-closed-outline" size={22} color={Colors.light.icon} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="New Password"
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
                    placeholder="Confirm New Password"
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

                <TouchableOpacity style={styles.primaryButton} onPress={handleResetPassword}>
                  <Text style={styles.primaryButtonText}>Reset Password</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>Remembered your password? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.linkText}>Go Back</Text>
            </TouchableOpacity>
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
      textAlign: 'center',
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
    primaryButton: {
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
    primaryButtonText: {
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
    footerText: {
        fontSize: 14,
        color: Colors.light.icon,
    },
    linkText: {
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
      zIndex: 10,
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
