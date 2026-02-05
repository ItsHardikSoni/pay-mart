import { FontAwesome, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Link, useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
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
  const [image, setImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const router = useRouter();
  const animation = useRef(null);

  useEffect(() => {
    animation.current?.play();
  }, []);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleImagePress = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setToastMessage('Permission to access gallery is required');
      setToastType('error');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadProfileImage = async (): Promise<string | null> => {
    if (!image) return null;

    try {
      setUploadingImage(true);

      const fileExt = image.split('.').pop() || 'jpg';
      const baseId = username || phoneNumber || email || 'user';
      const fileName = `${baseId}-${Date.now()}.${fileExt}`;
      const filePath = `profile-images/${fileName}`;

      // React Native upload: use file object with uri
      const file = {
        uri: image,
        name: fileName,
        type: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
      } as any;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error('Error uploading signup image:', uploadError);
        setToastMessage('Could not upload profile image');
        setToastType('error');
        return null;
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (err) {
      console.error('Unexpected error uploading signup image:', err);
      setToastMessage('Unexpected error while uploading image');
      setToastType('error');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

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

        // Upload profile image if selected
        let profileImageUrl: string | null = null;
        if (image) {
          profileImageUrl = await uploadProfileImage();
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
              profile_image: profileImageUrl,
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
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <LottieView
              ref={animation}
              source={require('../assets/lottie/Profile_Icon.json')}
              autoPlay={false}
              loop={false}
              style={styles.lottie}
            />
            <Text style={styles.title}>Smart Scan & Pay</Text>
            <Text style={styles.subtitle}>Skip the queue, shop smart</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.welcomeText}>Create Account</Text>
            <Text style={styles.signInText}>Sign up to start shopping</Text>
            <View style={styles.profileImageWrapper}>
              <TouchableOpacity onPress={handleImagePress} style={styles.profileImageContainer}>
                {image ? (
                  <Image source={{ uri: image }} style={styles.profileImage} />
                ) : (
                  <Ionicons name="person-circle-outline" size={80} color="#6c63ff" />
                )}
                <View style={styles.editIconContainer}>
                  <Ionicons name="create-outline" size={16} color="#6c63ff" />
                </View>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Full Name <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              value={fullName}
              onChangeText={setFullName}
            />
            {!!fullNameError && <Text style={styles.errorText}>{fullNameError}</Text>}

            <Text style={styles.label}>Username <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="Choose a username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
            {!!usernameError && <Text style={styles.errorText}>{usernameError}</Text>}

            <Text style={styles.label}>Phone Number <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your phone"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              maxLength={10}
            />
            {!!phoneError && <Text style={styles.errorText}>{phoneError}</Text>}

            <Text style={styles.label}>Email <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {!!emailError && <Text style={styles.errorText}>{emailError}</Text>}

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

            <Text style={styles.label}>Confirm Password <Text style={styles.required}>*</Text></Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={24} color="#666" />
              </TouchableOpacity>
            </View>
            {!!confirmPasswordError && <Text style={styles.errorText}>{confirmPasswordError}</Text>}

            <TouchableOpacity style={styles.signInButton} onPress={handleSignUp}>
              <Text style={styles.signInButtonText}>Sign Up</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignUp}>
              <FontAwesome name="google" size={20} color="white" />
              <Text style={styles.googleButtonText}>Sign Up with Google</Text>
            </TouchableOpacity>

            <Link href="/login" asChild>
              <TouchableOpacity>
                <Text style={styles.signUpText}>
                  Already have an account? <Text style={{fontWeight: 'bold', color: '#6c63ff'}}>Sign in</Text>
                </Text>
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
    backgroundColor: '#f0f2f5',
  },
  container: {
    flexGrow: 1,
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
  profileImageWrapper: {
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#6c63ff',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingRight: 15,
    marginBottom: 15,
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
    marginBottom: 20,
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
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
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
  required: {
    color: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 10,
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
});
