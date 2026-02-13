
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useSession } from '../context/SessionProvider';
import { supabase } from '../supabaseClient';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import LottieView from 'lottie-react-native';

const EInvoiceScreen = () => {
  const { cart, total, paymentMode, cashierName, razorpayPaymentId, orderNumber } = useLocalSearchParams();
  const { username } = useSession();
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerFullName, setCustomerFullName] = useState('');
  const cartItems = JSON.parse(cart as string);
  const invoiceRef = useRef();

  const invoiceDate = new Date().toLocaleDateString();
  const invoiceTime = new Date().toLocaleTimeString();

  useEffect(() => {
    const fetchData = async () => {
      if (username) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('full_name, phone_number')
          .eq('username', username)
          .single();

        if (userError) {
          console.error('Error fetching customer details:', userError);
        } else if (userData) {
          setCustomerPhone(userData.phone_number);
          setCustomerFullName(userData.full_name);
        }
      }
    };
    fetchData();
  }, [username]);

  const generateHtmlForPdf = () => {
    const itemsHtml = cartItems.map((item: any) => `
        <tr key=${item.id}>
            <td>${item.name}</td>
            <td>₹${item.mrp.toFixed(2)}</td>
            <td>${item.quantity}</td>
            <td class="amount">₹${(item.mrp * item.quantity).toFixed(2)}</td>
        </tr>
    `).join('');

    const termsAndConditions = `
    <div class="terms-section">
        <h3>Terms & Conditions</h3>
        <p>1. All items are sold on a non-returnable basis.</p>
        <p>2. Please check your items before leaving the counter.</p>
        <p>3. This is a computer-generated invoice and does not require a signature.</p>
    </div>
    `;

    const greeting = `<div class="greeting">Thank you for shopping with us, ${customerFullName || username}!!</div>`;

    return `
    <html>
        <head>
            <style>
                body { font-family: sans-serif; margin: 20px; }
                .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, 0.15); font-size: 16px; line-height: 24px; color: #555; }
                .header { text-align: center; margin-bottom: 20px; }
                .header h1 { margin: 0; color: ${Colors.light.primary}; }
                .header p { margin: 2px 0; }
                .details-section { margin-bottom: 20px; }
                .details-section table { width: 100%; line-height: inherit; text-align: left; }
                .details-section table td { padding: 5px; vertical-align: top; }
                .details-section table tr td:nth-child(2) { text-align: right; }
                .items-table table { width: 100%; border-collapse: collapse; }
                .items-table table th, .items-table table td { border: 1px solid #ddd; padding: 8px; }
                .items-table table th { background-color: #f2f2f2; text-align: left; }
                .total { text-align: right; margin-top: 20px; font-size: 18px; font-weight: bold; color: ${Colors.light.primary}; }
                .amount { text-align: right; }
                .terms-section { margin-top: 20px; font-size: 12px; color: #777; }
                .greeting { text-align: center; margin-top: 20px; font-size: 16px; font-weight: bold; color: ${Colors.light.primary}; }
            </style>
        </head>
        <body>
            <div class="invoice-box">
                <div class="header">
                    <h1>PayMart Supermarket</h1>
                    <p>123 Mart Lane, Tech City, StateName - 123456</p>
                    <p>Phone: +91 12345 67890</p>
                </div>
                <div class="details-section">
                    <table>
                        <tr><td><strong>Billed To:</strong> ${customerFullName || username}</td><td><strong>Bill No:</strong> ${orderNumber}</td></tr>
                        <tr><td><strong>Phone:</strong> ${customerPhone}</td><td><strong>Date:</strong> ${invoiceDate}</td></tr>
                        <tr><td><strong>Payment:</strong> ${paymentMode}</td><td><strong>Time:</strong> ${invoiceTime}</td></tr>
                        ${paymentMode === 'Cash' && cashierName ? `<tr><td><strong>Cashier:</strong> ${cashierName}</td><td></td></tr>` : ''}
                        ${paymentMode === 'Online' && razorpayPaymentId ? `<tr><td><strong>Payment ID:</strong> ${razorpayPaymentId}</td><td></td></tr>` : ''}
                    </table>
                </div>
                <div class="items-table">
                    <table>
                        <thead><tr><th>Product</th><th>MRP</th><th>Qty</th><th class="amount">Amount</th></tr></thead>
                        <tbody>${itemsHtml}</tbody>
                    </table>
                </div>
                <div class="total">Grand Total: ₹${parseFloat(total as string).toFixed(2)}</div>
                ${termsAndConditions}
                ${greeting}
            </div>
        </body>
    </html>
    `;
  };

  const handleDownloadInvoice = async () => {
    const htmlContent = generateHtmlForPdf();
    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { dialogTitle: 'Download Invoice', UTI: '.pdf' });
    } catch (error) {
      console.error('Failed to generate or share PDF', error);
    }
  };

  const InfoRow = ({ label, value }: { label: string, value: string | string[] | undefined}) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>E-Invoice</Text>
        <View style={{ width: 24 }} />
      </View>

      <LottieView
        source={require('../assets/lottie/success-animation.json')}
        autoPlay
        loop={false}
        style={styles.invoiceAnimation}
      />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.card} ref={invoiceRef}>
          <View style={styles.martDetails}>
            <Text style={styles.martName}>PayMart Supermarket</Text>
            <Text style={styles.martAddress}>123 Mart Lane, Tech City, StateName, DistrictName - 123456</Text>
            <Text style={styles.martContact}>Phone: +91 12345 67890 | GSTIN: 29ABCDE1234F1Z5</Text>
          </View>

          <View style={styles.separator} />

          <View style={styles.customerDetails}>
            <Text style={styles.sectionTitle}>Billed To</Text>
            <InfoRow label="Customer Name:" value={customerFullName || username || 'Guest'} />
            <InfoRow label="Phone Number:" value={customerPhone || 'N/A'} />
          </View>

          <View style={styles.separator} />

          <View style={styles.invoiceMeta}>
            <InfoRow label="Bill Number:" value={orderNumber} />
            <InfoRow label="Date:" value={invoiceDate} />
            <InfoRow label="Time:" value={invoiceTime} />
            <InfoRow label="Payment Mode:" value={paymentMode as string || 'N/A'} />
            {paymentMode === 'Cash' && cashierName ? <InfoRow label="Cashier:" value={cashierName as string} /> : null}
            {paymentMode === 'Online' && razorpayPaymentId ? <InfoRow label="Payment ID:" value={razorpayPaymentId as string} /> : null}
          </View>

          <View style={styles.separator} />

          <View style={styles.itemsSection}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            <View style={styles.itemsHeader}>
              <Text style={[styles.itemsHeaderText, { flex: 3 }]}>Product</Text>
              <Text style={styles.itemsHeaderText}>MRP</Text>
              <Text style={styles.itemsHeaderText}>Qty</Text>
              <Text style={[styles.itemsHeaderText, { textAlign: 'right' }]}>Amount</Text>
            </View>
            {cartItems.map((item: any, index: number) => (
              <View key={`${item.id}-${index}`} style={styles.itemRow}>
                <Text style={[styles.itemText, { flex: 3 }]}>{item.name}</Text>
                <Text style={styles.itemText}>₹{item.mrp.toFixed(2)}</Text>
                <Text style={styles.itemText}>{item.quantity}</Text>
                <Text style={[styles.itemText, { textAlign: 'right' }]}>₹{(item.mrp * item.quantity).toFixed(2)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.separator} />

          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalAmount}>₹{parseFloat(total as string).toFixed(2)}</Text>
          </View>

          <View style={styles.termsSection}>
            <Text style={styles.sectionTitle}>Terms & Conditions</Text>
            <Text style={styles.termsText}>1. All items are sold on a non-returnable basis.</Text>
            <Text style={styles.termsText}>2. Please check your items before leaving the counter.</Text>
            <Text style={styles.termsText}>3. This is a computer-generated invoice and does not require a signature.</Text>
          </View>

          <Text style={styles.greetingText}>Thank you for shopping with us, {customerFullName || username}!!</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.downloadButton} onPress={handleDownloadInvoice}>
          <Ionicons name="download-outline" size={22} color={Colors.light.primary} />
          <Text style={styles.downloadButtonText}>Download</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.doneButton} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f8',
  },
  invoiceAnimation: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
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
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  martDetails: {
    alignItems: 'center',
    marginBottom: 15,
  },
  martName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  martAddress: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  martContact: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  customerDetails: {
    marginVertical: 10,
  },
  invoiceMeta: {
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 15,
  },
  itemsSection: {
    marginTop: 10,
  },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  itemsHeaderText: {
    flex: 1,
    fontWeight: 'bold',
    color: '#444',
    fontSize: 14,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  itemText: {
    flex: 1,
    fontSize: 14,
    color: '#555',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 2,
    borderTopColor: '#333',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  termsSection: {
    marginTop: 20,
  },
  termsText: {
    fontSize: 12,
    color: '#777',
    marginBottom: 5,
  },
  greetingText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.primary,
    marginTop: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  downloadButtonText: {
    color: Colors.light.primary,
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
  },
  doneButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    flex: 0.45,
  },
  doneButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default EInvoiceScreen;
