import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Text,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useApp } from '../../contexts/AppContext';
import { Input, Button } from '../../components';
import { RootStackParamList, ProjectStatus, DonationType } from '../../types';
import { t } from '../../utils/helpers';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type AddProjectRouteProp = RouteProp<RootStackParamList, 'AddProject'>;

const AddProjectScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<AddProjectRouteProp>();
  const { projects, addProject, updateProject, deleteProject } = useApp();

  const projectId = route.params?.projectId;
  const isEditing = !!projectId;
  const existingProject = projects.find((p) => p.id === projectId);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [status, setStatus] = useState<ProjectStatus>(ProjectStatus.ACTIVE);
  const [donationType, setDonationType] = useState<DonationType>(DonationType.ONE_TIME);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (existingProject) {
      setName(existingProject.name);
      setDescription(existingProject.description);
      setTargetAmount(existingProject.targetAmount.toString());
      setStartDate(new Date(existingProject.startDate));
      setEndDate(existingProject.endDate ? new Date(existingProject.endDate) : undefined);
      setStatus(existingProject.status);
      setDonationType(existingProject.donationType || DonationType.ONE_TIME);
    }
  }, [existingProject]);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = t('projectNameRequired');
    }

    if (!description.trim()) {
      newErrors.description = t('descriptionRequired');
    }

    if (!targetAmount.trim()) {
      newErrors.targetAmount = t('targetAmountRequired');
    } else if (isNaN(Number(targetAmount)) || Number(targetAmount) <= 0) {
      newErrors.targetAmount = t('validAmountRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await updateProject(projectId, {
          name: name.trim(),
          description: description.trim(),
          targetAmount: Number(targetAmount),
          startDate: startDate.toISOString(),
          endDate: endDate?.toISOString(),
          status,
          donationType,
        });
      } else {
        await addProject({
          name: name.trim(),
          description: description.trim(),
          targetAmount: Number(targetAmount),
          startDate: startDate.toISOString(),
          endDate: endDate?.toISOString(),
          status,
          donationType,
        });
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert(t('error'), 'Failed to save project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      t('deleteProject'),
      t('deleteProjectMessage'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await deleteProject(projectId);
              navigation.goBack();
            } catch (error) {
              Alert.alert(t('error'), 'Failed to delete project. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Input
        label={`${t('projectName')} *`}
        value={name}
        onChangeText={setName}
        placeholder={t('enterProjectName')}
        error={errors.name}
      />

      <Input
        label={`${t('description')} *`}
        value={description}
        onChangeText={setDescription}
        placeholder={t('enterDescription')}
        multiline
        numberOfLines={4}
        style={styles.descriptionInput}
        error={errors.description}
      />

      <Input
        label={`${t('targetAmount')} *`}
        value={targetAmount}
        onChangeText={setTargetAmount}
        placeholder={t('enterTargetAmount')}
        keyboardType="numeric"
        error={errors.targetAmount}
      />

      {/* Start Date */}
      <View style={styles.dateContainer}>
        <Text style={styles.label}>{t('startDate')} *</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowStartDatePicker(true)}
        >
          <Text style={styles.dateText}>{startDate.toLocaleDateString()}</Text>
        </TouchableOpacity>
        {showStartDatePicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowStartDatePicker(Platform.OS === 'ios');
              if (selectedDate) {
                setStartDate(selectedDate);
              }
            }}
          />
        )}
      </View>

      {/* End Date */}
      <View style={styles.dateContainer}>
        <Text style={styles.label}>{t('endDate')} ({t('optional')})</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowEndDatePicker(true)}
        >
          <Text style={styles.dateText}>
            {endDate ? endDate.toLocaleDateString() : t('notSet')}
          </Text>
        </TouchableOpacity>
        {endDate && (
          <Button
            title={t('cancel')}
            onPress={() => setEndDate(undefined)}
            variant="secondary"
            size="small"
            style={styles.clearDateButton}
          />
        )}
        {showEndDatePicker && (
          <DateTimePicker
            value={endDate || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowEndDatePicker(Platform.OS === 'ios');
              if (selectedDate) {
                setEndDate(selectedDate);
              }
            }}
          />
        )}
      </View>

      {/* Donation Type */}
      <View style={styles.statusContainer}>
        <Text style={styles.label}>{t('donationType')} *</Text>
        <View style={styles.donationTypeButtons}>
          <TouchableOpacity
            style={[
              styles.statusButton,
              donationType === DonationType.ONE_TIME && styles.statusButtonActive,
            ]}
            onPress={() => setDonationType(DonationType.ONE_TIME)}
          >
            <Text
              style={[
                styles.statusButtonText,
                donationType === DonationType.ONE_TIME && styles.statusButtonTextActive,
              ]}
            >
              {t('oneTime')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.statusButton,
              donationType === DonationType.MONTHLY && styles.statusButtonActive,
            ]}
            onPress={() => setDonationType(DonationType.MONTHLY)}
          >
            <Text
              style={[
                styles.statusButtonText,
                donationType === DonationType.MONTHLY && styles.statusButtonTextActive,
              ]}
            >
              {t('monthly')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Status */}
      <View style={styles.statusContainer}>
        <Text style={styles.label}>{t('status')}</Text>
        <View style={styles.statusButtons}>
          <TouchableOpacity
            style={[
              styles.statusButton,
              status === ProjectStatus.ACTIVE && styles.statusButtonActive,
            ]}
            onPress={() => setStatus(ProjectStatus.ACTIVE)}
          >
            <Text
              style={[
                styles.statusButtonText,
                status === ProjectStatus.ACTIVE && styles.statusButtonTextActive,
              ]}
            >
              {t('active')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.statusButton,
              status === ProjectStatus.ON_HOLD && styles.statusButtonActive,
            ]}
            onPress={() => setStatus(ProjectStatus.ON_HOLD)}
          >
            <Text
              style={[
                styles.statusButtonText,
                status === ProjectStatus.ON_HOLD && styles.statusButtonTextActive,
              ]}
            >
              {t('onHold')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.statusButton,
              status === ProjectStatus.COMPLETED && styles.statusButtonActive,
            ]}
            onPress={() => setStatus(ProjectStatus.COMPLETED)}
          >
            <Text
              style={[
                styles.statusButtonText,
                status === ProjectStatus.COMPLETED && styles.statusButtonTextActive,
              ]}
            >
              {t('completed')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Button
        title={isEditing ? t('updateProject') : t('addProject')}
        onPress={handleSave}
        loading={loading}
        variant="primary"
        size="large"
        style={styles.saveButton}
      />

      {isEditing && (
        <Button
          title={t('deleteProject')}
          onPress={handleDelete}
          variant="danger"
          size="large"
          style={styles.deleteButton}
        />
      )}
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
  descriptionInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  dateButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  clearDateButton: {
    marginTop: 8,
  },
  statusContainer: {
    marginBottom: 24,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  donationTypeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  statusButtonTextActive: {
    color: '#FFFFFF',
  },
  saveButton: {
    marginBottom: 12,
  },
  deleteButton: {
    marginBottom: 24,
  },
});

export default AddProjectScreen;
