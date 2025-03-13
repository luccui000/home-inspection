import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  TextInput,
  Animated,
  Pressable,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// Dữ liệu mẫu
const HOUSE_PARTS = [
  { id: 'roof', name: 'Mái trên', icon: 'home-roof' },
  { id: 'walls', name: 'Tường', icon: 'wall' },
  { id: 'foundation', name: 'Nền móng', icon: 'foundation' },
];

const DETAIL_TYPES = [
  { id: 'paint', name: 'Sơn', icon: 'format-paint' },
  { id: 'material', name: 'Vật liệu', icon: 'material-design' },
  { id: 'structure', name: 'Kết cấu', icon: 'pillar' },
  { id: 'window', name: 'Cửa sổ', icon: 'window-closed-variant' },
  { id: 'door', name: 'Cửa', icon: 'door' },
];

const DIRECTIONS = [
  { id: 'north', name: 'Bắc', icon: 'arrow-up-bold' },
  { id: 'east', name: 'Đông', icon: 'arrow-right-bold' },
  { id: 'south', name: 'Nam', icon: 'arrow-down-bold' },
  { id: 'west', name: 'Tây', icon: 'arrow-left-bold' },
];

// Dữ liệu mẫu cho checklist
const CHECKLIST_ITEMS = [
  {
    id: 1,
    name: 'Kiểm tra độ bám dính của lớp sơn',
    part: 'walls',
    detail: 'paint',
    status: 'pending',
    photos: [],
  },
  {
    id: 2,
    name: 'Kiểm tra độ đồng đều của màu sơn',
    part: 'walls',
    detail: 'paint',
    status: 'pending',
    photos: [],
  },
  {
    id: 3,
    name: 'Kiểm tra vết nứt trên tường',
    part: 'walls',
    detail: 'material',
    status: 'pending',
    photos: [],
  },
  {
    id: 4,
    name: 'Kiểm tra độ thẳng của tường',
    part: 'walls',
    detail: 'structure',
    status: 'pending',
    photos: [],
  },
  {
    id: 5,
    name: 'Kiểm tra tình trạng ngói mái',
    part: 'roof',
    detail: 'material',
    status: 'pending',
    photos: [],
  },
  {
    id: 6,
    name: 'Kiểm tra hệ thống thoát nước mái',
    part: 'roof',
    detail: 'structure',
    status: 'pending',
    photos: [],
  },
  {
    id: 7,
    name: 'Kiểm tra độ phẳng của nền',
    part: 'foundation',
    detail: 'structure',
    status: 'pending',
    photos: [],
  },
  {
    id: 8,
    name: 'Kiểm tra vết nứt trên nền',
    part: 'foundation',
    detail: 'material',
    status: 'pending',
    photos: [],
  },
  {
    id: 9,
    name: 'Kiểm tra khung cửa sổ',
    part: 'walls',
    detail: 'window',
    status: 'pending',
    photos: [],
  },
  {
    id: 10,
    name: 'Kiểm tra khung cửa ra vào',
    part: 'walls',
    detail: 'door',
    status: 'pending',
    photos: [],
  },
];

export default function InspectionScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [selectedDirection, setSelectedDirection] = useState('north');
  const [selectedPart, setSelectedPart] = useState('');
  const [selectedDetails, setSelectedDetails] = useState([]);
  const [checklist, setChecklist] = useState(CHECKLIST_ITEMS);
  const [issueModalVisible, setIssueModalVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [note, setNote] = useState('');

  const bottomSheetAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    navigation.setOptions({
      headerTransparent: true,
      headerTitle: '',
      headerBackVisible: false,
    });
  }, []);

  // Tính toán số lượng hạng mục đã kiểm tra
  const completedItems = checklist.filter(
    (item) => item.status === 'completed'
  ).length;
  const totalItems = checklist.length;
  const progress = Math.round((completedItems / totalItems) * 100);

  // Lọc checklist dựa trên phần và chi tiết đã chọn
  const filteredChecklist = checklist.filter((item) => {
    if (!selectedPart && selectedDetails.length === 0) return true;
    if (selectedPart && item.part !== selectedPart) return false;
    if (selectedDetails.length > 0 && !selectedDetails.includes(item.detail))
      return false;
    return true;
  });

  // Xử lý khi chọn/bỏ chọn chi tiết
  const toggleDetail = (detailId) => {
    if (selectedDetails.includes(detailId)) {
      setSelectedDetails(selectedDetails.filter((id) => id !== detailId));
    } else {
      setSelectedDetails([...selectedDetails, detailId]);
    }
  };

  // Xử lý khi đánh dấu hoàn thành một hạng mục
  const markItemAsCompleted = async (itemId) => {
    const updatedChecklist = checklist.map((item) => {
      if (item.id === itemId) {
        return { ...item, status: 'completed' };
      }
      return item;
    });
    setChecklist(updatedChecklist);
  };

  // Xử lý khi mở modal báo lỗi
  const openIssueModal = (item) => {
    setCurrentItem(item);
    setNote('');

    // Mở modal từ dưới lên
    Animated.timing(bottomSheetAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    setIssueModalVisible(true);
  };

  // Xử lý khi chụp ảnh
  const takePicture = async (itemId) => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      alert('Bạn cần cấp quyền truy cập máy ảnh!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      // Cập nhật ảnh cho hạng mục
      const updatedChecklist = checklist.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            photos: [...item.photos, result.assets[0].uri],
          };
        }
        return item;
      });
      setChecklist(updatedChecklist);
    }
  };

  // Xử lý khi lưu vấn đề
  const saveIssue = () => {
    const updatedChecklist = checklist.map((item) => {
      if (item.id === currentItem.id) {
        return {
          ...item,
          status: 'issue',
          note: note,
        };
      }
      return item;
    });
    setChecklist(updatedChecklist);
    setIssueModalVisible(false);
    bottomSheetAnimation.setValue(0);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kiểm tra dự án</Text>
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={24} color="#1e293b" />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTextContainer}>
          <Text style={styles.progressText}>
            Tiến độ: {completedItems}/{totalItems} hạng mục
          </Text>
          <Text style={styles.progressPercentage}>{progress}%</Text>
        </View>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>
      </View>

      {/* Direction Selector */}
      <View style={styles.directionContainer}>
        <Text style={styles.sectionTitle}>Chọn hướng:</Text>
        <View style={styles.directionButtons}>
          {DIRECTIONS.map((direction) => (
            <TouchableOpacity
              key={direction.id}
              style={[
                styles.directionButton,
                selectedDirection === direction.id &&
                  styles.selectedDirectionButton,
              ]}
              onPress={() => setSelectedDirection(direction.id)}
            >
              <MaterialCommunityIcons
                name={direction.icon}
                size={24}
                color={selectedDirection === direction.id ? 'white' : '#475569'}
              />
              <Text
                style={[
                  styles.directionText,
                  selectedDirection === direction.id &&
                    styles.selectedDirectionText,
                ]}
              >
                {direction.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Blueprint */}
      <View style={styles.blueprintContainer}>
        {/* <Image
          source={require('../assets/images/house-blueprint.png')}
          style={styles.blueprint}
          resizeMode="contain"
        /> */}
        <TouchableOpacity style={styles.allOkButton}>
          <Ionicons name="checkmark-circle" size={24} color="white" />
          <Text style={styles.allOkText}>Tất cả OK</Text>
        </TouchableOpacity>
      </View>

      {/* House Parts Selector */}
      <View style={styles.selectorContainer}>
        <Text style={styles.sectionTitle}>Phần kiểm tra:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.partButton,
              selectedPart === '' && styles.selectedPartButton,
            ]}
            onPress={() => setSelectedPart('')}
          >
            <Ionicons
              name="apps-outline"
              size={24}
              color={selectedPart === '' ? 'white' : '#475569'}
            />
            <Text
              style={[
                styles.partText,
                selectedPart === '' && styles.selectedPartText,
              ]}
            >
              Tất cả
            </Text>
          </TouchableOpacity>

          {HOUSE_PARTS.map((part) => (
            <TouchableOpacity
              key={part.id}
              style={[
                styles.partButton,
                selectedPart === part.id && styles.selectedPartButton,
              ]}
              onPress={() => setSelectedPart(part.id)}
            >
              <MaterialCommunityIcons
                name={part.icon}
                size={24}
                color={selectedPart === part.id ? 'white' : '#475569'}
              />
              <Text
                style={[
                  styles.partText,
                  selectedPart === part.id && styles.selectedPartText,
                ]}
              >
                {part.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Detail Types */}
      <View style={styles.selectorContainer}>
        <Text style={styles.sectionTitle}>Chi tiết kiểm tra:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {DETAIL_TYPES.map((detail) => (
            <TouchableOpacity
              key={detail.id}
              style={[
                styles.detailButton,
                selectedDetails.includes(detail.id) &&
                  styles.selectedDetailButton,
              ]}
              onPress={() => toggleDetail(detail.id)}
            >
              <MaterialCommunityIcons
                name={detail.icon}
                size={24}
                color={
                  selectedDetails.includes(detail.id) ? 'white' : '#475569'
                }
              />
              <Text
                style={[
                  styles.detailText,
                  selectedDetails.includes(detail.id) &&
                    styles.selectedDetailText,
                ]}
              >
                {detail.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Checklist */}
      <View style={styles.checklistContainer}>
        <Text style={styles.sectionTitle}>Danh sách kiểm tra:</Text>
        <ScrollView style={styles.checklist}>
          {filteredChecklist.map((item) => (
            <View key={item.id} style={styles.checklistItem}>
              <View style={styles.checklistHeader}>
                {item.status === 'completed' && (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color="#10b981"
                    style={styles.statusIcon}
                  />
                )}
                {item.status === 'issue' && (
                  <Ionicons
                    name="close-circle"
                    size={24}
                    color="#ef4444"
                    style={styles.statusIcon}
                  />
                )}
                {item.status === 'pending' && (
                  <Ionicons
                    name="ellipse-outline"
                    size={24}
                    color="#64748b"
                    style={styles.statusIcon}
                  />
                )}

                <Text style={styles.checklistText}>{item.name}</Text>

                {item.photos.length > 0 && (
                  <TouchableOpacity style={styles.photoIndicator}>
                    <Ionicons name="images-outline" size={20} color="#2563eb" />
                    <Text style={styles.photoCount}>{item.photos.length}</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.checklistActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.checkButton]}
                  onPress={() => markItemAsCompleted(item.id)}
                >
                  <Ionicons name="checkmark" size={20} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.photoButton]}
                  onPress={() => takePicture(item.id)}
                >
                  <Ionicons name="camera" size={20} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.issueButton]}
                  onPress={() => openIssueModal(item)}
                >
                  <Ionicons name="close" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Issue Modal */}
      <Modal
        animationType="none"
        transparent={true}
        visible={issueModalVisible}
        onRequestClose={() => {
          setIssueModalVisible(false);
          bottomSheetAnimation.setValue(0);
        }}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            setIssueModalVisible(false);
            bottomSheetAnimation.setValue(0);
          }}
        >
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [
                  {
                    translateY: bottomSheetAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [600, 0],
                    }),
                  },
                ],
              },
            ]}
            onStartShouldSetResponder={() => true}
            onResponderRelease={() => {}}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalHandleBar} />
              <Text style={styles.modalTitle}>Báo cáo vấn đề</Text>
              <TouchableOpacity
                onPress={() => {
                  setIssueModalVisible(false);
                  bottomSheetAnimation.setValue(0);
                }}
              >
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {currentItem && (
              <View style={styles.modalBody}>
                <Text style={styles.modalItemTitle}>{currentItem.name}</Text>

                <View style={styles.noteContainer}>
                  <Text style={styles.noteLabel}>Ghi chú vấn đề:</Text>
                  <TextInput
                    style={styles.noteInput}
                    multiline={true}
                    placeholder="Mô tả vấn đề phát hiện..."
                    value={note}
                    onChangeText={setNote}
                  />
                </View>

                <View style={styles.modalPhotoSection}>
                  <Text style={styles.photoLabel}>Ảnh chụp vấn đề:</Text>
                  <TouchableOpacity
                    style={styles.takePictureButton}
                    onPress={() => takePicture(currentItem.id)}
                  >
                    <Ionicons name="camera" size={24} color="white" />
                    <Text style={styles.takePictureText}>Chụp ảnh</Text>
                  </TouchableOpacity>

                  {currentItem.photos.length > 0 && (
                    <ScrollView horizontal style={styles.photoList}>
                      {currentItem.photos.map((photo, index) => (
                        <Image
                          key={index}
                          source={{ uri: photo }}
                          style={styles.photoThumbnail}
                        />
                      ))}
                    </ScrollView>
                  )}
                </View>

                <TouchableOpacity style={styles.saveButton} onPress={saveIssue}>
                  <Text style={styles.saveButtonText}>Lưu vấn đề</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    marginTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  progressTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#2563eb',
    borderRadius: 4,
  },
  directionContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#334155',
  },
  directionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  directionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginHorizontal: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  selectedDirectionButton: {
    backgroundColor: '#2563eb',
  },
  directionText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  selectedDirectionText: {
    color: 'white',
  },
  blueprintContainer: {
    height: 180,
    margin: 16,
    borderRadius: 12,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  blueprint: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  allOkButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  allOkText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 4,
  },
  selectorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  partButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    marginRight: 8,
  },
  selectedPartButton: {
    backgroundColor: '#2563eb',
  },
  partText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  selectedPartText: {
    color: 'white',
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    marginRight: 8,
  },
  selectedDetailButton: {
    backgroundColor: '#2563eb',
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  selectedDetailText: {
    color: 'white',
  },
  checklistContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  checklist: {
    flex: 1,
  },
  checklistItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checklistHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    marginRight: 8,
  },
  checklistText: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
  },
  photoIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  photoCount: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
    color: '#2563eb',
  },
  checklistActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkButton: {
    backgroundColor: '#10b981',
  },
  photoButton: {
    backgroundColor: '#6366f1',
  },
  issueButton: {
    backgroundColor: '#ef4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
  },
});
