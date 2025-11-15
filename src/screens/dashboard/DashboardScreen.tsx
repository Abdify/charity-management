import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
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
import { googleDriveService } from '../../services/googleDrive';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const DashboardScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { donors, projects, donations, isLoading, exportBackup, importBackup } = useApp();
  const [backupLoading, setBackupLoading] = useState(false);

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

  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      const data = await exportBackup();
      await googleDriveService.saveBackup(data);
      Alert.alert('Success', 'Backup created successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to create backup. Please try again.');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestore = async () => {
    Alert.alert(
      'Restore Backup',
      'This will replace all current data with the backup. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            setBackupLoading(true);
            try {
              const data = await googleDriveService.loadBackup();
              if (data) {
                await importBackup(data);
                Alert.alert('Success', 'Data restored successfully!');
              } else {
                Alert.alert('Info', 'No backup found.');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to restore backup. Please try again.');
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
        <Text style={styles.sectionTitle}>Backup & Restore</Text>
        <Text style={styles.backupDescription}>
          Save your data to local storage or restore from a previous backup.
        </Text>
        <View style={styles.backupButtonsContainer}>
          <Button
            title="Create Backup"
            onPress={handleBackup}
            loading={backupLoading}
            variant="primary"
            style={styles.backupButton}
          />
          <Button
            title="Restore Backup"
            onPress={handleRestore}
            loading={backupLoading}
            variant="secondary"
            style={styles.backupButton}
          />
        </View>
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
});

export default DashboardScreen;
