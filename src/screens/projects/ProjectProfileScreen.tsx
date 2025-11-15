import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useApp } from '../../contexts/AppContext';
import { Card, Button, StatusBadge } from '../../components';
import { RootStackParamList } from '../../types';
import { formatCurrency, formatDate, getProjectStats, t } from '../../utils/helpers';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type ProjectProfileRouteProp = RouteProp<RootStackParamList, 'ProjectProfile'>;

const ProjectProfileScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ProjectProfileRouteProp>();
  const { projects, donations, donors } = useApp();

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [showMonthModal, setShowMonthModal] = useState(false);

  const project = projects.find((p) => p.id === route.params.projectId);
  const projectStats = useMemo(() => {
    return project ? getProjectStats(project, donations) : null;
  }, [project, donations]);

  const projectDonations = useMemo(() => {
    return donations
      .filter((d) => d.projectId === route.params.projectId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [donations, route.params.projectId]);

  // Generate unique months from project donations
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    projectDonations.forEach(d => {
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
  }, [projectDonations]);

  // Filtered donations
  const filteredDonations = useMemo(() => {
    return projectDonations.filter(donation => {
      // Search filter (donor name)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const donor = donors.find(d => d.id === donation.donorId);
        const donorName = donor?.name.toLowerCase() || '';
        if (!donorName.includes(query)) {
          return false;
        }
      }

      // Month filter
      if (selectedMonth && donation.month !== selectedMonth) {
        return false;
      }

      return true;
    });
  }, [projectDonations, donors, searchQuery, selectedMonth]);

  const hasActiveFilters = searchQuery || selectedMonth;

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedMonth('');
  };

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

  if (!project || !projectStats) {
    return (
      <View style={styles.container}>
        <Text>{t('unknownProject')}</Text>
      </View>
    );
  }

  const progress = project.targetAmount > 0
    ? Math.min((project.currentAmount / project.targetAmount) * 100, 100)
    : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Project Info */}
      <Card>
        <View style={styles.header}>
          <Text style={styles.name}>{project.name}</Text>
          <StatusBadge status={project.status} />
        </View>
        <Text style={styles.description}>{project.description}</Text>

        {/* Progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progress}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{progress.toFixed(0)}%</Text>
          </View>
          <View style={styles.amountRow}>
            <Text style={styles.currentAmount}>
              {formatCurrency(project.currentAmount)}
            </Text>
            <Text style={styles.targetAmount}>
              {t('of')} {formatCurrency(project.targetAmount)}
            </Text>
          </View>
        </View>

        <View style={styles.dateRow}>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>{t('startDate')}:</Text>
            <Text style={styles.dateValue}>{formatDate(project.startDate)}</Text>
          </View>
          {project.endDate && (
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>{t('endDate')}:</Text>
              <Text style={styles.dateValue}>{formatDate(project.endDate)}</Text>
            </View>
          )}
        </View>

        <Button
          title={t('editProject')}
          onPress={() => navigation.navigate('EditProject', { projectId: project.id })}
          variant="primary"
          style={styles.editButton}
        />
      </Card>

      {/* Statistics */}
      <Card>
        <Text style={styles.sectionTitle}>{t('statistics')}</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{projectStats.donorCount}</Text>
            <Text style={styles.statLabel}>{t('uniqueDonors')}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{projectStats.donationCount}</Text>
            <Text style={styles.statLabel}>{t('totalDonations')}</Text>
          </View>
        </View>
        {projectStats.lastDonationDate && (
          <View style={styles.lastDonation}>
            <Text style={styles.infoLabel}>{t('lastDonation')}:</Text>
            <Text style={styles.infoValue}>
              {formatDate(projectStats.lastDonationDate)}
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
              {showFilters ? '▼' : '▶'} {t('filters')} {hasActiveFilters && `(${[searchQuery ? 1 : 0, selectedMonth ? 1 : 0].reduce((a, b) => a + b, 0)})`}
            </Text>
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
            const donor = donors.find((d) => d.id === donation.donorId);
            return (
              <View key={donation.id} style={styles.donationItem}>
                <View style={styles.donationInfo}>
                  <Text style={styles.donationDonor}>
                    {donor?.name || t('unknownDonor')}
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
    marginBottom: 12,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    flex: 1,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 16,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#666',
    width: 50,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currentAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2196F3',
    marginRight: 8,
  },
  targetAmount: {
    fontSize: 16,
    color: '#666',
  },
  dateRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  editButton: {
    marginTop: 8,
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
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: 120,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
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
  donationDonor: {
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
  searchInput: {
    backgroundColor: '#FFFFFF',
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

export default ProjectProfileScreen;
