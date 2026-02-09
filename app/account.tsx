
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../supabaseClient';
import { useSession } from './context/SessionProvider';

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const { isLoggedIn, logout } = useSession();
  const router = useRouter();
  const [tempName, setTempName] = useState(name);
  const [tempUsername, setTempUsername] = useState(username);
  const [tempPhone, setTempPhone] = useState(phone);
  const [tempEmail, setTempEmail] = useState(email);
  const [loading, setLoading] = useState(true);
  const [nameError, setNameError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');

  const fetchProfile = React.useCallback(async () => {
    setLoading(true);
    try {
      const identifier = await AsyncStorage.getItem('paymart:loginIdentifier');

      if (!identifier) {
        Alert.alert('Session expired', 'Please login again');
        await logout();
        router.replace('/login');
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('full_name, username, phone_number, email')
        .or(`phone_number.eq.${identifier},email.eq.${identifier},username.eq.${identifier}`)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        Alert.alert('Error', 'Could not fetch profile');
        return;
      }

      setName(data.full_name ?? '');
      setUsername(data.username ?? '');
      setPhone(data.phone_number ?? '');
      setEmail(data.email ?? '');

      setTempName(data.full_name ?? '');
      setTempUsername(data.username ?? '');
      setTempPhone(data.phone_number ?? '');
      setTempEmail(data.email ?? '');
    } finally {
      setLoading(false);
    }
  }, [logout, router]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchProfile();
    }
  }, [isLoggedIn, fetchProfile]);

  const handleSave = async () => {
    setNameError('');
    setUsernameError('');
    setPhoneError('');
    setEmailError('');

    // required field validation
    let hasError = false;
    if (!tempName.trim()) {
      setNameError('Name is required');
      hasError = true;
    }
    if (!tempUsername.trim()) {
      setUsernameError('Username is required');
      hasError = true;
    }
    if (!tempPhone.trim()) {
      setPhoneError('Phone number is required');
      hasError = true;
    }
    if (!tempEmail.trim()) {
      setEmailError('Email is required');
      hasError = true;
    }

    if (hasError) {
      return;
    }

    setLoading(true);
    try {
      const identifier = await AsyncStorage.getItem('paymart:loginIdentifier');

      if (!identifier) {
        Alert.alert('Session expired', 'Please login again');
        await logout();
        router.replace('/login');
        return;
      }

      // Check if username is already taken by someone else
      if (tempUsername) {
        const { count, error: usernameError } = await supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .eq('username', tempUsername)
          .neq('username', username);

        if (usernameError) {
          console.error('Error checking username uniqueness:', usernameError);
        } else if ((count ?? 0) > 0) {
          setUsernameError('Username already taken');
          return;
        }
      }

      // Check if phone number is already used by someone else
      if (tempPhone && tempPhone !== phone) {
        const { count: phoneCount, error: phoneCheckError } = await supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .eq('phone_number', tempPhone)
          .neq('phone_number', phone);

        if (phoneCheckError) {
          console.error('Error checking phone uniqueness:', phoneCheckError);
        } else if ((phoneCount ?? 0) > 0) {
          setPhoneError('Phone number already in used');
          return;
        }
      }

      // Check if email is already used by someone else
      if (tempEmail && tempEmail !== email) {
        const { count: emailCount, error: emailCheckError } = await supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .eq('email', tempEmail)
          .neq('email', email);

        if (emailCheckError) {
          console.error('Error checking email uniqueness:', emailCheckError);
        } else if ((emailCount ?? 0) > 0) {
          setEmailError('Email already in used');
          return;
        }
      }

      const { error } = await supabase
        .from('users')
        .update({
          full_name: tempName,
          username: tempUsername,
          phone_number: tempPhone,
          email: tempEmail,
        })
        .or(`phone_number.eq.${identifier},email.eq.${identifier},username.eq.${identifier}`);

      if (error) {
        Alert.alert('Error', 'Could not update profile');
        return;
      }

      setName(tempName);
      setUsername(tempUsername);
      setPhone(tempPhone);
      setEmail(tempEmail);
      setModalVisible(false);
    } finally {
      setLoading(false);
    }
  };
 

  return (
    <View style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: insets.bottom, justifyContent: 'center', flexGrow: 1 }}
      >
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Your Account</Text>
          <Text style={styles.subtitle}>Manage your profile and settings</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Profile Details</Text>
            <TouchableOpacity onPress={() => setModalVisible(true)}>
              <Text style={styles.editButton}>
                <Ionicons name="create-outline" size={16} color="#6c63ff" /> Edit
              </Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <Text>Loading...</Text>
          ) : (
            <>
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={24} color="#ccc" />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Name</Text>
                  <Text style={styles.infoValue}>{name}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="at-outline" size={24} color="#ccc" />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Username</Text>
                  <Text style={styles.infoValue}>{username}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={24} color="#ccc" />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoValue}>{phone}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={24} color="#ccc" />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{email}</Text>
                </View>
              </View>
            </>
          )}
        </View>

        <View style={[styles.card, styles.ordersCard]}>
          <Text style={styles.totalOrdersText}>Total Orders</Text>
          <Text style={styles.totalOrdersValue}>0</Text>
          <Ionicons name="bag-outline" size={40} color="#6c63ff" style={styles.ordersIcon} />
        </View>

        <Link href="/order-history" asChild>
          <TouchableOpacity style={styles.optionButton}>
            <Ionicons name="reader-outline" size={24} color="#6c63ff" />
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionText}>Order History</Text>
              <Text style={styles.optionSubText}>View all your orders</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
          </TouchableOpacity>
        </Link>

        <Link href="/help-and-support" asChild>
          <TouchableOpacity style={styles.optionButton}>
            <Ionicons name="help-circle-outline" size={24} color="#6c63ff" />
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionText}>Help & Support</Text>
              <Text style={styles.optionSubText}>FAQs and contact info</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
          </TouchableOpacity>
        </Link>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={async () => {
            await logout();
            router.replace('/login');
          }}
        >
          <Ionicons name="log-out-outline" size={24} color="red" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalView}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Edit Profile</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color="black" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.modalSubtitle}>Update your profile information</Text>

                <Text style={styles.inputLabel}>
                  Name<Text style={styles.required}> *</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  onChangeText={setTempName}
                  value={tempName}
                  placeholder="Enter your name"
                />
                {!!nameError && <Text style={styles.usernameError}>{nameError}</Text>}

                <Text style={styles.inputLabel}>
                  Username<Text style={styles.required}> *</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  onChangeText={setTempUsername}
                  value={tempUsername}
                  placeholder="Enter your username"
                  autoCapitalize="none"
                />
                {!!usernameError && <Text style={styles.usernameError}>{usernameError}</Text>}

                <Text style={styles.inputLabel}>
                  Phone<Text style={styles.required}> *</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  onChangeText={setTempPhone}
                  value={tempPhone}
                  placeholder="Enter your phone"
                  keyboardType="phone-pad"
                />
                {!!phoneError && <Text style={styles.usernameError}>{phoneError}</Text>}
                <Text style={styles.inputLabel}>
                  Email<Text style={styles.required}> *</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  onChangeText={setTempEmail}
                  value={tempEmail}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                />
                {!!emailError && <Text style={styles.usernameError}>{emailError}</Text>}

                <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
                  <Text style={styles.saveButtonText}>{loading ? 'Saving...' : 'Save Changes'}</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  container: {
    flex: 1,
    paddingHorizontal: 10,
  },
  titleContainer: {
    alignItems: 'center',
    marginVertical: 20,
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
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  editButton: {
    color: '#6c63ff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  infoTextContainer: {
    marginLeft: 16,
  },
  infoLabel: {
    color: '#888',
    fontSize: 14,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  ordersCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalOrdersText: {
    fontSize: 16,
  },
  totalOrdersValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#6c63ff',
  },
  ordersIcon: {
    position: 'absolute',
    right: 20,
    top: 20,
    opacity: 0.2,
  },
  optionButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  optionTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  optionText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  optionSubText: {
    fontSize: 14,
    color: '#888',
  },
  logoutButton: {
    backgroundColor: '#ffebee',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'red',
  },
  logoutButtonText: {
    color: 'red',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  required: {
    color: 'red',
  },
  input: {
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  usernameError: {
    color: 'red',
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: '#6c63ff',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
