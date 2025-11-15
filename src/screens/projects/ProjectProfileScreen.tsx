import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useApp } from '../../contexts/AppContext';
import { Card, Button, StatusBadge } from '../../components';
import { RootStackParamList } from '../../types';
import { formatCurrency, formatDate, getProjectStats } from '../../utils/helpers';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type ProjectProfileRouteProp = RouteProp<RootStackParamList, 'ProjectProfile'>;

const ProjectProfileScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ProjectProfileRouteProp>();
  const { projects, donations, donors } = useApp();

  const project = projects.find((p) => p.id === route.params.projectId);
  const projectStats = useMemo(() => {
    return project ? getProjectStats(project, donations) : null;
  }, [project, donations]);

  const projectDonations = useMemo(() => {
    return donations
      .filter((d) => d.projectId === route.params.projectId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [donations, route.params.projectId]);

  if (!project || !projectStats) {
    return (
      <View style={styles.container}>
        <Text>Project not found</Text>
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
              of {formatCurrency(project.targetAmount)}
            </Text>
          </View>
        </View>

        <View style={styles.dateRow}>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Start Date:</Text>
            <Text style={styles.dateValue}>{formatDate(project.startDate)}</Text>
          </View>
          {project.endDate && (
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>End Date:</Text>
              <Text style={styles.dateValue}>{formatDate(project.endDate)}</Text>
            </View>
          )}
        </View>

        <Button
          title="Edit Project"
          onPress={() => navigation.navigate('EditProject', { projectId: project.id })}
          variant="primary"
          style={styles.editButton}
        />
      </Card>

      {/* Statistics */}
      <Card>
        <Text style={styles.sectionTitle}>Statistics</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{projectStats.donorCount}</Text>
            <Text style={styles.statLabel}>Unique Donors</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{projectStats.donationCount}</Text>
            <Text style={styles.statLabel}>Total Donations</Text>
          </View>
        </View>
        {projectStats.lastDonationDate && (
          <View style={styles.lastDonation}>
            <Text style={styles.infoLabel}>Last Donation:</Text>
            <Text style={styles.infoValue}>
              {formatDate(projectStats.lastDonationDate)}
            </Text>
          </View>
        )}
      </Card>

      {/* Donation History */}
      <Card>
        <Text style={styles.sectionTitle}>Donation History</Text>
        {projectDonations.length === 0 ? (
          <Text style={styles.emptyText}>No donations yet</Text>
        ) : (
          projectDonations.map((donation) => {
            const donor = donors.find((d) => d.id === donation.donorId);
            return (
              <View key={donation.id} style={styles.donationItem}>
                <View style={styles.donationInfo}>
                  <Text style={styles.donationDonor}>
                    {donor?.name || 'Unknown Donor'}
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
});

export default ProjectProfileScreen;
