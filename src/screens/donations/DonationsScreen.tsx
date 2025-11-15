import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Modal,
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

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showMonthModal, setShowMonthModal] = useState(false);

  // Generate unique months from donations
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    donations.forEach(d => {
      if (d.month) {
        monthsSet.add(d.month);
      }
    });
    return Array.from(monthsSet).sort().reverse().map(month => {
      const date = new Date(month + '-01');
      return {
        value: month,
        label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      };
    });
  }, [donations]);

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

  // Filtered donations
  const filteredDonations = useMemo(() => {
    return donationsWithDetails.filter(donation => {
      // Search filter (donor name)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const donorName = donation.donor?.name.toLowerCase() || '';
        if (!donorName.includes(query)) {
          return false;
        }
      }

      // Project filter
      if (selectedProjectId && donation.projectId !== selectedProjectId) {
        return false;
      }

      // Month filter
      if (selectedMonth && donation.month !== selectedMonth) {
        return false;
      }

      return true;
    });
  }, [donationsWithDetails, searchQuery, selectedProjectId, selectedMonth]);

  const totalAmount = useMemo(() => {
    return filteredDonations.reduce((sum, d) => sum + d.amount, 0);
  }, [filteredDonations]);

  const hasActiveFilters = searchQuery || selectedProjectId || selectedMonth;

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedProjectId('');
    setSelectedMonth('');
  };

  const ProjectModal = () => (
    <Modal
      visible={showProjectModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowProjectModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter by Project</Text>
            <TouchableOpacity onPress={() => setShowProjectModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={[{ id: '', name: 'All Projects' }, ...projects]}
            keyExtractor={(item) => item.id || 'all'}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  selectedProjectId === item.id && styles.modalItemSelected,
                ]}
                onPress={() => {
                  setSelectedProjectId(item.id);
                  setShowProjectModal(false);
                }}
              >
                <Text style={[
                  styles.modalItemText,
                  selectedProjectId === item.id && styles.modalItemTextSelected,
                ]}>
                  {item.name}
                </Text>
                {selectedProjectId === item.id && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  const MonthModal = () => (
    <Modal
      visible={showMonthModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowMonthModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter by Month</Text>
            <TouchableOpacity onPress={() => setShowMonthModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={[{ value: '', label: 'All Months' }, ...availableMonths]}
            keyExtractor={(item) => item.value || 'all'}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  selectedMonth === item.value && styles.modalItemSelected,
                ]}
                onPress={() => {
                  setSelectedMonth(item.value);
                  setShowMonthModal(false);
                }}
              >
                <Text style={[
                  styles.modalItemText,
                  selectedMonth === item.value && styles.modalItemTextSelected,
                ]}>
                  {item.label}
                </Text>
                {selectedMonth === item.value && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No monthly donations found</Text>
            }
          />
        </View>
      </View>
    </Modal>
  );

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
        <Text style={styles.summaryLabel}>
          {hasActiveFilters ? 'Filtered' : 'Total'} Donations
        </Text>
        <Text style={styles.summaryValue}>{formatCurrency(totalAmount)}</Text>
        <Text style={styles.summaryCount}>
          {filteredDonations.length} {hasActiveFilters && `of ${donations.length}`} donations
        </Text>
      </Card>

      {/* Filter Toggle Button */}
      <View style={styles.filterToggleContainer}>
        <TouchableOpacity
          style={[styles.filterToggleButton, hasActiveFilters && styles.filterToggleButtonActive]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Text style={[styles.filterToggleText, hasActiveFilters && styles.filterToggleTextActive]}>
            {showFilters ? '▼' : '▶'} Filters {hasActiveFilters && `(${[searchQuery ? 1 : 0, selectedProjectId ? 1 : 0, selectedMonth ? 1 : 0].reduce((a, b) => a + b, 0)})`}
          </Text>
        </TouchableOpacity>
        <Button
          title="+ Add"
          onPress={() => navigation.navigate('AddDonation')}
          variant="success"
          size="small"
          style={styles.addButtonSmall}
        />
      </View>

      {/* Filters Section */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          {/* Search by donor name */}
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Search Donor</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by donor name..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
          </View>

          {/* Project filter */}
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Project</Text>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowProjectModal(true)}
            >
              <Text style={styles.filterButtonText}>
                {selectedProjectId
                  ? projects.find(p => p.id === selectedProjectId)?.name || 'Select Project'
                  : 'All Projects'}
              </Text>
              <Text style={styles.filterButtonIcon}>▼</Text>
            </TouchableOpacity>
          </View>

          {/* Month filter */}
          {availableMonths.length > 0 && (
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Month</Text>
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => setShowMonthModal(true)}
              >
                <Text style={styles.filterButtonText}>
                  {selectedMonth
                    ? availableMonths.find(m => m.value === selectedMonth)?.label || 'Select Month'
                    : 'All Months'}
                </Text>
                <Text style={styles.filterButtonIcon}>▼</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Clear filters button */}
          {hasActiveFilters && (
            <Button
              title="Clear All Filters"
              onPress={clearFilters}
              variant="secondary"
              size="small"
              style={styles.clearFiltersButton}
            />
          )}
        </View>
      )}

      {/* Donations List */}
      {filteredDonations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No donations found</Text>
          <Text style={styles.emptyMessage}>
            {hasActiveFilters
              ? 'Try adjusting your filters'
              : 'Start by adding your first donation'}
          </Text>
          {hasActiveFilters && (
            <Button
              title="Clear Filters"
              onPress={clearFilters}
              variant="secondary"
              size="small"
              style={styles.clearFiltersButtonEmpty}
            />
          )}
        </View>
      ) : (
        <FlatList
          data={filteredDonations}
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
                  {item.month && (
                    <Text style={styles.monthBadge}>
                      {new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </Text>
                  )}
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
      )}

      <ProjectModal />
      <MonthModal />
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
  filterToggleContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  filterToggleButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterToggleButtonActive: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD',
  },
  filterToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterToggleTextActive: {
    color: '#2196F3',
  },
  addButtonSmall: {
    paddingHorizontal: 16,
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterItem: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  searchInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    color: '#333',
  },
  filterButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#333',
  },
  filterButtonIcon: {
    fontSize: 12,
    color: '#999',
  },
  clearFiltersButton: {
    marginTop: 4,
  },
  clearFiltersButtonEmpty: {
    marginTop: 12,
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
  monthBadge: {
    fontSize: 12,
    color: '#2196F3',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
    paddingHorizontal: 8,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalItemSelected: {
    backgroundColor: '#E3F2FD',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
  modalItemTextSelected: {
    fontWeight: '600',
    color: '#2196F3',
  },
  checkmark: {
    fontSize: 18,
    color: '#2196F3',
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    padding: 24,
  },
});

export default DonationsScreen;
