
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { Colors } from '../constants/theme';

const faqs = [
  {
    question: 'What is PayMart? ',
    answer: 'PayMart is a smart shopping application designed to streamline your in-store experience. With our Scan & Go feature, you can scan product barcodes, add items to your digital cart, and check out seamlessly, either online or at the counter.',
  },
  {
    question: 'How does the Scan & Go feature work?',
    answer: 'Simply open the app and tap the \'Scan\' button. Point your phone’s camera at a product’s barcode. The item will be instantly identified and added to your cart. You can adjust quantities or remove items directly from the app.',
  },
  {
      question: 'What if I scan the wrong item or change my mind?',
      answer: 'No problem! You can easily manage your cart at any time. Just go to your cart screen, where you can remove items by swiping or tapping a delete icon, and you can adjust the quantity of any item before you proceed to checkout.'
  },
  {
    question: 'What payment methods are accepted?',
    answer: 'We offer flexible payment options. You can pay securely within the app using credit/debit cards and UPI, or you can choose to pay at the store’s counter with cash or other available methods.',
  },
  {
    question: 'Is my payment information secure?',
    answer: 'Absolutely. We prioritize your security. All online transactions are processed through a secure, encrypted payment gateway. We do not store your sensitive card details on our servers.',
  },
  {
    question: 'Why does the app need camera and location access?',
    answer: 'PayMart uses your camera for the \'Scan & Go\' feature to scan barcodes. Location access is required to verify you are in a participating store, which helps prevent fraud. Your data is used only for these purposes and is not shared.',
  },
  {
    question: 'How can I view my past orders and receipts?',
    answer: 'Navigate to the \'Orders\' or \'Account\' section to find your complete order history. Every purchase comes with a digital receipt, which you can view or download anytime.',
  },
  {
      question: 'What happens if the app closes or my phone dies?',
      answer: 'Your shopping cart is automatically saved to your account in real-time. If the app closes or your phone turns off, just reopen it and log in. Your cart will be right where you left it.'
  },
  {
    question: 'How do I use a referral code?',
    answer: 'You can enter a referral code when you sign up or in the \'Refer & Earn\' section of the app. Once applied, you and the friend who referred you will receive exciting rewards.',
  },
  {
    question: 'What is your return policy?',
    answer: 'All sales are final and items are sold on a non-returnable basis. We encourage you to double-check your items at the time of purchase before leaving the store.',
  },
  {
    question: 'Who do I contact for support?',
    answer: 'If you have any issues or questions, you can reach our support team by tapping the \'Contact Us\' button below or emailing us at support@paymart.com.',
  },
];

const HelpAndSupportScreen = () => {
  const navigation = useNavigation();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const handleContactUs = () => {
    Linking.openURL('mailto:support@paymart.com?subject=Help and Support').catch(() => {
        Alert.alert("Error", "Unable to open email client.");
    });
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
              <TouchableOpacity onPress={() => toggleFaq(index)} style={styles.faqQuestionContainer}>
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                <Ionicons 
                  name={expandedFaq === index ? 'chevron-up-outline' : 'chevron-down-outline'} 
                  size={20} 
                  color="#555" 
                />
              </TouchableOpacity>
              {expandedFaq === index && (
                <Text style={styles.faqAnswer}>{faq.answer}</Text>
              )}
            </View>
          ))}
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact Us</Text>
          <TouchableOpacity style={styles.contactButton} onPress={handleContactUs}>
            <Ionicons name="mail-outline" size={22} color="#fff" />
            <Text style={styles.contactButtonText}>Email Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eef0f2',
  },
  backButton: {
    marginRight: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  scrollContainer: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 15,
  },
  faqQuestionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
    flex: 1, // Allow text to wrap
  },
  faqAnswer: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    lineHeight: 22,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    paddingVertical: 15,
    borderRadius: 10,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default HelpAndSupportScreen;
