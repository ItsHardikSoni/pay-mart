
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View, RefreshControl, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../supabaseClient';
import { useSession } from '../context/SessionProvider';
import { Colors } from '../constants/theme';

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
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [nameError, setNameError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');

  const fetchProfile = useCallback(async (isRefreshing = false) => {
    if (!isRefreshing) {
      setLoading(true);
    }
    try {
      const identifier = await AsyncStorage.getItem('paymart:loginIdentifier');

      if (!identifier) {
        await logout();
        router.replace('/login');
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('full_name, username, phone_number, email')
        .or(`phone_number.eq.${identifier},email.eq.${identifier},username.eq.${identifier}`)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        Alert.alert('Error', 'Could not fetch profile. Please try again.');
        await logout();
        router.replace('/login');
        return;
      }

      if (!data) {
        Alert.alert('Session expired', 'User not found. Please login again.');
        await logout();
        router.replace('/login');
        return;
      }

      setName(data.full_name ?? '');
      setUsername(data.username ?? '');
      setPhone(data.phone_number ?? '');
      setEmail(data.email ?? '');

    } catch (e) {
        console.error('An unexpected error occurred in fetchProfile:', e);
        Alert.alert('Error', 'An unexpected error occurred. Please login again.');
        await logout();
        router.replace('/login');
    } finally {
      if (!isRefreshing) {
        setLoading(false);
      }
      setRefreshing(false);
    }
  }, [logout, router]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchProfile();
    } else {
      router.replace('/login');
      setLoading(false);
    }
  }, [isLoggedIn, fetchProfile, router]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProfile(true);
  }, [fetchProfile]);
  
  const openEditModal = () => {
    setTempName(name);
    setTempUsername(username);
    setTempPhone(phone);
    setTempEmail(email);
    setNameError('');
    setUsernameError('');
    setPhoneError('');
    setEmailError('');
    setModalVisible(true);
  }

  const handleSave = async () => {
    setNameError('');
    setUsernameError('');
    setPhoneError('');
    setEmailError('');

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

    setSaving(true);
    try {
      const identifier = await AsyncStorage.getItem('paymart:loginIdentifier');
      if (!identifier) {
        Alert.alert('Session expired', 'Please login again');
        await logout();
        router.replace('/login');
        return;
      }
      
      if (tempUsername !== username) {
        const { count, error: usernameError } = await supabase.from('users').select('id', { count: 'exact', head: true }).eq('username', tempUsername);
        if (usernameError) console.error('Error checking username uniqueness:', usernameError);
        else if ((count ?? 0) > 0) {
          setUsernameError('Username already taken');
          setSaving(false);
          return;
        }
      }

      if (tempPhone !== phone) {
        const { count: phoneCount, error: phoneCheckError } = await supabase.from('users').select('id', { count: 'exact', head: true }).eq('phone_number', tempPhone);
        if (phoneCheckError) console.error('Error checking phone uniqueness:', phoneCheckError);
        else if ((phoneCount ?? 0) > 0) {
          setPhoneError('Phone number already in use');
          setSaving(false);
          return;
        }
      }

      if (tempEmail !== email) {
        const { count: emailCount, error: emailCheckError } = await supabase.from('users').select('id', { count: 'exact', head: true }).eq('email', tempEmail);
        if (emailCheckError) console.error('Error checking email uniqueness:', emailCheckError);
        else if ((emailCount ?? 0) > 0) {
          setEmailError('Email already in use');
          setSaving(false);
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

      if (tempUsername !== username) {
        const { error: orderHistoryError } = await supabase
          .from('order_history')
          .update({ username: tempUsername })
          .eq('username', username);

        if (orderHistoryError) {
          console.error('Error updating order history username:', orderHistoryError);
        }
      }

      setName(tempName);
      setUsername(tempUsername);
      setPhone(tempPhone);
      setEmail(tempEmail);
      await AsyncStorage.setItem('paymart:loginIdentifier', tempUsername);
      setModalVisible(false);
    } finally {
      setSaving(false);
    }
  };

  const InfoRow = ({ icon, label, value }: { icon: keyof typeof Ionicons['glyphMap'], label: string, value: string }) => (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={20} color={Colors.light.primary} style={styles.infoIcon} />
      <View>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.safeArea, styles.loader, {paddingTop: insets.top}]}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.safeArea,]}>
        <ScrollView 
          style={styles.container}
          contentContainerStyle={{ paddingBottom: insets.bottom }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.light.primary]} />}
        >
          <View style={styles.header}>
            <Text style={styles.userName}>{name}</Text>
            <Text style={styles.userHandle}>@{username}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile Details</Text>
            <View style={styles.card}>
              <InfoRow icon="person-outline" label="Name" value={name} />
              <InfoRow icon="at-outline" label="Username" value={username} />
              <InfoRow icon="call-outline" label="Phone" value={phone} />
              <InfoRow icon="mail-outline" label="Email" value={email} />
              <TouchableOpacity style={styles.editButton} onPress={openEditModal}>
                <Ionicons name="create-outline" size={20} color={Colors.light.primary} />
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Options</Text>
            <View style={styles.card}>
              <Link href="/order-history" asChild>
                <TouchableOpacity style={styles.optionButton}>
                  <Ionicons name="reader-outline" size={24} color={Colors.light.primary} />
                  <Text style={styles.optionText}>Order History</Text>
                  <Ionicons name="chevron-forward" size={24} color="#ccc" />
                </TouchableOpacity>
              </Link>
              <Link href="/refer-and-earn" asChild>
                <TouchableOpacity style={styles.optionButton}>
                  <Ionicons name="share-social-outline" size={24} color={Colors.light.primary} />
                  <Text style={styles.optionText}>Refer & Earn</Text>
                  <Ionicons name="chevron-forward" size={24} color="#ccc" />
                </TouchableOpacity>
              </Link>
              <Link href="/help-and-support" asChild>
                <TouchableOpacity style={styles.optionButton}>
                  <Ionicons name="help-circle-outline" size={24} color={Colors.light.primary} />
                  <Text style={styles.optionText}>Help & Support</Text>
                  <Ionicons name="chevron-forward" size={24} color="#ccc" />
                </TouchableOpacity>
              </Link>
            </View>
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={async () => {
              await logout();
              router.replace('/login');
            }}
          >
            <Ionicons name="log-out-outline" size={24} color='#FFF' />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>
        <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(!modalVisible)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
            <View style={styles.modalInnerContainer}>
              <TouchableWithoutFeedback>
                <View style={styles.modalView}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Edit Profile</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                      <Ionicons name="close-circle" size={28} color="#ccc" />
                    </TouchableOpacity>
                  </View>
                  <ScrollView>
                    <Text style={styles.inputLabel}>Name<Text style={styles.required}>*</Text></Text>
                    <TextInput style={styles.input} onChangeText={setTempName} value={tempName} placeholder="Enter your name" />
                    {!!nameError && <Text style={styles.errorText}>{nameError}</Text>}

                    <Text style={styles.inputLabel}>Username<Text style={styles.required}>*</Text></Text>
                    <TextInput style={styles.input} onChangeText={setTempUsername} value={tempUsername} placeholder="Enter your username" autoCapitalize="none" />
                    {!!usernameError && <Text style={styles.errorText}>{usernameError}</Text>}

                    <Text style={styles.inputLabel}>Phone<Text style={styles.required}>*</Text></Text>
                    <TextInput style={styles.input} onChangeText={setTempPhone} value={tempPhone} placeholder="Enter your phone" keyboardType="phone-pad" />
                    {!!phoneError && <Text style={styles.errorText}>{phoneError}</Text>}

                    <Text style={styles.inputLabel}>Email<Text style={styles.required}>*</Text></Text>
                    <TextInput style={styles.input} onChangeText={setTempEmail} value={tempEmail} placeholder="Enter your email" keyboardType="email-address" />
                    {!!emailError && <Text style={styles.errorText}>{emailError}</Text>}

                    <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
                      {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    paddingVertical: 30,
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  userHandle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  infoIcon: {
    marginRight: 15,
    marginTop: 2,
  },
  infoLabel: {
    fontSize: 14,
    color: '#888',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 10,
    backgroundColor: '#f0e6f7',
    borderRadius: 8,
  },
  editButtonText: {
    color: Colors.light.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  optionText: {
    flex: 1,
    marginLeft: 16,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 30,
    backgroundColor: Colors.light.danger,
    borderRadius: 16,
  },
  logoutButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalInnerContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalView: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 30,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#555',
    marginBottom: 5,
    marginTop: 10,
  },
  required: {
    color: Colors.light.danger,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  errorText: {
    color: Colors.light.danger,
    fontSize: 12,
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
