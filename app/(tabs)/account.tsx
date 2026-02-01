
import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Modal, TextInput, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('Not set');
  const [phone, setPhone] = useState('Not set');

  const [tempName, setTempName] = useState(name);
  const [tempPhone, setTempPhone] = useState(phone);

  const handleSave = () => {
      setName(tempName);
      setPhone(tempPhone);
      setModalVisible(false);
  }

  return (
    <View style={{flex: 1, backgroundColor: '#f3f4f6'}}>
        <ScrollView 
            style={styles.container}
            contentContainerStyle={{ paddingBottom: insets.bottom }}
        >
        <LinearGradient
            colors={['#8e44ad', '#6c63ff']}
            style={[styles.header, { paddingTop: insets.top + 20 }]}
        >
            <View style={styles.headerContent}>
            <Ionicons name="person-circle-outline" size={80} color="white" />
            <Text style={styles.userName}>User</Text>
            </View>
        </LinearGradient>

        <View style={styles.card}>
            <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Profile Details</Text>
            <TouchableOpacity onPress={() => setModalVisible(true)}>
                <Text style={styles.editButton}> <Ionicons name="create-outline" size={16} color="#6c63ff" /> Edit</Text>
            </TouchableOpacity>
            </View>
            <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={24} color="#ccc" />
            <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>{name}</Text>
            </View>
            </View>
            <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={24} color="#ccc" />
            <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>Not set</Text>
            </View>
            </View>
            <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={24} color="#ccc" />
            <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{phone}</Text>
            </View>
            </View>
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

        <TouchableOpacity style={styles.logoutButton}>
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

                            <Text style={styles.inputLabel}>Name</Text>
                            <TextInput
                                style={styles.input}
                                onChangeText={setTempName}
                                value={tempName}
                                placeholder="Enter your name"
                            />

                            <Text style={styles.inputLabel}>Phone</Text>
                            <TextInput
                                style={styles.input}
                                onChangeText={setTempPhone}
                                value={tempPhone}
                                placeholder="Enter your phone"
                                keyboardType="phone-pad"
                            />

                            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                                <Text style={styles.saveButtonText}>Save Changes</Text>
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
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingHorizontal: 20,
    paddingBottom: 60,
    marginBottom: -40, 
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
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
      marginLeft: 16
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
    opacity: 0.2
  },
  optionButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    marginHorizontal: 16,
  },
  optionTextContainer: {
      flex: 1,
      marginLeft: 16
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
    margin: 16,
    borderWidth: 1,
    borderColor: 'red'
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
  input: {
      backgroundColor: '#f3f4f6',
      borderRadius: 10,
      padding: 12,
      marginBottom: 15,
      fontSize: 16,
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
  }
});
