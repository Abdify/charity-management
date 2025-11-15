import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useApp } from '../../contexts/AppContext';
import { Card, Button } from '../../components';
import { RootStackParamList } from '../../types';
import {
  formatCurrency,
  formatDate,
  getRecentDonations,
  getDonorStats,
} from '../../utils/helpers';
import { dropboxService } from '../../services/dropbox';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const DashboardScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { donors, projects, donations, isLoading, exportBackup, importBackup } = useApp();
  const [backupLoading, setBackupLoading] = useState(false);
  const [isDropboxConnected, setIsDropboxConnected] = useState(false);

  const stats = useMemo(() => {
    const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);
    const activeDonors = donors.filter((d) => d.status === 'active').length;
    const activeProjects = projects.filter((p) => p.status === 'active').length;

    return {
      totalDonations,
      totalDonors: donors.length,
      activeDonors,
      totalProjects: projects.length,
      activeProjects,
      totalDonationCount: donations.length,
    };
  }, [donors, projects, donations]);

  const recentDonations = useMemo(() => {
    return getRecentDonations(donations, 5);
  }, [donations]);

  // Check Dropbox connection status when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      checkDropboxStatus();
    }, [])
  );

  const checkDropboxStatus = async () => {
    const hasToken = await dropboxService.hasAccessToken();
    setIsDropboxConnected(hasToken);
  };

  const handleBackup = async () => {
    // Check if Dropbox is connected
    if (!isDropboxConnected) {
      Alert.alert(
        'Dropbox Not Connected',
        'Please connect your Dropbox account to use cloud backup.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Connect Dropbox',
            onPress: () => navigation.navigate('DropboxSettings'),
          },
        ]
      );
      return;
    }
    setBackupLoading(true);
    try {
      const data = await exportBackup();
      await dropboxService.uploadBackup(data);
      Alert.alert('Success', 'Backup uploaded to Dropbox successfully!');
    } catch (error: any) {
      console.error('Backup error:', error);
      Alert.alert(
        'Backup Failed',
        error.message || 'Failed to create backup. Please try again.'
      );
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestore = async () => {
    // Check if Dropbox is connected
    if (!isDropboxConnected) {
      Alert.alert(
        'Dropbox Not Connected',
        'Please connect your Dropbox account to restore from cloud backup.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Connect Dropbox',
            onPress: () => navigation.navigate('DropboxSettings'),
          },
        ]
      );
      return;
    }

    Alert.alert(
      'Restore Backup',
      'This will replace all current data with the backup from Dropbox. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            setBackupLoading(true);
            try {
              const data = await dropboxService.downloadBackup();
              if (data) {
                await importBackup(data);
                Alert.alert('Success', 'Data restored from Dropbox successfully!');
              } else {
                Alert.alert('Info', 'No backup found on Dropbox.');
              }
            } catch (error: any) {
              console.error('Restore error:', error);
              Alert.alert(
                'Restore Failed',
                error.message || 'Failed to restore backup. Please try again.'
              );
            } finally {
              setBackupLoading(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Quick Action */}
      <Card style={styles.quickActionCard}>
        <Text style={styles.quickActionTitle}>Quick Action</Text>
        <Button
          title="+ Add New Donation"
          onPress={() => navigation.navigate('AddDonation')}
          variant="success"
          size="large"
          style={styles.quickActionButton}
        />
      </Card>

      {/* Statistics */}
      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{formatCurrency(stats.totalDonations)}</Text>
          <Text style={styles.statLabel}>Total Donations</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalDonationCount}</Text>
          <Text style={styles.statLabel}>Donations</Text>
        </Card>
      </View>

      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{stats.activeDonors}</Text>
          <Text style={styles.statLabel}>Active Donors</Text>
          <Text style={styles.statSubLabel}>of {stats.totalDonors} total</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{stats.activeProjects}</Text>
          <Text style={styles.statLabel}>Active Projects</Text>
          <Text style={styles.statSubLabel}>of {stats.totalProjects} total</Text>
        </Card>
      </View>

      {/* Recent Donations */}
      <Card>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Donations</Text>
          {donations.length > 0 && (
            <TouchableOpacity onPress={() => navigation.navigate('AddDonation')}>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          )}
        </View>
        {recentDonations.length === 0 ? (
          <Text style={styles.emptyText}>No donations yet</Text>
        ) : (
          recentDonations.map((donation) => {
            const donor = donors.find((d) => d.id === donation.donorId);
            const project = projects.find((p) => p.id === donation.projectId);
            return (
              <View key={donation.id} style={styles.donationItem}>
                <View style={styles.donationInfo}>
                  <Text style={styles.donationDonor}>{donor?.name || 'Unknown'}</Text>
                  <Text style={styles.donationProject}>{project?.name || 'Unknown'}</Text>
                  <Text style={styles.donationDate}>{formatDate(donation.date)}</Text>
                </View>
                <Text style={styles.donationAmount}>
                  {formatCurrency(donation.amount)}
                </Text>
              </View>
            );
          })
        )}
      </Card>

      {/* Quick Links */}
      <View style={styles.quickLinksContainer}>
        <Button
          title="Manage Donors"
          onPress={() => navigation.navigate('AddDonor', {})}
          variant="secondary"
          style={styles.quickLink}
        />
        <Button
          title="Manage Projects"
          onPress={() => navigation.navigate('AddProject', {})}
          variant="secondary"
          style={styles.quickLink}
        />
      </View>

      {/* Backup & Restore */}
      <Card>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Dropbox Cloud Backup</Text>
          <TouchableOpacity onPress={() => navigation.navigate('DropboxSettings')}>
            <Text style={styles.seeAllText}>Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Dropbox Status */}
        <View style={styles.dropboxStatusContainer}>
          {isDropboxConnected ? (
            <View style={styles.dropboxConnected}>
              <Text style={styles.dropboxStatusText}>✓ Connected to Dropbox</Text>
            </View>
          ) : (
            <View style={styles.dropboxDisconnected}>
              <Text style={styles.dropboxStatusText}>⚠ Not connected</Text>
            </View>
          )}
        </View>

        <Text style={styles.backupDescription}>
          {isDropboxConnected
            ? 'Backup your data to Dropbox cloud storage and restore anytime.'
            : 'Connect to Dropbox to enable cloud backup and restore.'}
        </Text>

        <View style={styles.backupButtonsContainer}>
          <Button
            title="Backup to Dropbox"
            onPress={handleBackup}
            loading={backupLoading}
            variant="primary"
            style={styles.backupButton}
          />
          <Button
            title="Restore from Dropbox"
            onPress={handleRestore}
            loading={backupLoading}
            variant="secondary"
            style={styles.backupButton}
          />
        </View>

        {!isDropboxConnected && (
          <Button
            title="Connect to Dropbox"
            onPress={() => navigation.navigate('DropboxSettings')}
            variant="success"
            style={{ marginTop: 12 }}
          />
        )}
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
  quickActionCard: {
    backgroundColor: '#E3F2FD',
  },
  quickActionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  quickActionButton: {
    width: '100%',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2196F3',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  statSubLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  seeAllText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 16,
  },
  donationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  donationInfo: {
    flex: 1,
  },
  donationDonor: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  donationProject: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  donationDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  donationAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4CAF50',
  },
  quickLinksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickLink: {
    flex: 1,
    marginHorizontal: 4,
  },
  backupDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  backupButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  backupButton: {
    flex: 1,
  },
  dropboxStatusContainer: {
    marginBottom: 12,
  },
  dropboxConnected: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  dropboxDisconnected: {
    backgroundColor: '#FFF3E0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  dropboxStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
});

export default DashboardScreen;
