import React from 'react';
import { AntDesign, Feather, Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import {
  Dimensions,
  Modal,
  Text,
  TouchableOpacity,
  View,
  Animated,
  TextInput,
  Image,
  ScrollView,
  StyleSheet,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const { height } = Dimensions.get('window');

// Định nghĩa interface props rõ ràng
interface AddIssueModalProps {
  showIssueModal: boolean;
  setShowIssueModal: (show: boolean) => void;
  selectedPoint: { x: number; y: number };
  slideAnim?: Animated.Value;
  views: any[];
  currentViewIndex?: number;
  handleCloseModal: () => void;
}

export default function AddIssueModal({
  showIssueModal = false,
  setShowIssueModal,
  selectedPoint = { x: 0, y: 0 },
  slideAnim = new Animated.Value(height),
  views = [],
  currentViewIndex = 0,
  handleCloseModal,
}: AddIssueModalProps) {
  const [issueText, setIssueText] = useState('');
  const [issueType, setIssueType] = useState('structural');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const issueTypes = [
    { id: 'structural', label: 'Structural' },
    { id: 'electrical', label: 'Electrical' },
    { id: 'plumbing', label: 'Plumbing' },
    { id: 'finishing', label: 'Finishing' },
    { id: 'other', label: 'Other' },
  ];

  const handleSaveIssue = () => {
    // Here you would typically save the issue to a database
    // For now, we'll just close the modal

    // Create a new issue object
    const newIssue = {
      id: Date.now().toString(),
      type: issueType,
      description: issueText,
      image: capturedImage,
      position: selectedPoint,
      viewIndex: currentViewIndex,
      viewName: views[currentViewIndex]?.name || `View ${currentViewIndex + 1}`,
      timestamp: new Date().toISOString(),
    };

    // In a real app, you would add this to your issues state or dispatch to a store
    console.log('Saved issue:', newIssue);

    // Reset form fields
    setIssueText('');
    setIssueType('structural');
    setCapturedImage(null);

    // Close modal
    if (handleCloseModal) handleCloseModal();
  };

  const takePicture = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      alert('You need to grant camera permission to take pictures');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setCapturedImage(result.assets[0].uri);
    }
  };

  return (
    <Modal
      visible={showIssueModal}
      transparent={true}
      animationType="none"
      onRequestClose={handleCloseModal}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.modalContent,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Issue</Text>
            <TouchableOpacity onPress={handleCloseModal}>
              <AntDesign name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScrollView}>
            <Text style={styles.modalLabel}>Selected Position</Text>
            <View style={styles.coordinatesContainer}>
              <Text style={styles.coordinates}>
                X: {Math.round(selectedPoint.x)}, Y:{' '}
                {Math.round(selectedPoint.y)}
              </Text>
              <Text style={styles.viewLabel}>
                {views[currentViewIndex]?.name ||
                  `View ${currentViewIndex + 1}`}
              </Text>
            </View>

            <Text style={styles.modalLabel}>Issue Type</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.issueTypesContainer}
            >
              {issueTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.issueTypeButton,
                    issueType === type.id && styles.selectedIssueType,
                  ]}
                  onPress={() => setIssueType(type.id)}
                >
                  <Text
                    style={[
                      styles.issueTypeText,
                      issueType === type.id && styles.selectedIssueTypeText,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.modalLabel}>Description</Text>
            <TextInput
              style={styles.issueInput}
              multiline
              placeholder="Describe the issue here..."
              value={issueText}
              onChangeText={setIssueText}
            />

            <Text style={styles.modalLabel}>Photo Evidence</Text>
            {capturedImage ? (
              <View style={styles.capturedImageContainer}>
                <Image
                  source={{ uri: capturedImage }}
                  style={styles.capturedImage}
                />
                <TouchableOpacity
                  style={styles.retakeButton}
                  onPress={takePicture}
                >
                  <Feather name="camera" size={16} color="#fff" />
                  <Text style={styles.retakeButtonText}>Retake</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.takePictureButton}
                onPress={takePicture}
              >
                <Ionicons name="camera-outline" size={24} color="#fff" />
                <Text style={styles.takePictureText}>Take Picture</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCloseModal}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveIssue}
            >
              <Text style={styles.saveButtonText}>Save Issue</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
    marginBottom: 5,
  },
  modalScrollView: {
    flex: 1,
  },
  coordinatesContainer: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coordinates: {
    fontSize: 14,
    color: '#555',
    fontFamily: 'monospace',
  },
  viewLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  issueTypesContainer: {
    flexDirection: 'row',
    paddingVertical: 10,
    gap: 10,
  },
  issueTypeButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  issueTypeText: {
    fontSize: 14,
    color: '#555',
  },
  selectedIssueType: {
    backgroundColor: '#007AFF',
  },
  selectedIssueTypeText: {
    color: '#fff',
    fontWeight: '500',
  },
  issueInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 16,
    color: '#333',
  },
  takePictureButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  takePictureText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  capturedImageContainer: {
    marginTop: 10,
    position: 'relative',
  },
  capturedImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  retakeButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  retakeButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 20,
  },
  cancelButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginRight: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#555',
  },
  saveButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginLeft: 10,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
});
