
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/theme';
import LottieView from 'lottie-react-native';

const ReferAndEarnScreen = () => {
  const router = useRouter();
  const referralCode = "PAYMART2024";
  const appLink = "https://example.com/download"; // Replace with your app's actual link

  const onShare = async () => {
    try {
      const result = await Share.share({
        message: `Join me on PayMart! Use my referral code ${referralCode} to get exciting rewards. Download the app now: ${appLink}`,
        url: appLink,
        title: 'Refer and Earn on PayMart'
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log('Shared with activity type:', result.activityType);
        } else {
          console.log('Shared');
        }
      } else if (result.action === Share.dismissedAction) {
        console.log('Share dismissed');
      }
    } catch (error: any) {
      console.error('Failed to share:', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.primary} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Refer & Earn</Text>
        <View style={{width: 24}}/>
      </View>

        <LottieView
          source={require('../assets/lottie/refer-and-earn.json')} // Make sure you have this Lottie file
          autoPlay
          loop
          style={styles.lottieAnimation}
        />
      <View style={styles.content}>
        <Text style={styles.title}>Invite Friends, Get Rewards!</Text>
        <Text style={styles.subtitle}>Share your referral code with friends and you'll both get amazing discounts on your next purchase.</Text>

        <View style={styles.referralCodeContainer}>
            <Text style={styles.referralCodeText}>{referralCode}</Text>
            <TouchableOpacity onPress={() => {}} style={styles.copyButton}>
                <Ionicons name="copy-outline" size={22} color={Colors.light.primary} />
            </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={onShare} style={styles.shareButton}>
          <Ionicons name="share-social-outline" size={22} color="white" />
          <Text style={styles.shareButtonText}>Share Your Code</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eef0f2',
  },
  backButton: {
    padding: 5,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  lottieAnimation: {
    width: 'auto',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#34495e',
    textAlign: 'center',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 15,
    lineHeight: 24,
  },
  referralCodeContainer: {
    marginTop: 30,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e9ecef',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: '#ced4da',
  },
  referralCodeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#495057',
    marginRight: 15,
  },
  copyButton: {
    padding: 5,
  },
  shareButton: {
    marginTop: 30,
    flexDirection: 'row',
    backgroundColor: Colors.light.primary,
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  shareButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default ReferAndEarnScreen;
