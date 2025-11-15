import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useApp } from '../../contexts/AppContext';
import { Card, Button, StatusBadge, EmptyState } from '../../components';
import { RootStackParamList } from '../../types';
import { searchDonors, getDonorStats, formatCurrency, t } from '../../utils/helpers';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const DonorsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { donors, donations, isLoading } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDonors = useMemo(() => {
    if (!searchQuery) return donors;
    return searchDonors(donors, searchQuery);
  }, [donors, searchQuery]);

  const donorsWithStats = useMemo(() => {
    return filteredDonors.map((donor) => getDonorStats(donor, donations));
  }, [filteredDonors, donations]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (donors.length === 0) {
    return (
      <EmptyState
        title={t('noDonors')}
        message={t('noDonorsMessage')}
        actionTitle={t('addDonor')}
        onAction={() => navigation.navigate('AddDonor', {})}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('searchByDonorName')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      {/* Add Button */}
      <View style={styles.addButtonContainer}>
        <Button
          title={t('addDonor')}
          onPress={() => navigation.navigate('AddDonor', {})}
          variant="primary"
          style={styles.addButton}
        />
      </View>

      {/* Donors List */}
      <FlatList
        data={donorsWithStats}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Card onPress={() => navigation.navigate('DonorProfile', { donorId: item.id })}>
            <View style={styles.donorHeader}>
              <Text style={styles.donorName}>{item.name}</Text>
              <StatusBadge status={item.status} />
            </View>
            <Text style={styles.donorPhone}>{item.phoneNumber}</Text>
            <Text style={styles.donorLocation}>{item.location}</Text>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{formatCurrency(item.totalDonations)}</Text>
                <Text style={styles.statLabel}>{t('totalDonated')}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{item.donationCount}</Text>
                <Text style={styles.statLabel}>{t('donations')}</Text>
              </View>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <EmptyState
            title={t('noDonors')}
            message={t('tryAdjustingFilters')}
          />
        }
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
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  addButtonContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  addButton: {
    width: '100%',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  donorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  donorName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    flex: 1,
  },
  donorPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  donorLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  stat: {
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
});

export default DonorsScreen;
