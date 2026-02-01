
import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, LayoutAnimation, UIManager, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

interface Faq {
  question: string;
  answer: string;
}

const faqs: Faq[] = [
  { question: 'How do I scan products?', answer: 'To scan a product, go to the Scan screen and point your camera at the barcode until it\'s recognized.' },
  { question: 'What if the barcode won’t scan?', answer: 'If a barcode won’t scan, you can manually enter the barcode number on the Scan screen.' },
  { question: 'What payment methods are accepted?', answer: 'We accept all major credit cards, as well as Google Pay and Apple Pay.' },
  { question: 'How do I view my order history?', answer: 'You can view your past orders by navigating to the Account screen and selecting "Order History".' },
  { question: 'Can I edit my profile information?', answer: 'Yes, you can edit your profile information in the Account screen by tapping the "Edit" button.' },
  { question: 'What are the savings shown in my cart?', answer: 'The savings shown are the total discounts applied to the items in your cart based on current promotions.' },
  { question: 'How do I download my invoice?', answer: 'You can download the invoice for any order from the Order Details page in your "Order History".' },
  { question: 'Is my payment information secure?', answer: 'Yes, all payment information is encrypted and securely processed. We do not store your full card details.' },
];

interface FaqItemProps {
  item: Faq;
  index: number;
  expanded: number | null;
  setExpanded: (index: number | null) => void;
}

const FaqItem: React.FC<FaqItemProps> = ({ item, index, expanded, setExpanded }) => {
  const isExpanded = expanded === index;

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(isExpanded ? null : index);
  };

  return (
    <View>
      <TouchableOpacity style={styles.questionContainer} onPress={toggleExpand}>
        <Text style={styles.questionText}>{item.question}</Text>
        <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color="#ccc" />
      </TouchableOpacity>
      {isExpanded && (
        <View style={styles.answerContainer}>
          <Text style={styles.answerText}>{item.answer}</Text>
        </View>
      )}
    </View>
  );
};

export default function HelpAndSupportScreen() {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="black" />
        <Text style={styles.pageTitle}>Help & Support</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Frequently Asked Questions</Text>
        {faqs.map((faq, index) => (
          <FaqItem key={index} item={faq} index={index} expanded={expanded} setExpanded={setExpanded} />
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Contact Us</Text>
        <View style={styles.contactItem}>
          <View style={styles.contactIconContainer}>
            <Ionicons name="call-outline" size={24} color="#6c63ff" />
          </View>
          <View style={styles.contactTextContainer}>
            <Text style={styles.contactItemTitle}>Phone Support</Text>
            <Text style={styles.contactItemDetail}>+91 98765 43210</Text>
            <Text style={styles.contactItemSubDetail}>Mon - Sat, 9 AM - 9 PM</Text>
          </View>
        </View>
        <View style={styles.contactItem}>
          <View style={styles.contactIconContainer}>
            <Ionicons name="mail-outline" size={24} color="#6c63ff" />
          </View>
          <View style={styles.contactTextContainer}>
            <Text style={styles.contactItemTitle}>Email Support</Text>
            <Text style={styles.contactItemDetail}>support@smartmart.com</Text>
            <Text style={styles.contactItemSubDetail}>We reply within 24 hours</Text>
          </View>
        </View>
        <View style={styles.contactItem}>
          <View style={styles.contactIconContainer}>
            <Ionicons name="location-outline" size={24} color="#6c63ff" />
          </View>
          <View style={styles.contactTextContainer}>
            <Text style={styles.contactItemTitle}>Store Address</Text>
            <Text style={styles.contactItemDetail}>123 Shopping Street</Text>
            <Text style={styles.contactItemSubDetail}>City Center, Mumbai - 400001</Text>
          </View>
        </View>
        <View style={styles.contactItem}>
          <View style={styles.contactIconContainer}>
            <Ionicons name="chatbubble-ellipses-outline" size={24} color="#6c63ff" />
          </View>
          <View style={styles.contactTextContainer}>
            <Text style={styles.contactItemTitle}>Live Chat</Text>
            <Text style={styles.contactItemDetail}>Available on website</Text>
            <Text style={styles.contactItemSubDetail}>Chat with us instantly</Text>
          </View>
        </View>
      </View>

      <View style={styles.needHelpCard}>
        <Text style={styles.needHelpTitle}>Need More Help?</Text>
        <Text style={styles.needHelpText}>Our customer support team is always ready to assist you with any questions or concerns.</Text>
        <TouchableOpacity style={styles.callSupportButton}>
          <Ionicons name="call-outline" size={20} color="white" />
          <Text style={styles.callSupportButtonText}>Call Support Now</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 20,
  },
  backButton: {
    marginBottom: 10,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16
  },
  heroCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    margin: 16,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 16,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  questionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  questionText: {
    fontSize: 16,
    flex: 1,
  },
  answerContainer: {
    padding: 16,
    backgroundColor: '#fafafa'
  },
  answerText: {
    fontSize: 14,
    color: '#333'
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  contactIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e6e6fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactTextContainer: {
    flex: 1,
  },
  contactItemTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
  },
  contactItemDetail: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  contactItemSubDetail: {
    fontSize: 12,
    color: 'gray',
    marginTop: 2,
  },
  needHelpCard: {
    backgroundColor: '#f0f0ff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  needHelpTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 8,
  },
  needHelpText: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  callSupportButton: {
    backgroundColor: '#6c63ff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 25,
  },
  callSupportButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
});
