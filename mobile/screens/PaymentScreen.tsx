import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { useRNMobileAuth } from '../hooks/useAuth';
import { deliveriesApi } from '../api/deliveries';

type Props = NativeStackScreenProps<RootStackParamList, 'Payment'>;

export default function PaymentScreen({ route, navigation }: Props) {
  const { deliveryId, tipAmount } = route.params;
  const { getAuthToken } = useRNMobileAuth();
  const [loading, setLoading] = useState(true);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  useEffect(() => {
    const initPayment = async () => {
      try {
        const result = await deliveriesApi.initializePayment(deliveryId, tipAmount);
        if (result?.redirectUrl) {
          setCheckoutUrl(result.redirectUrl);
        } else {
          setError('Failed to initialize payment');
        }
      } catch (err) {
        setError('Payment initialization failed');
      } finally {
        setLoading(false);
      }
    };
    initPayment();
  }, [deliveryId, tipAmount]);

  useEffect(() => {
    if (!checkoutUrl) return;

    // Poll for delivery status every 3 seconds
    const interval = setInterval(async () => {
      try {
        const delivery = await deliveriesApi.getById(deliveryId);
        if (delivery?.paymentStatus === 'PAID') {
          setPaymentComplete(true);
          clearInterval(interval);
        } else if (delivery?.paymentStatus === 'FAILED') {
          setError('Payment failed');
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [deliveryId, checkoutUrl]);

  const handleNavigationStateChange = (navState: any) => {
    const url = navState.url;
    if (url.includes('payment=success') || url.includes('orderId=')) {
      setPaymentComplete(true);
    }
  };

  const handleClose = () => {
    if (paymentComplete) {
      navigation.replace('DeliveryDetails', { deliveryId });
    } else {
      navigation.goBack();
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Initializing payment...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Payment Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => { setError(null); setLoading(true); }}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose}>
          <Text style={styles.closeButton}>✕ Close</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Payment</Text>
        <View style={{ width: 50 }} />
      </View>

      {paymentComplete ? (
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>Payment Successful!</Text>
          <Text style={styles.successMessage}>Your delivery has been confirmed.</Text>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => navigation.replace('DeliveryDetails', { deliveryId })}
          >
            <Text style={styles.continueButtonText}>View Delivery</Text>
          </TouchableOpacity>
        </View>
      ) : checkoutUrl && (
        <WebView
          source={{ uri: checkoutUrl }}
          onNavigationStateChange={handleNavigationStateChange}
          startInLoadingState
          onError={() => {
            setError('Failed to load payment page');
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    color: '#007AFF',
    fontSize: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  successIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  successMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  continueButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#DC2626',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#DC2626',
    fontWeight: '600',
  },
});
