import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Input, Button, Card } from '../../components';
import { RootStackParamList } from '../../types';
import { dropboxService } from '../../services/dropbox';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const DropboxSettingsScreen = () => {
  const navigation = useNavigation<NavigationProp>();

  const [accessToken, setAccessToken] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [accountInfo, setAccountInfo] = useState<{ name: string; email: string } | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      setCheckingStatus(true);
      const hasToken = await dropboxService.hasAccessToken();
      setIsConnected(hasToken);

      if (hasToken) {
        const info = await dropboxService.getAccountInfo();
        setAccountInfo(info);
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!accessToken.trim()) {
      newErrors.accessToken = 'Access token is required';
    } else if (accessToken.trim().length < 20) {
      newErrors.accessToken = 'Please enter a valid Dropbox access token';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConnect = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      // Test connection first
      const isValid = await dropboxService.testConnection(accessToken.trim());

      if (!isValid) {
        Alert.alert('Connection Failed', 'Invalid access token. Please check and try again.');
        return;
      }

      // Save access token
      await dropboxService.saveAccessToken(accessToken.trim());
      const info = await dropboxService.getAccountInfo();
      setAccountInfo(info);
      setIsConnected(true);

      Alert.alert('Success', 'Successfully connected to Dropbox!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Connection error:', error);
      Alert.alert(
        'Connection Failed',
        error.message || 'Failed to connect to Dropbox. Please check your access token and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect',
      'Are you sure you want to disconnect from Dropbox? This will remove your saved access token.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await dropboxService.clearAccessToken();
              setAccessToken('');
              setIsConnected(false);
              setAccountInfo(null);
              Alert.alert('Success', 'Disconnected from Dropbox successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to disconnect. Please try again.');
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
      const isValid = await dropboxService.testConnection(accessToken.trim());

      if (isValid) {
        Alert.alert('Success', 'Connection test successful!');
      } else {
        Alert.alert('Failed', 'Connection test failed. Please check your access token.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to test connection.');
    } finally {
      setLoading(false);
    }
  };

  const openDropboxAppConsole = () => {
    Linking.openURL('https://www.dropbox.com/developers/apps');
  };

  if (checkingStatus) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Checking Dropbox status...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card>
        <Text style={styles.title}>Dropbox Cloud Storage</Text>
        <Text style={styles.description}>
          Connect your Dropbox account to automatically backup and restore your charity data to the cloud.
        </Text>

        {isConnected && accountInfo && (
          <View style={styles.statusContainer}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>✓ Connected</Text>
            </View>
            <Text style={styles.accountName}>{accountInfo.name}</Text>
            <Text style={styles.accountEmail}>{accountInfo.email}</Text>
          </View>
        )}
      </Card>

      {!isConnected && (
        <Card style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>How to get your Access Token:</Text>
          <Text style={styles.instructionStep}>1. Go to Dropbox App Console</Text>
          <Text style={styles.instructionStep}>2. Create a new app or use existing one</Text>
          <Text style={styles.instructionStep}>3. Choose "Scoped access" and "Full Dropbox"</Text>
          <Text style={styles.instructionStep}>4. Generate an access token</Text>
          <Text style={styles.instructionStep}>5. Copy and paste it below</Text>

          <Button
            title="Open Dropbox App Console"
            onPress={openDropboxAppConsole}
            variant="primary"
            style={styles.consoleButton}
          />
        </Card>
      )}

      <Card>
        <Text style={styles.sectionTitle}>
          {isConnected ? 'Access Token' : 'Enter Access Token'}
        </Text>

        <Input
          label="Dropbox Access Token"
          value={accessToken}
          onChangeText={setAccessToken}
          placeholder="Enter your Dropbox access token"
          autoCapitalize="none"
          error={errors.accessToken}
          editable={!isConnected}
          multiline
          numberOfLines={3}
          style={styles.tokenInput}
        />

        {!isConnected ? (
          <>
            <Button
              title="Connect to Dropbox"
              onPress={handleConnect}
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
            title="Disconnect from Dropbox"
            onPress={handleDisconnect}
            loading={loading}
            variant="danger"
            size="large"
            style={styles.button}
          />
        )}
      </Card>

      <Card style={styles.infoCard}>
        <Text style={styles.infoTitle}>About Dropbox Backup</Text>
        <Text style={styles.infoText}>
          • Your data is securely stored in your Dropbox account{'\n'}
          • Backups are created manually from the Dashboard{'\n'}
          • You can restore your data anytime{'\n'}
          • Only one backup file is kept (older ones are replaced){'\n'}
          • You have full control over your data
        </Text>
      </Card>

      <Card style={styles.infoCard}>
        <Text style={styles.infoTitle}>Privacy & Security</Text>
        <Text style={styles.infoText}>
          Your access token is stored securely on your device and is never shared. The token only grants access to your Dropbox account for this app.
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
  },
  statusBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  statusText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
  },
  accountEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  instructionsCard: {
    backgroundColor: '#E3F2FD',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  instructionStep: {
    fontSize: 14,
    color: '#666',
    lineHeight: 24,
    marginLeft: 8,
  },
  consoleButton: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  tokenInput: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  button: {
    marginTop: 8,
  },
  infoCard: {
    backgroundColor: '#F5F5F5',
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

export default DropboxSettingsScreen;
