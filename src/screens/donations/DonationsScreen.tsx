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
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useApp } from '../../contexts/AppContext';
import { Card, Button, EmptyState } from '../../components';
import { RootStackParamList } from '../../types';
import { formatCurrency, formatDate, t } from '../../utils/helpers';

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
            <Text style={styles.modalTitle}>{t('filterByProject')}</Text>
            <TouchableOpacity onPress={() => setShowProjectModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={[{ id: '', name: t('allProjects') }, ...projects]}
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
            <Text style={styles.modalTitle}>{t('filterByMonth')}</Text>
            <TouchableOpacity onPress={() => setShowMonthModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={[{ value: '', label: t('allMonths') }, ...availableMonths]}
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
              <Text style={styles.emptyText}>{t('noDonations')}</Text>
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
        title={t('noDonations')}
        message={t('noDonationsMessage')}
        actionTitle={t('addDonation')}
        onAction={() => navigation.navigate('AddDonation')}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Summary Card with Gradient */}
      <View style={styles.summaryCardGradient}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryIcon}>💰</Text>
          <Text style={styles.summaryLabel}>
            {hasActiveFilters ? t('filteredDonations') : t('totalDonations')}
          </Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalAmount)}</Text>
          <Text style={styles.summaryCount}>
            {filteredDonations.length} {hasActiveFilters && `${t('of')} ${donations.length}`} {t('donations').toLowerCase()}
          </Text>
        </Card>
      </View>

      {/* Filter Toggle Button */}
      <View style={styles.filterToggleContainer}>
        <TouchableOpacity
          style={[styles.filterToggleButton, hasActiveFilters && styles.filterToggleButtonActive]}
          onPress={() => setShowFilters(!showFilters)}
          activeOpacity={0.7}
        >
          <Text style={styles.filterIcon}>🔍</Text>
          <Text style={[styles.filterToggleText, hasActiveFilters && styles.filterToggleTextActive]}>
            {t('filters')} {hasActiveFilters && `(${[searchQuery ? 1 : 0, selectedProjectId ? 1 : 0, selectedMonth ? 1 : 0].reduce((a, b) => a + b, 0)})`}
          </Text>
          <Text style={styles.filterArrow}>{showFilters ? '▼' : '▶'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddDonation')}
          activeOpacity={0.8}
        >
          <Text style={styles.addButtonIcon}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Filters Section */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          {/* Search by donor name */}
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>{t('searchDonor')}</Text>
            <TextInput
              style={styles.searchInput}
              placeholder={t('searchByDonorName')}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
          </View>

          {/* Project filter */}
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>{t('project')}</Text>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowProjectModal(true)}
            >
              <Text style={styles.filterButtonText}>
                {selectedProjectId
                  ? projects.find(p => p.id === selectedProjectId)?.name || t('selectProject')
                  : t('allProjects')}
              </Text>
              <Text style={styles.filterButtonIcon}>▼</Text>
            </TouchableOpacity>
          </View>

          {/* Month filter */}
          {availableMonths.length > 0 && (
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>{t('month')}</Text>
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => setShowMonthModal(true)}
              >
                <Text style={styles.filterButtonText}>
                  {selectedMonth
                    ? availableMonths.find(m => m.value === selectedMonth)?.label || t('selectMonth')
                    : t('allMonths')}
                </Text>
                <Text style={styles.filterButtonIcon}>▼</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Clear filters button */}
          {hasActiveFilters && (
            <Button
              title={t('clearAllFilters')}
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
          <Text style={styles.emptyTitle}>{t('noDonationsFound')}</Text>
          <Text style={styles.emptyMessage}>
            {hasActiveFilters
              ? t('tryAdjustingFilters')
              : t('noDonationsMessage')}
          </Text>
          {hasActiveFilters && (
            <Button
              title={t('clearFilters')}
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
          renderItem={({ item, index }) => (
            <TouchableOpacity activeOpacity={0.9}>
              <View style={styles.donationCard}>
                <View style={[styles.donationColorBar, { backgroundColor: index % 3 === 0 ? '#4CAF50' : index % 3 === 1 ? '#2196F3' : '#FF9800' }]} />
                <View style={styles.donationContent}>
                  <View style={styles.donationHeader}>
                    <View style={styles.donationInfo}>
                      <View style={styles.donorRow}>
                        <Text style={styles.donorIcon}>👤</Text>
                        <Text style={styles.donorName}>
                          {item.donor?.name || t('unknownDonor')}
                        </Text>
                      </View>
                      <View style={styles.projectRow}>
                        <Text style={styles.projectIcon}>🎯</Text>
                        <Text style={styles.projectName}>
                          {item.project?.name || t('unknownProject')}
                        </Text>
                      </View>
                      <View style={styles.dateRow}>
                        <Text style={styles.dateIcon}>📅</Text>
                        <Text style={styles.date}>{formatDate(item.date)}</Text>
                      </View>
                      {item.month && (
                        <View style={styles.monthBadgeContainer}>
                          <Text style={styles.monthBadge}>
                            {new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                          </Text>
                        </View>
                      )}
                      {item.notes && (
                        <Text style={styles.notes}>{item.notes}</Text>
                      )}
                    </View>
                    <View style={styles.amountContainer}>
                      <Text style={styles.amountLabel}>Amount</Text>
                      <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
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
    backgroundColor: '#F0F4F8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
  },
  summaryCardGradient: {
    margin: 16,
    marginBottom: 12,
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  summaryCard: {
    backgroundColor: '#667eea',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  summaryIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 8,
    fontWeight: '600',
    opacity: 0.9,
  },
  summaryValue: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  summaryCount: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '500',
    opacity: 0.85,
  },
  filterToggleContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  filterToggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  filterToggleButtonActive: {
    backgroundColor: '#E3F2FD',
    ...Platform.select({
      ios: {
        shadowColor: '#2196F3',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  filterIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  filterToggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  filterToggleTextActive: {
    color: '#2196F3',
  },
  filterArrow: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  addButtonIcon: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  filterItem: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  searchInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    color: '#333',
  },
  filterButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterButtonText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  filterButtonIcon: {
    fontSize: 12,
    color: '#999',
  },
  clearFiltersButton: {
    marginTop: 8,
  },
  clearFiltersButtonEmpty: {
    marginTop: 16,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  donationCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  donationColorBar: {
    width: 5,
  },
  donationContent: {
    flex: 1,
    padding: 16,
  },
  donationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  donationInfo: {
    flex: 1,
    marginRight: 16,
  },
  donorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  donorIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  donorName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
    flex: 1,
  },
  projectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  projectIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  projectName: {
    fontSize: 15,
    color: '#555',
    fontWeight: '500',
    flex: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateIcon: {
    fontSize: 12,
    marginRight: 8,
  },
  date: {
    fontSize: 13,
    color: '#888',
  },
  monthBadgeContainer: {
    marginTop: 4,
  },
  monthBadge: {
    fontSize: 12,
    color: '#2196F3',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'flex-start',
    fontWeight: '600',
  },
  notes: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  amountContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  amount: {
    fontSize: 22,
    fontWeight: '700',
    color: '#4CAF50',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: 32,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  closeButton: {
    fontSize: 28,
    color: '#999',
    paddingHorizontal: 8,
    lineHeight: 28,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  modalItemSelected: {
    backgroundColor: '#E3F2FD',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  modalItemTextSelected: {
    fontWeight: '600',
    color: '#2196F3',
  },
  checkmark: {
    fontSize: 20,
    color: '#2196F3',
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
    padding: 32,
  },
});

export default DonationsScreen;
