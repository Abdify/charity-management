import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useApp } from '../../contexts/AppContext';
import { Input, Button, Card } from '../../components';
import { RootStackParamList, Donor, Project, DonationType } from '../../types';
import { formatCurrency, t } from '../../utils/helpers';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const AddDonationScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { donors, projects, addDonation } = useApp();

  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState('');
  const [showMonthModal, setShowMonthModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDonorModal, setShowDonorModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  const activeDonors = useMemo(() => {
    return donors.filter((d) => d.status === 'active');
  }, [donors]);

  const activeProjects = useMemo(() => {
    return projects.filter((p) => p.status === 'active');
  }, [projects]);

  // Generate list of months for monthly donations (current month and next 11 months)
  const monthOptions = useMemo(() => {
    const months = [];
    const today = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const monthStr = date.toISOString().substring(0, 7); // YYYY-MM format
      const monthDisplay = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      months.push({ value: monthStr, label: monthDisplay });
    }
    return months;
  }, []);

  const isMonthlyProject = selectedProject?.donationType === DonationType.MONTHLY;

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!selectedDonor) {
      newErrors.donor = t('selectDonorRequired');
    }

    if (!selectedProject) {
      newErrors.project = t('selectProjectRequired');
    }

    if (!amount.trim()) {
      newErrors.amount = t('amountRequired');
    } else if (isNaN(Number(amount)) || Number(amount) <= 0) {
      newErrors.amount = t('validAmountRequired');
    }

    // Check month for monthly donations
    if (isMonthlyProject && !selectedMonth) {
      newErrors.month = t('selectMonthRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    if (!selectedDonor || !selectedProject) {
      return;
    }

    setLoading(true);
    try {
      await addDonation({
        donorId: selectedDonor.id,
        projectId: selectedProject.id,
        amount: Number(amount),
        date: date.toISOString(),
        month: isMonthlyProject ? selectedMonth : undefined,
        notes: notes.trim() || undefined,
      });

      Alert.alert(t('success'), t('donationAddedSuccessfully'), [
        {
          text: t('addAnother'),
          onPress: () => {
            // Reset form
            setSelectedDonor(null);
            setSelectedProject(null);
            setAmount('');
            setNotes('');
            setDate(new Date());
            setSelectedMonth('');
            setErrors({});
          },
        },
        {
          text: t('done'),
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert(t('error'), 'Failed to add donation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const DonorModal = () => (
    <Modal
      visible={showDonorModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowDonorModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('selectDonor')}</Text>
            <TouchableOpacity onPress={() => setShowDonorModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={activeDonors}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setSelectedDonor(item);
                  setShowDonorModal(false);
                  setErrors({ ...errors, donor: '' });
                }}
              >
                <Text style={styles.modalItemName}>{item.name}</Text>
                <Text style={styles.modalItemDetail}>{item.phoneNumber}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>{t('noActiveDonors')}</Text>
            }
          />
          <Button
            title={t('addDonor')}
            onPress={() => {
              setShowDonorModal(false);
              navigation.navigate('AddDonor', {});
            }}
            variant="secondary"
            style={styles.modalButton}
          />
        </View>
      </View>
    </Modal>
  );

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
            <Text style={styles.modalTitle}>{t('selectProject')}</Text>
            <TouchableOpacity onPress={() => setShowProjectModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={activeProjects}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setSelectedProject(item);
                  setShowProjectModal(false);
                  setErrors({ ...errors, project: '' });
                  // Reset month when changing project
                  if (item.donationType === DonationType.MONTHLY) {
                    setSelectedMonth(monthOptions[0].value);
                  } else {
                    setSelectedMonth('');
                  }
                }}
              >
                <Text style={styles.modalItemName}>
                  {item.name}
                  {item.donationType === DonationType.MONTHLY && ` (${t('monthly')})`}
                </Text>
                <Text style={styles.modalItemDetail}>
                  {formatCurrency(item.currentAmount)} / {formatCurrency(item.targetAmount)}
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>{t('noActiveProjects')}</Text>
            }
          />
          <Button
            title={t('addProject')}
            onPress={() => {
              setShowProjectModal(false);
              navigation.navigate('AddProject', {});
            }}
            variant="secondary"
            style={styles.modalButton}
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
            <Text style={styles.modalTitle}>{t('selectMonth')}</Text>
            <TouchableOpacity onPress={() => setShowMonthModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={monthOptions}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setSelectedMonth(item.value);
                  setShowMonthModal(false);
                  setErrors({ ...errors, month: '' });
                }}
              >
                <Text style={styles.modalItemName}>{item.label}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Donor Selection */}
      <View style={styles.section}>
        <Text style={styles.label}>{t('donor')} *</Text>
        <TouchableOpacity
          style={[
            styles.selectionButton,
            errors.donor ? styles.selectionButtonError : null,
          ]}
          onPress={() => setShowDonorModal(true)}
        >
          {selectedDonor ? (
            <View>
              <Text style={styles.selectedText}>{selectedDonor.name}</Text>
              <Text style={styles.selectedSubtext}>{selectedDonor.phoneNumber}</Text>
            </View>
          ) : (
            <Text style={styles.placeholderText}>{t('selectDonor')}</Text>
          )}
        </TouchableOpacity>
        {errors.donor && <Text style={styles.errorText}>{errors.donor}</Text>}
      </View>

      {/* Project Selection */}
      <View style={styles.section}>
        <Text style={styles.label}>{t('project')} *</Text>
        <TouchableOpacity
          style={[
            styles.selectionButton,
            errors.project ? styles.selectionButtonError : null,
          ]}
          onPress={() => setShowProjectModal(true)}
        >
          {selectedProject ? (
            <View>
              <Text style={styles.selectedText}>{selectedProject.name}</Text>
              <Text style={styles.selectedSubtext}>
                {formatCurrency(selectedProject.currentAmount)} / {formatCurrency(selectedProject.targetAmount)}
              </Text>
            </View>
          ) : (
            <Text style={styles.placeholderText}>{t('selectProject')}</Text>
          )}
        </TouchableOpacity>
        {errors.project && <Text style={styles.errorText}>{errors.project}</Text>}
      </View>

      {/* Amount */}
      <Input
        label={`${t('amount')} *`}
        value={amount}
        onChangeText={setAmount}
        placeholder={t('enterAmount')}
        keyboardType="numeric"
        error={errors.amount}
      />

      {/* Month (only for monthly projects) */}
      {isMonthlyProject && (
        <View style={styles.section}>
          <Text style={styles.label}>{t('month')} *</Text>
          <TouchableOpacity
            style={[
              styles.selectionButton,
              errors.month ? styles.selectionButtonError : null,
            ]}
            onPress={() => setShowMonthModal(true)}
          >
            {selectedMonth ? (
              <Text style={styles.selectedText}>
                {monthOptions.find(m => m.value === selectedMonth)?.label || selectedMonth}
              </Text>
            ) : (
              <Text style={styles.placeholderText}>{t('selectDonationMonth')}</Text>
            )}
          </TouchableOpacity>
          {errors.month && <Text style={styles.errorText}>{errors.month}</Text>}
        </View>
      )}

      {/* Date */}
      <View style={styles.section}>
        <Text style={styles.label}>{t('date')} *</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateText}>{date.toLocaleDateString()}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selectedDate) {
                setDate(selectedDate);
              }
            }}
          />
        )}
      </View>

      {/* Notes */}
      <Input
        label={`${t('notes')} (${t('optional')})`}
        value={notes}
        onChangeText={setNotes}
        placeholder={t('additionalNotes')}
        multiline
        numberOfLines={3}
        style={styles.notesInput}
      />

      {/* Summary Card */}
      {selectedDonor && selectedProject && amount && !isNaN(Number(amount)) && (
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{t('summary')}</Text>
          <Text style={styles.summaryText}>
            <Text style={styles.summaryBold}>{selectedDonor.name}</Text> {t('isDonating')}{' '}
            <Text style={styles.summaryBold}>{formatCurrency(Number(amount))}</Text> {t('to')}{' '}
            <Text style={styles.summaryBold}>{selectedProject.name}</Text>
          </Text>
        </Card>
      )}

      {/* Save Button */}
      <Button
        title={t('saveDonation')}
        onPress={handleSave}
        loading={loading}
        variant="success"
        size="large"
        style={styles.saveButton}
      />

      <DonorModal />
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
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  selectionButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 60,
    justifyContent: 'center',
  },
  selectionButtonError: {
    borderColor: '#F44336',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
  selectedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  selectedSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 4,
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
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  summaryCard: {
    backgroundColor: '#E3F2FD',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  summaryBold: {
    fontWeight: '700',
    color: '#2196F3',
  },
  saveButton: {
    marginBottom: 24,
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
    maxHeight: '80%',
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  modalItemDetail: {
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    padding: 24,
  },
  modalButton: {
    marginHorizontal: 16,
    marginTop: 8,
  },
});

export default AddDonationScreen;
