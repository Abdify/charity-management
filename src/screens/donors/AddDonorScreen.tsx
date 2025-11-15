import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useApp } from '../../contexts/AppContext';
import { Input, Button } from '../../components';
import { RootStackParamList, DonorStatus } from '../../types';
import { t } from '../../utils/helpers';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type AddDonorRouteProp = RouteProp<RootStackParamList, 'AddDonor'>;

const AddDonorScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<AddDonorRouteProp>();
  const { donors, addDonor, updateDonor, deleteDonor } = useApp();

  const donorId = route.params?.donorId;
  const isEditing = !!donorId;
  const existingDonor = donors.find((d) => d.id === donorId);

  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [order, setOrder] = useState('');
  const [status, setStatus] = useState<DonorStatus>(DonorStatus.ACTIVE);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (existingDonor) {
      setName(existingDonor.name);
      setPhoneNumber(existingDonor.phoneNumber);
      setLocation(existingDonor.location);
      setNotes(existingDonor.notes || '');
      setOrder(existingDonor.order?.toString() || '');
      setStatus(existingDonor.status);
    } else {
      // Auto-generate order for new donors
      const maxOrder = donors.length > 0
        ? Math.max(...donors.map(d => d.order || 0))
        : 0;
      setOrder((maxOrder + 1).toString());
    }
  }, [existingDonor, donors]);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = t('nameRequired');
    }

    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = t('phoneRequired');
    }

    if (!location.trim()) {
      newErrors.location = t('locationRequired');
    }

    if (!order.trim()) {
      newErrors.order = t('orderRequired');
    } else if (isNaN(Number(order)) || Number(order) < 1) {
      newErrors.order = t('validOrderRequired');
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
        await updateDonor(donorId, {
          name: name.trim(),
          phoneNumber: phoneNumber.trim(),
          location: location.trim(),
          notes: notes.trim() || undefined,
          order: Number(order),
          status,
        });
      } else {
        await addDonor({
          name: name.trim(),
          phoneNumber: phoneNumber.trim(),
          location: location.trim(),
          notes: notes.trim() || undefined,
          order: Number(order),
          status,
        });
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert(t('error'), 'Failed to save donor. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      t('deleteDonor'),
      t('deleteDonorMessage'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await deleteDonor(donorId);
              navigation.goBack();
            } catch (error) {
              Alert.alert(t('error'), 'Failed to delete donor. Please try again.');
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
        label={`${t('donorName')} *`}
        value={name}
        onChangeText={setName}
        placeholder={t('enterDonorName')}
        error={errors.name}
      />

      <Input
        label={`${t('phoneNumber')} *`}
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        placeholder={t('enterPhoneNumber')}
        keyboardType="phone-pad"
        error={errors.phoneNumber}
      />

      <Input
        label={`${t('location')} *`}
        value={location}
        onChangeText={setLocation}
        placeholder={t('enterLocation')}
        error={errors.location}
      />

      <Input
        label={`${t('order')} *`}
        value={order}
        onChangeText={setOrder}
        placeholder={t('enterDisplayOrder')}
        keyboardType="numeric"
        error={errors.order}
      />

      <Input
        label={`${t('notes')} (${t('optional')})`}
        value={notes}
        onChangeText={setNotes}
        placeholder={t('additionalNotes')}
        multiline
        numberOfLines={4}
        style={styles.notesInput}
      />

      <View style={styles.statusContainer}>
        <Text style={styles.label}>{t('status')}</Text>
        <View style={styles.statusButtons}>
          <TouchableOpacity
            style={[
              styles.statusButton,
              status === DonorStatus.ACTIVE && styles.statusButtonActive,
            ]}
            onPress={() => setStatus(DonorStatus.ACTIVE)}
          >
            <Text
              style={[
                styles.statusButtonText,
                status === DonorStatus.ACTIVE && styles.statusButtonTextActive,
              ]}
            >
              {t('active')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.statusButton,
              status === DonorStatus.INACTIVE && styles.statusButtonActive,
            ]}
            onPress={() => setStatus(DonorStatus.INACTIVE)}
          >
            <Text
              style={[
                styles.statusButtonText,
                status === DonorStatus.INACTIVE && styles.statusButtonTextActive,
              ]}
            >
              {t('inactive')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Button
        title={isEditing ? t('updateDonor') : t('addDonor')}
        onPress={handleSave}
        loading={loading}
        variant="primary"
        size="large"
        style={styles.saveButton}
      />

      {isEditing && (
        <Button
          title={t('deleteDonor')}
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
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  statusContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
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
    fontSize: 14,
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

export default AddDonorScreen;
