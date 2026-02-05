
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '../context/SessionProvider';

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [name, setName] = useState('Not set');
  const [phone, setPhone] = useState('Not set');
  const [imageOptionsVisible, setImageOptionsVisible] = useState(false);
  const { logout } = useSession();
  const router = useRouter();
  const [tempName, setTempName] = useState(name);
  const [tempPhone, setTempPhone] = useState(phone);

  const handleSave = () => {
      setName(tempName);
      setPhone(tempPhone);
      setModalVisible(false);
  }

  const handleImagePress = () => {
    setImageOptionsVisible(true);
  };

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'You need to grant camera permissions to take a photo.');
      return false;
    }
    return true;
  };

  const requestGalleryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'You need to grant gallery permissions to choose an image.');
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
    setImageOptionsVisible(false);
  };

  const chooseFromGallery = async () => {
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) return;

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
    setImageOptionsVisible(false);
  };

  const removePhoto = () => {
    setImage(null);
    setImageOptionsVisible(false);
  };


  return (
    <View style={{flex: 1, backgroundColor: '#f3f4f6'}}>
        <ScrollView 
            style={styles.container}
            contentContainerStyle={{ paddingBottom: insets.bottom }}
        >
        <View
            style={[styles.header]}
        >
            <View style={styles.headerContent}>
            <TouchableOpacity onPress={handleImagePress} style={styles.profileImageContainer}>
              {image ? (
                <Image source={{ uri: image }} style={styles.profileImage} />
              ) : (
                <Ionicons name="person-circle-outline" size={80} color="white" />
              )}
               <View style={styles.editIconContainer}>
                <Ionicons name="create-outline" size={16} color="#6c63ff" />
              </View>
            </TouchableOpacity>
            </View>
        </View>

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
        <Modal
        animationType="slide"
        transparent={true}
        visible={imageOptionsVisible}
        onRequestClose={() => setImageOptionsVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setImageOptionsVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.imageOptionsContainer}>
              <TouchableOpacity style={styles.imageOption} onPress={takePhoto}>
                <Ionicons name="camera-outline" size={24} color="#6c63ff" />
                <Text style={styles.imageOptionText}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.imageOption} onPress={chooseFromGallery}>
                <Ionicons name="image-outline" size={24} color="#6c63ff" />
                <Text style={styles.imageOptionText}>Choose from Gallery</Text>
              </TouchableOpacity>
              {image && (
                <TouchableOpacity style={styles.imageOption} onPress={removePhoto}>
                  <Ionicons name="trash-outline" size={24} color="red" />
                  <Text style={[styles.imageOptionText, { color: 'red' }]}>Remove Photo</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.imageOption, styles.cancelOption]}
                onPress={() => setImageOptionsVisible(false)}
              >
                <Text style={styles.cancelOptionText}>Cancel</Text>
              </TouchableOpacity>
            </View>
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
    backgroundColor: '#6c63ff',
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 20, 
  },
  headerContent: {
    alignItems: 'center',
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'white',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
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
  },
  imageOptionsContainer: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 10,
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    position: 'absolute',
    bottom: 40,
    left: '5%',
  },
  imageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  imageOptionText: {
    marginLeft: 15,
    fontSize: 18,
    color: '#6c63ff',
  },
  cancelOption: {
    borderBottomWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelOptionText: {
    color: 'red',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
