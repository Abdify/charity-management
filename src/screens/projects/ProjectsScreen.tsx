import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useApp } from '../../contexts/AppContext';
import { Card, Button, StatusBadge, EmptyState } from '../../components';
import { RootStackParamList } from '../../types';
import { searchProjects, getProjectStats, formatCurrency, t } from '../../utils/helpers';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ProjectsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { projects, donations, isLoading } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProjects = useMemo(() => {
    if (!searchQuery) return projects;
    return searchProjects(projects, searchQuery);
  }, [projects, searchQuery]);

  const projectsWithStats = useMemo(() => {
    return filteredProjects.map((project) => getProjectStats(project, donations));
  }, [filteredProjects, donations]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (projects.length === 0) {
    return (
      <EmptyState
        title={t('noProjects')}
        message={t('noProjectsMessage')}
        actionTitle={t('addProject')}
        onAction={() => navigation.navigate('AddProject', {})}
      />
    );
  }

  const calculateProgress = (current: number, target: number): number => {
    if (target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('search')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      {/* Add Button */}
      <View style={styles.addButtonContainer}>
        <Button
          title={t('addProject')}
          onPress={() => navigation.navigate('AddProject', {})}
          variant="primary"
          style={styles.addButton}
        />
      </View>

      {/* Projects List */}
      <FlatList
        data={projectsWithStats}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const progress = calculateProgress(item.currentAmount, item.targetAmount);
          return (
            <Card onPress={() => navigation.navigate('ProjectProfile', { projectId: item.id })}>
              <View style={styles.projectHeader}>
                <Text style={styles.projectName}>{item.name}</Text>
                <StatusBadge status={item.status} />
              </View>
              <Text style={styles.projectDescription} numberOfLines={2}>
                {item.description}
              </Text>

              {/* Progress Bar */}
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

              {/* Amount */}
              <View style={styles.amountContainer}>
                <View>
                  <Text style={styles.currentAmount}>
                    {formatCurrency(item.currentAmount)}
                  </Text>
                  <Text style={styles.targetAmount}>
                    {t('of')} {formatCurrency(item.targetAmount)}
                  </Text>
                </View>
              </View>

              {/* Stats */}
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{item.donorCount}</Text>
                  <Text style={styles.statLabel}>{t('donors')}</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{item.donationCount}</Text>
                  <Text style={styles.statLabel}>{t('donations')}</Text>
                </View>
              </View>
            </Card>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            title={t('noProjects')}
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
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    flex: 1,
  },
  projectDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: 45,
  },
  amountContainer: {
    marginBottom: 12,
  },
  currentAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2196F3',
  },
  targetAmount: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
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

export default ProjectsScreen;
