import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { DonorStatus, ProjectStatus } from '../types';

interface StatusBadgeProps {
  status: DonorStatus | ProjectStatus;
  style?: ViewStyle;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, style }) => {
  const getStatusColor = () => {
    switch (status) {
      case DonorStatus.ACTIVE:
      case ProjectStatus.ACTIVE:
        return '#4CAF50';
      case DonorStatus.INACTIVE:
        return '#757575';
      case ProjectStatus.COMPLETED:
        return '#2196F3';
      case ProjectStatus.ON_HOLD:
        return '#FF9800';
      default:
        return '#757575';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case DonorStatus.ACTIVE:
        return 'Active';
      case DonorStatus.INACTIVE:
        return 'Inactive';
      case ProjectStatus.ACTIVE:
        return 'Active';
      case ProjectStatus.COMPLETED:
        return 'Completed';
      case ProjectStatus.ON_HOLD:
        return 'On Hold';
      default:
        return status;
    }
  };

  return (
    <View style={[styles.badge, { backgroundColor: getStatusColor() }, style]}>
      <Text style={styles.text}>{getStatusText()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
