import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useApp } from '../../contexts/AppContext';
import { Card, Button, EmptyState } from '../../components';
import { RootStackParamList } from '../../types';
import { formatCurrency, formatDate } from '../../utils/helpers';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const DonationsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { donations, donors, projects, isLoading } = useApp();

  const sortedDonations = useMemo(() => {
    return [...donations].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [donations]);

  const donationsWithDetails = useMemo(() => {
    return sortedDonations.map((donation) => ({
      ...donation,
      donor: donors.find((d) => d.id === donation.donorId),
      project: projects.find((p) => p.id === donation.projectId),
    }));
  }, [sortedDonations, donors, projects]);

  const totalAmount = useMemo(() => {
    return donations.reduce((sum, d) => sum + d.amount, 0);
  }, [donations]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (donations.length === 0) {
    return (
      <EmptyState
        title="No Donations Yet"
        message="Start tracking donations by adding your first one."
        actionTitle="Add Donation"
        onAction={() => navigation.navigate('AddDonation')}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Summary Card */}
      <Card style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Donations</Text>
        <Text style={styles.summaryValue}>{formatCurrency(totalAmount)}</Text>
        <Text style={styles.summaryCount}>{donations.length} donations recorded</Text>
      </Card>

      {/* Add Button */}
      <View style={styles.addButtonContainer}>
        <Button
          title="+ Add Donation"
          onPress={() => navigation.navigate('AddDonation')}
          variant="success"
          style={styles.addButton}
        />
      </View>

      {/* Donations List */}
      <FlatList
        data={donationsWithDetails}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Card>
            <View style={styles.donationHeader}>
              <View style={styles.donationInfo}>
                <Text style={styles.donorName}>
                  {item.donor?.name || 'Unknown Donor'}
                </Text>
                <Text style={styles.projectName}>
                  {item.project?.name || 'Unknown Project'}
                </Text>
                <Text style={styles.date}>{formatDate(item.date)}</Text>
                {item.notes && (
                  <Text style={styles.notes}>{item.notes}</Text>
                )}
              </View>
              <View style={styles.amountContainer}>
                <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
              </View>
            </View>
          </Card>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCard: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: 4,
  },
  summaryCount: {
    fontSize: 14,
    color: '#666',
  },
  addButtonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  addButton: {
    width: '100%',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  donationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  donationInfo: {
    flex: 1,
    marginRight: 12,
  },
  donorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  projectName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  notes: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  amountContainer: {
    justifyContent: 'center',
  },
  amount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4CAF50',
  },
});

export default DonationsScreen;
