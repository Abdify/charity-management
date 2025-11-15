import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useApp } from '../../contexts/AppContext';
import { Card, Button, StatusBadge } from '../../components';
import { RootStackParamList } from '../../types';
import { formatCurrency, formatDate, getDonorStats, t } from '../../utils/helpers';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type DonorProfileRouteProp = RouteProp<RootStackParamList, 'DonorProfile'>;

const DonorProfileScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<DonorProfileRouteProp>();
  const { donors, donations, projects } = useApp();

  // Filter states
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showMonthModal, setShowMonthModal] = useState(false);

  const donor = donors.find((d) => d.id === route.params.donorId);
  const donorStats = useMemo(() => {
    return donor ? getDonorStats(donor, donations) : null;
  }, [donor, donations]);

  const donorDonations = useMemo(() => {
    return donations
      .filter((d) => d.donorId === route.params.donorId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [donations, route.params.donorId]);

  // Generate unique months from donor donations
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    donorDonations.forEach(d => {
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
  }, [donorDonations]);

  // Filtered donations
  const filteredDonations = useMemo(() => {
    return donorDonations.filter(donation => {
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
  }, [donorDonations, selectedProjectId, selectedMonth]);

  const hasActiveFilters = selectedProjectId || selectedMonth;

  const clearFilters = () => {
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
              <Text style={styles.emptyModalText}>{t('noDonations')}</Text>
            }
          />
        </View>
      </View>
    </Modal>
  );

  if (!donor || !donorStats) {
    return (
      <View style={styles.container}>
        <Text>{t('unknownDonor')}</Text>
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
          <Text style={styles.infoLabel}>{t('phoneNumber')}:</Text>
          <Text style={styles.infoValue}>{donor.phoneNumber}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t('location')}:</Text>
          <Text style={styles.infoValue}>{donor.location}</Text>
        </View>
        {donor.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.infoLabel}>{t('notes')}:</Text>
            <Text style={styles.notes}>{donor.notes}</Text>
          </View>
        )}
        <Button
          title={t('editDonor')}
          onPress={() => navigation.navigate('EditDonor', { donorId: donor.id })}
          variant="primary"
          style={styles.editButton}
        />
      </Card>

      {/* Statistics */}
      <Card>
        <Text style={styles.sectionTitle}>{t('statistics')}</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {formatCurrency(donorStats.totalDonations)}
            </Text>
            <Text style={styles.statLabel}>{t('totalDonated')}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{donorStats.donationCount}</Text>
            <Text style={styles.statLabel}>{t('donationsMade')}</Text>
          </View>
        </View>
        {donorStats.lastDonationDate && (
          <View style={styles.lastDonation}>
            <Text style={styles.infoLabel}>{t('lastDonation')}:</Text>
            <Text style={styles.infoValue}>
              {formatDate(donorStats.lastDonationDate)}
            </Text>
          </View>
        )}
      </Card>

      {/* Donation History */}
      <Card>
        <View style={styles.donationHistoryHeader}>
          <Text style={styles.sectionTitle}>{t('donationHistory')}</Text>

          {/* Filter Toggle Button */}
          <TouchableOpacity
            style={[styles.filterToggleButton, hasActiveFilters && styles.filterToggleButtonActive]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Text style={[styles.filterToggleText, hasActiveFilters && styles.filterToggleTextActive]}>
              {showFilters ? '▼' : '▶'} {t('filters')} {hasActiveFilters && `(${[selectedProjectId ? 1 : 0, selectedMonth ? 1 : 0].reduce((a, b) => a + b, 0)})`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filters Section */}
        {showFilters && (
          <View style={styles.filtersContainer}>
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

        {filteredDonations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {hasActiveFilters ? t('noDataMatchingFilters') : t('noDonations')}
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
          filteredDonations.map((donation) => {
            const project = projects.find((p) => p.id === donation.projectId);
            return (
              <View key={donation.id} style={styles.donationItem}>
                <View style={styles.donationInfo}>
                  <Text style={styles.donationProject}>
                    {project?.name || t('unknownProject')}
                  </Text>
                  <Text style={styles.donationDate}>{formatDate(donation.date)}</Text>
                  {donation.month && (
                    <Text style={styles.monthBadge}>
                      {new Date(donation.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </Text>
                  )}
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

      <ProjectModal />
      <MonthModal />
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
  donationHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterToggleButton: {
    paddingVertical: 6,
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
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  filterToggleTextActive: {
    color: '#2196F3',
  },
  filtersContainer: {
    backgroundColor: '#F5F5F5',
    marginBottom: 12,
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
  filterButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
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
  emptyContainer: {
    paddingVertical: 16,
    alignItems: 'center',
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
  emptyModalText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    padding: 24,
  },
});

export default DonorProfileScreen;
