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
import { RootStackParamList, ProjectStatus } from '../../types';

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
    }
  }, [existingProject]);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Project name is required';
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!targetAmount.trim()) {
      newErrors.targetAmount = 'Target amount is required';
    } else if (isNaN(Number(targetAmount)) || Number(targetAmount) <= 0) {
      newErrors.targetAmount = 'Please enter a valid amount';
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
        });
      } else {
        await addProject({
          name: name.trim(),
          description: description.trim(),
          targetAmount: Number(targetAmount),
          startDate: startDate.toISOString(),
          endDate: endDate?.toISOString(),
          status,
        });
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Project',
      'Are you sure you want to delete this project? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await deleteProject(projectId);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete project. Please try again.');
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
        label="Project Name *"
        value={name}
        onChangeText={setName}
        placeholder="Enter project name"
        error={errors.name}
      />

      <Input
        label="Description *"
        value={description}
        onChangeText={setDescription}
        placeholder="Enter project description"
        multiline
        numberOfLines={4}
        style={styles.descriptionInput}
        error={errors.description}
      />

      <Input
        label="Target Amount *"
        value={targetAmount}
        onChangeText={setTargetAmount}
        placeholder="Enter target amount"
        keyboardType="numeric"
        error={errors.targetAmount}
      />

      {/* Start Date */}
      <View style={styles.dateContainer}>
        <Text style={styles.label}>Start Date *</Text>
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
        <Text style={styles.label}>End Date (Optional)</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowEndDatePicker(true)}
        >
          <Text style={styles.dateText}>
            {endDate ? endDate.toLocaleDateString() : 'Not set'}
          </Text>
        </TouchableOpacity>
        {endDate && (
          <Button
            title="Clear End Date"
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

      {/* Status */}
      <View style={styles.statusContainer}>
        <Text style={styles.label}>Status</Text>
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
              Active
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
              On Hold
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
              Completed
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Button
        title={isEditing ? 'Update Project' : 'Add Project'}
        onPress={handleSave}
        loading={loading}
        variant="primary"
        size="large"
        style={styles.saveButton}
      />

      {isEditing && (
        <Button
          title="Delete Project"
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
