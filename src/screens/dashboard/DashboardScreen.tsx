import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
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
  t,
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
        t('notConnected'),
        'Please connect your Dropbox account to use cloud backup.',
        [
          { text: t('cancel'), style: 'cancel' },
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
      Alert.alert(t('success'), 'Backup uploaded to Dropbox successfully!');
    } catch (error: any) {
      console.error('Backup error:', error);
      Alert.alert(
        t('error'),
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
        t('notConnected'),
        'Please connect your Dropbox account to restore from cloud backup.',
        [
          { text: t('cancel'), style: 'cancel' },
          {
            text: 'Connect Dropbox',
            onPress: () => navigation.navigate('DropboxSettings'),
          },
        ]
      );
      return;
    }

    Alert.alert(
      t('restoreFromDropbox'),
      t('areYouSure'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('restoreFromDropbox'),
          style: 'destructive',
          onPress: async () => {
            setBackupLoading(true);
            try {
              const data = await dropboxService.downloadBackup();
              if (data) {
                await importBackup(data);
                Alert.alert(t('success'), 'Data restored from Dropbox successfully!');
              } else {
                Alert.alert('Info', t('noBackupFound'));
              }
            } catch (error: any) {
              console.error('Restore error:', error);
              Alert.alert(
                t('error'),
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
      {/* Hero Section with Total Donations */}
      <View style={styles.heroCard}>
        <Text style={styles.heroIcon}>💎</Text>
        <Text style={styles.heroLabel}>{t('totalDonations')}</Text>
        <Text style={styles.heroValue}>{formatCurrency(stats.totalDonations)}</Text>
        <Text style={styles.heroSubtext}>{stats.totalDonationCount} {t('donations').toLowerCase()}</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsRow}>
        <TouchableOpacity
          style={[styles.quickActionButton, styles.quickActionPrimary]}
          onPress={() => navigation.navigate('AddDonation')}
          activeOpacity={0.8}
        >
          <Text style={styles.quickActionIcon}>💰</Text>
          <Text style={styles.quickActionText}>{t('addDonation')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickActionButton, styles.quickActionSecondary]}
          onPress={() => navigation.navigate('AddDonor', {})}
          activeOpacity={0.8}
        >
          <Text style={styles.quickActionIcon}>👥</Text>
          <Text style={styles.quickActionText}>{t('donors')}</Text>
        </TouchableOpacity>
      </View>

      {/* Statistics Grid */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.statCardBlue]}>
          <Text style={styles.statIcon}>📊</Text>
          <Text style={styles.statValue}>{stats.totalDonationCount}</Text>
          <Text style={styles.statLabel}>{t('donations')}</Text>
        </View>
        <View style={[styles.statCard, styles.statCardGreen]}>
          <Text style={styles.statIcon}>👥</Text>
          <Text style={styles.statValue}>{stats.activeDonors}</Text>
          <Text style={styles.statLabel}>{t('activeDonors')}</Text>
          <Text style={styles.statSubLabel}>{t('of')} {stats.totalDonors}</Text>
        </View>
        <View style={[styles.statCard, styles.statCardOrange]}>
          <Text style={styles.statIcon}>🎯</Text>
          <Text style={styles.statValue}>{stats.activeProjects}</Text>
          <Text style={styles.statLabel}>{t('activeProjects')}</Text>
          <Text style={styles.statSubLabel}>{t('of')} {stats.totalProjects}</Text>
        </View>
        <TouchableOpacity
          style={[styles.statCard, styles.statCardPurple]}
          onPress={() => navigation.navigate('AddProject', {})}
          activeOpacity={0.8}
        >
          <Text style={styles.statIcon}>📋</Text>
          <Text style={styles.statValue}>{stats.totalProjects}</Text>
          <Text style={styles.statLabel}>{t('projects')}</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Donations */}
      <View style={styles.recentDonationsCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionIcon}>📈</Text>
            <Text style={styles.sectionTitle}>{t('recentDonations')}</Text>
          </View>
          {donations.length > 0 && (
            <TouchableOpacity onPress={() => navigation.navigate('AddDonation')}>
              <Text style={styles.seeAllText}>{t('viewAll')} →</Text>
            </TouchableOpacity>
          )}
        </View>
        {recentDonations.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateIcon}>📭</Text>
            <Text style={styles.emptyText}>{t('noDonations')}</Text>
          </View>
        ) : (
          recentDonations.map((donation, index) => {
            const donor = donors.find((d) => d.id === donation.donorId);
            const project = projects.find((p) => p.id === donation.projectId);
            return (
              <TouchableOpacity
                key={donation.id}
                style={styles.donationItem}
                activeOpacity={0.7}
              >
                <View style={styles.donationItemLeft}>
                  <View style={[
                    styles.donationAvatar,
                    { backgroundColor: index % 3 === 0 ? '#E3F2FD' : index % 3 === 1 ? '#E8F5E9' : '#FFF3E0' }
                  ]}>
                    <Text style={styles.donationAvatarText}>
                      {(donor?.name || 'U').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.donationInfo}>
                    <Text style={styles.donationDonor}>{donor?.name || t('unknownDonor')}</Text>
                    <Text style={styles.donationProject}>🎯 {project?.name || t('unknownProject')}</Text>
                    <Text style={styles.donationDate}>📅 {formatDate(donation.date)}</Text>
                  </View>
                </View>
                <Text style={styles.donationAmount}>
                  {formatCurrency(donation.amount)}
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {/* Backup & Restore */}
      <View style={styles.backupCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionIcon}>☁️</Text>
            <Text style={styles.sectionTitle}>{t('dropboxBackup')}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('DropboxSettings')}>
            <Text style={styles.seeAllText}>⚙️ {t('settings')}</Text>
          </TouchableOpacity>
        </View>

        {/* Dropbox Status */}
        <View style={styles.dropboxStatusContainer}>
          {isDropboxConnected ? (
            <View style={styles.dropboxConnected}>
              <Text style={styles.statusIconConnected}>✓</Text>
              <Text style={styles.dropboxStatusText}>{t('connected')}</Text>
            </View>
          ) : (
            <View style={styles.dropboxDisconnected}>
              <Text style={styles.statusIconDisconnected}>⚠️</Text>
              <Text style={styles.dropboxStatusText}>{t('notConnected')}</Text>
            </View>
          )}
        </View>

        <Text style={styles.backupDescription}>
          {isDropboxConnected
            ? 'Backup your data to Dropbox cloud storage and restore anytime.'
            : 'Connect to Dropbox to enable cloud backup and restore.'}
        </Text>

        <View style={styles.backupButtonsContainer}>
          <TouchableOpacity
            style={[styles.backupButton, styles.backupButtonPrimary]}
            onPress={handleBackup}
            disabled={backupLoading}
            activeOpacity={0.8}
          >
            <Text style={styles.backupButtonIcon}>☁️</Text>
            <Text style={styles.backupButtonText}>{t('backupToDropbox')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.backupButton, styles.backupButtonSecondary]}
            onPress={handleRestore}
            disabled={backupLoading}
            activeOpacity={0.8}
          >
            <Text style={styles.backupButtonIcon}>📥</Text>
            <Text style={styles.backupButtonTextSecondary}>{t('restoreFromDropbox')}</Text>
          </TouchableOpacity>
        </View>

        {!isDropboxConnected && (
          <TouchableOpacity
            style={styles.connectButton}
            onPress={() => navigation.navigate('DropboxSettings')}
            activeOpacity={0.8}
          >
            <Text style={styles.connectButtonIcon}>🔗</Text>
            <Text style={styles.connectButtonText}>{t('cloudBackup')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
  },
  heroCard: {
    backgroundColor: '#667eea',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  heroIcon: {
    fontSize: 56,
    marginBottom: 12,
  },
  heroLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    opacity: 0.9,
    marginBottom: 8,
  },
  heroValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroSubtext: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '500',
    opacity: 0.85,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  quickActionPrimary: {
    backgroundColor: '#4CAF50',
  },
  quickActionSecondary: {
    backgroundColor: '#2196F3',
  },
  quickActionIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  statCardBlue: {
    backgroundColor: '#E3F2FD',
  },
  statCardGreen: {
    backgroundColor: '#E8F5E9',
  },
  statCardOrange: {
    backgroundColor: '#FFF3E0',
  },
  statCardPurple: {
    backgroundColor: '#F3E5F5',
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    fontWeight: '600',
  },
  statSubLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  recentDonationsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  backupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  seeAllText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
  },
  donationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  donationItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  donationAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  donationAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#555',
  },
  donationInfo: {
    flex: 1,
  },
  donationDonor: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  donationProject: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  donationDate: {
    fontSize: 12,
    color: '#999',
  },
  donationAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4CAF50',
  },
  backupDescription: {
    fontSize: 15,
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
  },
  backupButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  backupButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  backupButtonPrimary: {
    backgroundColor: '#2196F3',
  },
  backupButtonSecondary: {
    backgroundColor: '#F5F5F5',
  },
  backupButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  backupButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  backupButtonTextSecondary: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  dropboxStatusContainer: {
    marginBottom: 16,
  },
  dropboxConnected: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  dropboxDisconnected: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  statusIconConnected: {
    fontSize: 20,
    marginRight: 10,
    color: '#4CAF50',
  },
  statusIconDisconnected: {
    fontSize: 20,
    marginRight: 10,
  },
  dropboxStatusText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  connectButtonIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default DashboardScreen;
