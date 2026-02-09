import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';
import { useNavigation } from 'expo-router';

const faqs = [
  {
    question: 'How do I scan a product?',
    answer: 'To scan a product, go to the Scan tab and point your camera at the barcode. The app will automatically detect the barcode and fetch the product details.',
  },
  {
    question: 'How do I view my order history?',
    answer: 'You can view your order history by navigating to the Account tab and selecting Order History. All your past orders will be listed there.',
  },
  {
    question: 'How do I edit my profile?',
    answer: 'To edit your profile, go to the Account tab and tap the Edit button. You can update your name, username, phone number, and email address.',
  },
];

const HelpAndSupportScreen = () => {
  const navigation = useNavigation();

  const handleContactUs = () => {
    Linking.openURL('mailto:support@paymart.com');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Help & Support</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Frequently Asked Questions</Text>
          {faqs.map((faq, index) => (
            <View key={index} style={styles.faqItem}>
              <Text style={styles.faqQuestion}>{faq.question}</Text>
              <Text style={styles.faqAnswer}>{faq.answer}</Text>
            </View>
          ))}
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact Us</Text>
          <TouchableOpacity style={styles.contactButton} onPress={handleContactUs}>
            <Ionicons name="mail-outline" size={24} color={Colors.light.primary} />
            <Text style={styles.contactButtonText}>support@paymart.com</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lightBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  scrollContainer: {
    padding: 16,
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
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: Colors.light.text,
  },
  faqItem: {
    marginBottom: 16,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  faqAnswer: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 8,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactButtonText: {
    fontSize: 16,
    color: Colors.light.primary,
    marginLeft: 8,
  },
});

export default HelpAndSupportScreen;
