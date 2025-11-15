import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Input, Button, Card } from '../../components';
import { RootStackParamList } from '../../types';
import { megaService } from '../../services/mega';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const MegaSettingsScreen = () => {
  const navigation = useNavigation<NavigationProp>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      setCheckingStatus(true);
      const hasCredentials = await megaService.hasCredentials();
      setIsLoggedIn(hasCredentials);

      if (hasCredentials) {
        const credentials = await megaService.loadCredentials();
        if (credentials) {
          setEmail(credentials.email);
          // Don't show password for security
        }
      }
    } catch (error) {
      console.error('Error checking login status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!email.includes('@')) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      // Test connection first
      const isConnected = await megaService.testConnection(email, password);

      if (!isConnected) {
        Alert.alert('Login Failed', 'Invalid email or password. Please try again.');
        return;
      }

      // Save credentials
      await megaService.saveCredentials(email, password);
      setIsLoggedIn(true);

      Alert.alert('Success', 'Successfully connected to MEGA!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert(
        'Login Failed',
        error.message || 'Failed to connect to MEGA. Please check your credentials and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout from MEGA? This will remove your saved credentials.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await megaService.clearCredentials();
              setEmail('');
              setPassword('');
              setIsLoggedIn(false);
              Alert.alert('Success', 'Logged out successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleTestConnection = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const isConnected = await megaService.testConnection(email, password);

      if (isConnected) {
        Alert.alert('Success', 'Connection test successful!');
      } else {
        Alert.alert('Failed', 'Connection test failed. Please check your credentials.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to test connection.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Checking MEGA status...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card>
        <Text style={styles.title}>MEGA Cloud Storage</Text>
        <Text style={styles.description}>
          Connect your MEGA account to automatically backup and restore your charity data to the cloud.
        </Text>

        {isLoggedIn && (
          <View style={styles.statusContainer}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>✓ Connected</Text>
            </View>
          </View>
        )}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>
          {isLoggedIn ? 'Account Details' : 'Login to MEGA'}
        </Text>

        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="your-email@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
          editable={!isLoggedIn}
        />

        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Your MEGA password"
          secureTextEntry
          error={errors.password}
          editable={!isLoggedIn}
        />

        {!isLoggedIn ? (
          <>
            <Button
              title="Connect to MEGA"
              onPress={handleLogin}
              loading={loading}
              variant="primary"
              size="large"
              style={styles.button}
            />
            <Button
              title="Test Connection"
              onPress={handleTestConnection}
              loading={loading}
              variant="secondary"
              size="large"
              style={styles.button}
            />
          </>
        ) : (
          <Button
            title="Disconnect from MEGA"
            onPress={handleLogout}
            loading={loading}
            variant="danger"
            size="large"
            style={styles.button}
          />
        )}
      </Card>

      <Card style={styles.infoCard}>
        <Text style={styles.infoTitle}>About MEGA Backup</Text>
        <Text style={styles.infoText}>
          • Your data is encrypted and stored securely on MEGA{'\n'}
          • Backups are created manually from the Dashboard{'\n'}
          • You can restore your data anytime{'\n'}
          • Only one backup file is kept (older ones are replaced){'\n'}
          • Make sure you have a MEGA account (free or paid)
        </Text>
      </Card>

      <Card style={styles.infoCard}>
        <Text style={styles.infoTitle}>Don't have a MEGA account?</Text>
        <Text style={styles.infoText}>
          Visit mega.nz to create a free account with up to 20GB of storage.
        </Text>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  statusContainer: {
    marginTop: 16,
    alignItems: 'flex-start',
  },
  statusBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  statusText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
});

export default MegaSettingsScreen;
