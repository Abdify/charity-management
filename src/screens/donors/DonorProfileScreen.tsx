import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useApp } from '../../contexts/AppContext';
import { Card, Button, StatusBadge } from '../../components';
import { RootStackParamList } from '../../types';
import { formatCurrency, formatDate, getDonorStats } from '../../utils/helpers';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type DonorProfileRouteProp = RouteProp<RootStackParamList, 'DonorProfile'>;

const DonorProfileScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<DonorProfileRouteProp>();
  const { donors, donations, projects } = useApp();

  const donor = donors.find((d) => d.id === route.params.donorId);
  const donorStats = useMemo(() => {
    return donor ? getDonorStats(donor, donations) : null;
  }, [donor, donations]);

  const donorDonations = useMemo(() => {
    return donations
      .filter((d) => d.donorId === route.params.donorId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [donations, route.params.donorId]);

  if (!donor || !donorStats) {
    return (
      <View style={styles.container}>
        <Text>Donor not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Donor Info */}
      <Card>
        <View style={styles.header}>
          <Text style={styles.name}>{donor.name}</Text>
          <StatusBadge status={donor.status} />
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phone:</Text>
          <Text style={styles.infoValue}>{donor.phoneNumber}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Location:</Text>
          <Text style={styles.infoValue}>{donor.location}</Text>
        </View>
        {donor.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.infoLabel}>Notes:</Text>
            <Text style={styles.notes}>{donor.notes}</Text>
          </View>
        )}
        <Button
          title="Edit Donor"
          onPress={() => navigation.navigate('EditDonor', { donorId: donor.id })}
          variant="primary"
          style={styles.editButton}
        />
      </Card>

      {/* Statistics */}
      <Card>
        <Text style={styles.sectionTitle}>Statistics</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {formatCurrency(donorStats.totalDonations)}
            </Text>
            <Text style={styles.statLabel}>Total Donated</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{donorStats.donationCount}</Text>
            <Text style={styles.statLabel}>Donations Made</Text>
          </View>
        </View>
        {donorStats.lastDonationDate && (
          <View style={styles.lastDonation}>
            <Text style={styles.infoLabel}>Last Donation:</Text>
            <Text style={styles.infoValue}>
              {formatDate(donorStats.lastDonationDate)}
            </Text>
          </View>
        )}
      </Card>

      {/* Donation History */}
      <Card>
        <Text style={styles.sectionTitle}>Donation History</Text>
        {donorDonations.length === 0 ? (
          <Text style={styles.emptyText}>No donations yet</Text>
        ) : (
          donorDonations.map((donation) => {
            const project = projects.find((p) => p.id === donation.projectId);
            return (
              <View key={donation.id} style={styles.donationItem}>
                <View style={styles.donationInfo}>
                  <Text style={styles.donationProject}>
                    {project?.name || 'Unknown Project'}
                  </Text>
                  <Text style={styles.donationDate}>{formatDate(donation.date)}</Text>
                  {donation.notes && (
                    <Text style={styles.donationNotes}>{donation.notes}</Text>
                  )}
                </View>
                <Text style={styles.donationAmount}>
                  {formatCurrency(donation.amount)}
                </Text>
              </View>
            );
          })
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: 80,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  notesContainer: {
    marginTop: 8,
  },
  notes: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
    lineHeight: 20,
  },
  editButton: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
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
  },
  lastDonation: {
    flexDirection: 'row',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  donationInfo: {
    flex: 1,
  },
  donationProject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  donationDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  donationNotes: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  donationAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4CAF50',
  },
});

export default DonorProfileScreen;
