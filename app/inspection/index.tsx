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
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Link, useNavigation, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import northBlueprint from '../../assets/images/north-blueprint.jpg';
import eastBlueprint from '../../assets/images/east-blueprint.jpg';
import southBlueprint from '../../assets/images/south-blueprint.jpg';
import westBlueprint from '../../assets/images/west-blueprint.jpg';

interface HousePart {
  id: string;
  name: string;
  icon: string;
}

interface DetailType {
  id: string;
  name: string;
  icon: string;
}

interface Direction {
  id: string;
  name: string;
  icon: string;
}

interface IconConfig {
  shape: 'circle' | 'square' | 'triangle' | 'diamond';
  color: string;
}

// Dữ liệu mẫu
const HOUSE_PARTS: HousePart[] = [
  { id: 'roof', name: 'Mái trên', icon: 'home-roof' },
  { id: 'walls', name: 'Tường', icon: 'wall' },
  { id: 'foundation', name: 'Nền móng', icon: 'foundation' },
];

const DETAIL_TYPES: DetailType[] = [
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
const CHECKLIST_ITEMS: ChecklistItem[] = [
  // NORTH direction items (10 items)
  {
    id: 1,
    name: 'Kiểm tra độ bám dính của lớp sơn mặt Bắc',
    part: 'walls',
    detail: 'paint',
    direction: 'north',
    status: 'pending',
    photos: [],
  },
  {
    id: 2,
    name: 'Kiểm tra dấu hiệu nấm mốc trên tường',
    part: 'walls',
    detail: 'material',
    direction: 'north',
    status: 'pending',
    photos: [],
  },
  {
    id: 3,
    name: 'Kiểm tra cửa sổ mặt Bắc có bị rò rỉ không',
    part: 'walls',
    detail: 'window',
    direction: 'north',
    status: 'pending',
    photos: [],
  },
  {
    id: 4,
    name: 'Kiểm tra độ kín của cửa chính',
    part: 'walls',
    detail: 'door',
    direction: 'north',
    status: 'pending',
    photos: [],
  },
  {
    id: 5,
    name: 'Kiểm tra hệ thống thoát nước mái phía Bắc',
    part: 'roof',
    detail: 'structure',
    direction: 'north',
    status: 'pending',
    photos: [],
  },
  {
    id: 6,
    name: 'Kiểm tra độ chắc chắn của móng phía Bắc',
    part: 'foundation',
    detail: 'structure',
    direction: 'north',
    status: 'pending',
    photos: [],
  },
  {
    id: 7,
    name: 'Kiểm tra vết nứt trên tường phía Bắc',
    part: 'walls',
    detail: 'structure',
    direction: 'north',
    status: 'pending',
    photos: [],
  },
  {
    id: 8,
    name: 'Kiểm tra độ ẩm của tường phía Bắc',
    part: 'walls',
    detail: 'material',
    direction: 'north',
    status: 'pending',
    photos: [],
  },
  {
    id: 9,
    name: 'Kiểm tra trạng thái ngói mái phía Bắc',
    part: 'roof',
    detail: 'material',
    direction: 'north',
    status: 'pending',
    photos: [],
  },
  {
    id: 10,
    name: 'Kiểm tra hệ thống cách nhiệt mặt Bắc',
    part: 'walls',
    detail: 'structure',
    direction: 'north',
    status: 'pending',
    photos: [],
  },

  // EAST direction items (10 items)
  {
    id: 11,
    name: 'Kiểm tra độ phai màu sơn mặt Đông',
    part: 'walls',
    detail: 'paint',
    direction: 'east',
    status: 'pending',
    photos: [],
  },
  {
    id: 12,
    name: 'Kiểm tra kính cửa sổ phía Đông',
    part: 'walls',
    detail: 'window',
    direction: 'east',
    status: 'pending',
    photos: [],
  },
  {
    id: 13,
    name: 'Kiểm tra độ chắc chắn của cửa phía Đông',
    part: 'walls',
    detail: 'door',
    direction: 'east',
    status: 'pending',
    photos: [],
  },
  {
    id: 14,
    name: 'Kiểm tra vết nứt trên móng phía Đông',
    part: 'foundation',
    detail: 'structure',
    direction: 'east',
    status: 'pending',
    photos: [],
  },
  {
    id: 15,
    name: 'Kiểm tra tình trạng mái hiên phía Đông',
    part: 'roof',
    detail: 'structure',
    direction: 'east',
    status: 'pending',
    photos: [],
  },
  {
    id: 16,
    name: 'Kiểm tra đường ống thoát nước mưa',
    part: 'walls',
    detail: 'material',
    direction: 'east',
    status: 'pending',
    photos: [],
  },
  {
    id: 17,
    name: 'Kiểm tra tình trạng ngói mái phía Đông',
    part: 'roof',
    detail: 'material',
    direction: 'east',
    status: 'pending',
    photos: [],
  },
  {
    id: 18,
    name: 'Kiểm tra các mối nối trên tường Đông',
    part: 'walls',
    detail: 'structure',
    direction: 'east',
    status: 'pending',
    photos: [],
  },
  {
    id: 19,
    name: 'Kiểm tra độ thẳng của tường phía Đông',
    part: 'walls',
    detail: 'structure',
    direction: 'east',
    status: 'pending',
    photos: [],
  },
  {
    id: 20,
    name: 'Kiểm tra hệ thống chống thấm phía Đông',
    part: 'foundation',
    detail: 'material',
    direction: 'east',
    status: 'pending',
    photos: [],
  },

  // SOUTH direction items (10 items)
  {
    id: 21,
    name: 'Kiểm tra độ bong tróc của sơn mặt Nam',
    part: 'walls',
    detail: 'paint',
    direction: 'south',
    status: 'pending',
    photos: [],
  },
  {
    id: 22,
    name: 'Kiểm tra hệ thống che nắng cửa sổ',
    part: 'walls',
    detail: 'window',
    direction: 'south',
    status: 'pending',
    photos: [],
  },
  {
    id: 23,
    name: 'Kiểm tra độ cách nhiệt của cửa mặt Nam',
    part: 'walls',
    detail: 'door',
    direction: 'south',
    status: 'pending',
    photos: [],
  },
  {
    id: 24,
    name: 'Kiểm tra hiện tượng co ngót của móng',
    part: 'foundation',
    detail: 'structure',
    direction: 'south',
    status: 'pending',
    photos: [],
  },
  {
    id: 25,
    name: 'Kiểm tra độ cách nhiệt của mái Nam',
    part: 'roof',
    detail: 'material',
    direction: 'south',
    status: 'pending',
    photos: [],
  },
  {
    id: 26,
    name: 'Kiểm tra tình trạng của cửa ra ban công',
    part: 'walls',
    detail: 'door',
    direction: 'south',
    status: 'pending',
    photos: [],
  },
  {
    id: 27,
    name: 'Kiểm tra chất lượng gạch ốp tường',
    part: 'walls',
    detail: 'material',
    direction: 'south',
    status: 'pending',
    photos: [],
  },
  {
    id: 28,
    name: 'Kiểm tra khả năng thoát nước của mái',
    part: 'roof',
    detail: 'structure',
    direction: 'south',
    status: 'pending',
    photos: [],
  },
  {
    id: 29,
    name: 'Kiểm tra độ lún của nền phía Nam',
    part: 'foundation',
    detail: 'structure',
    direction: 'south',
    status: 'pending',
    photos: [],
  },
  {
    id: 30,
    name: 'Kiểm tra nước đọng quanh móng nhà',
    part: 'foundation',
    detail: 'material',
    direction: 'south',
    status: 'pending',
    photos: [],
  },

  // WEST direction items (10 items)
  {
    id: 31,
    name: 'Kiểm tra khả năng chống nóng của sơn',
    part: 'walls',
    detail: 'paint',
    direction: 'west',
    status: 'pending',
    photos: [],
  },
  {
    id: 32,
    name: 'Kiểm tra độ kín của cửa sổ chịu mưa',
    part: 'walls',
    detail: 'window',
    direction: 'west',
    status: 'pending',
    photos: [],
  },
  {
    id: 33,
    name: 'Kiểm tra gioăng cao su của cửa phía Tây',
    part: 'walls',
    detail: 'door',
    direction: 'west',
    status: 'pending',
    photos: [],
  },
  {
    id: 34,
    name: 'Kiểm tra thoát nước quanh móng phía Tây',
    part: 'foundation',
    detail: 'structure',
    direction: 'west',
    status: 'pending',
    photos: [],
  },
  {
    id: 35,
    name: 'Kiểm tra độ bền của vật liệu mái Tây',
    part: 'roof',
    detail: 'material',
    direction: 'west',
    status: 'pending',
    photos: [],
  },
  {
    id: 36,
    name: 'Kiểm tra khả năng chống thấm của tường',
    part: 'walls',
    detail: 'material',
    direction: 'west',
    status: 'pending',
    photos: [],
  },
  {
    id: 37,
    name: 'Kiểm tra hệ thống thoát nước mái phía Tây',
    part: 'roof',
    detail: 'structure',
    direction: 'west',
    status: 'pending',
    photos: [],
  },
  {
    id: 38,
    name: 'Kiểm tra cây cối ảnh hưởng đến móng',
    part: 'foundation',
    detail: 'material',
    direction: 'west',
    status: 'pending',
    photos: [],
  },
  {
    id: 39,
    name: 'Kiểm tra vết nứt do co giãn nhiệt',
    part: 'walls',
    detail: 'structure',
    direction: 'west',
    status: 'pending',
    photos: [],
  },
  {
    id: 40,
    name: 'Kiểm tra hệ thống chống sét trên mái',
    part: 'roof',
    detail: 'structure',
    direction: 'west',
    status: 'pending',
    photos: [],
  },
];

interface ChecklistItem {
  id: number;
  name: string;
  part: string;
  detail: string;
  direction: string; // Added direction field
  status: 'pending' | 'completed' | 'issue';
  photos: string[];
  note?: string;
}

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
  const [isInCameraMode, setIsInCameraMode] = useState(false);
  const [hasPhoto, setHasPhoto] = useState(false);
  const [overviewPhotos, setOverviewPhotos] = useState<string[]>([]);
  const [isPhotoGalleryVisible, setIsPhotoGalleryVisible] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [pinnedIcons, setPinnedIcons] = useState([]);
  const [selectedShape, setSelectedShape] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [blueprintLayout, setBlueprintLayout] = useState({
    width: 0,
    height: 0,
    x: 0,
    y: 0,
  });
  const [isPanningEnabled, setIsPanningEnabled] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const blueprintRef = useRef(null);
  const blueprintContainerRef = useRef(null);
  const blueprintImageRef = useRef(null);

  const bottomSheetAnimation = useRef(new Animated.Value(0)).current;
  const photoGalleryAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    navigation.setOptions({
      headerTransparent: true,
      headerTitle: '',
      headerBackVisible: false,
    });
  }, []);

  // Tính toán số lượng hạng mục đã kiểm tra
  const completedItems = checklist.filter(
    (item) => item.status === 'completed' || item.status === 'issue'
  ).length;
  const totalItems = checklist.length;
  const progress = Math.round((completedItems / totalItems) * 100);

  // Update the filteredChecklist function
  const filteredChecklist = checklist.filter((item) => {
    // First filter by direction
    if (item.direction !== selectedDirection) return false;

    // Then filter by part if selected
    if (selectedPart && item.part !== selectedPart) return false;

    // Finally filter by detail types if any are selected
    if (selectedDetails.length > 0 && !selectedDetails.includes(item.detail))
      return false;

    return true;
  });

  // Xử lý khi chọn/bỏ chọn chi tiết
  const toggleDetail = (detailId: string) => {
    if (selectedDetails.includes(detailId)) {
      setSelectedDetails(selectedDetails.filter((id) => id !== detailId));
    } else {
      setSelectedDetails([...selectedDetails, detailId]);
    }
  };

  useEffect(() => {
    console.log('Current filters:');
    console.log('Direction:', selectedDirection);
    console.log('Part:', selectedPart);
    console.log('Details:', selectedDetails);
    console.log('Filtered items:', filteredChecklist.length);

    // Log a sample item to verify its structure
    if (checklist.length > 0) {
      console.log('Sample item structure:', checklist[0]);
    }
  }, [selectedDirection, selectedPart, selectedDetails]);

  // Add this function to measure the blueprint dimensions
  const onBlueprintLayout = (event) => {
    const { width, height, x, y } = event.nativeEvent.layout;
    setBlueprintLayout({ width, height, x, y });
  };

  // Functions to handle zoom
  const zoomIn = () => {
    if (zoomLevel < 3) {
      setZoomLevel((prevZoom) => Math.min(prevZoom + 0.25, 3));
    }
  };

  const zoomOut = () => {
    if (zoomLevel > 1) {
      setZoomLevel((prevZoom) => {
        const newZoom = Math.max(prevZoom - 0.25, 1);
        // If zooming all the way out, reset pan offset
        if (newZoom === 1) {
          setPanOffset({ x: 0, y: 0 });
        }
        return newZoom;
      });
    }
  };

  // Xử lý khi đánh dấu hoàn thành một hạng mục
  // Update the handlePlaceIcon function with this fixed version
  // Replace the handlePlaceIcon function with this corrected version
  const handlePlaceIcon = (event) => {
    // Don't do anything if no shape is selected or if we're in pan mode
    if (!selectedShape || isPanningEnabled) return;

    // Get touch event coordinates
    const { nativeEvent } = event;
    const { locationX, locationY } = nativeEvent;

    console.log('Raw touch coordinates:', locationX, locationY);

    // Calculate the actual position on the unzoomed/unpanned blueprint
    // When we have zoom and pan, we need to:
    // 1. Adjust for the center of the blueprint (transform origin)
    // 2. Account for the current pan offset
    // 3. Account for the zoom level

    const centerX = blueprintLayout.width / 2;
    const centerY = blueprintLayout.height / 2;

    // Calculate position relative to center, accounting for pan and zoom
    const adjustedX = (locationX - centerX - panOffset.x) / zoomLevel + centerX;
    const adjustedY = (locationY - centerY - panOffset.y) / zoomLevel + centerY;

    console.log(
      'Adjusted coordinates:',
      adjustedX,
      adjustedY,
      'Zoom:',
      zoomLevel,
      'Pan:',
      panOffset.x,
      panOffset.y
    );

    // Add the icon with the corrected coordinates
    setPinnedIcons([
      ...pinnedIcons,
      {
        id: Date.now().toString(),
        shape: selectedShape.shape,
        color: selectedShape.color,
        x: adjustedX,
        y: adjustedY,
        direction: selectedDirection,
      },
    ]);

    // Reset selected shape after placing
    setSelectedShape(null);
  };

  const handlePanStart = (event) => {
    if (isPanningEnabled && zoomLevel > 1) {
      const { locationX, locationY } = event.nativeEvent;
      panStartRef.current = {
        x: locationX - panOffset.x,
        y: locationY - panOffset.y,
      };
    }
  };

  const handlePanMove = (event) => {
    if (isPanningEnabled && zoomLevel > 1) {
      const { locationX, locationY } = event.nativeEvent;

      // Calculate new pan offset
      const newX = locationX - panStartRef.current.x;
      const newY = locationY - panStartRef.current.y;

      // Calculate maximum allowed pan offset based on zoom level
      const maxPanX = (blueprintLayout.width * (zoomLevel - 1)) / 2;
      const maxPanY = (blueprintLayout.height * (zoomLevel - 1)) / 2;

      // Constrain pan offset within bounds
      const constrainedX = Math.max(-maxPanX, Math.min(maxPanX, newX));
      const constrainedY = Math.max(-maxPanY, Math.min(maxPanY, newY));

      setPanOffset({
        x: constrainedX,
        y: constrainedY,
      });
    }
  };

  const togglePanMode = () => {
    setIsPanningEnabled(!isPanningEnabled);
    // If turning off pan mode, reset pan offset
    if (isPanningEnabled) {
      setPanOffset({ x: 0, y: 0 });
    }
  };

  // Function to remove a pinned icon
  const removePinnedIcon = (iconId) => {
    setPinnedIcons(pinnedIcons.filter((icon) => icon.id !== iconId));
  };

  // Function to select a shape to be placed
  const selectShape = (shape, color) => {
    setSelectedShape({ shape, color });
  };

  const toggleItemCompletion = async (itemId: number) => {
    const updatedChecklist = checklist.map((item) => {
      if (item.id === itemId) {
        // Toggle between 'completed' and 'pending'
        const newStatus = item.status === 'completed' ? 'pending' : 'completed';
        return { ...item, status: newStatus };
      }
      return item;
    });
    setChecklist(updatedChecklist);
  };

  const markAllCompleteAndOpenCamera = () => {
    markAllAsCompleted();
    openAllOKCamera();
  };

  // Add a function to toggle camera mode
  const openAllOKCamera = async () => {
    // If we're already in camera mode, take a picture
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
      // Save the photo and set hasPhoto to true
      setOverviewPhotos([...overviewPhotos, result.assets[0].uri]);
      setHasPhoto(true);

      // Keep camera mode on after taking photo
      // We don't toggle isInCameraMode here anymore
      return;
    }

    setIsInCameraMode(true);
  };

  // Xử lý khi mở modal báo lỗi
  // Update the openIssueModal function to load the existing note
  const openIssueModal = (item) => {
    setCurrentItem(item);

    // Set note state with the existing note if it exists
    setNote(item.note || '');

    // Mở modal từ dưới lên
    Animated.timing(bottomSheetAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    setIssueModalVisible(true);
  };

  // Xử lý khi chụp dele
  // Replace your existing takePicture function with this updated version
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
      // Get the photo URI
      const photoUri = result.assets[0].uri;

      // Update the checklist with the new photo
      const updatedChecklist = checklist.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            photos: [...item.photos, photoUri],
          };
        }
        return item;
      });

      // Update the state
      setChecklist(updatedChecklist);

      // If we're in the issue modal, we need to update the currentItem too
      if (issueModalVisible && currentItem && currentItem.id === itemId) {
        setCurrentItem({
          ...currentItem,
          photos: [...currentItem.photos, photoUri],
        });
      }
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

  const getBlueprintSource = (direction: string) => {
    switch (direction) {
      case 'north':
        return northBlueprint;
      case 'east':
        return eastBlueprint;
      case 'south':
        return southBlueprint;
      case 'west':
        return westBlueprint;
      default:
        return northBlueprint; // Default to north
    }
  };

  // Add this after your existing interfaces
  interface IconConfig {
    shape: 'circle' | 'square' | 'triangle' | 'diamond';
    color: string;
  }

  // Add this mapping function after your existing constants
  const getItemIconConfig = (part: string, detail: string): IconConfig => {
    // Map combinations of part and detail to specific icons and colors
    if (part === 'roof') {
      if (detail === 'structure')
        return { shape: 'triangle', color: '#ef4444' }; // Red triangle
      if (detail === 'material') return { shape: 'square', color: '#f59e0b' }; // Yellow square
      return { shape: 'circle', color: '#3b82f6' }; // Default blue circle
    }

    if (part === 'walls') {
      if (detail === 'paint') return { shape: 'circle', color: '#10b981' }; // Green circle
      if (detail === 'structure')
        return { shape: 'triangle', color: '#8b5cf6' }; // Purple triangle
      if (detail === 'window') return { shape: 'diamond', color: '#0ea5e9' }; // Blue diamond
      if (detail === 'door') return { shape: 'square', color: '#f97316' }; // Orange square
      return { shape: 'circle', color: '#3b82f6' }; // Default blue circle
    }

    if (part === 'foundation') {
      if (detail === 'structure')
        return { shape: 'triangle', color: '#ef4444' }; // Red triangle
      return { shape: 'square', color: '#8b5cf6' }; // Default purple square
    }

    // Default icon for any other combination
    return { shape: 'circle', color: '#64748b' }; // Gray circle
  };

  const ShapeIcon = ({ shape, color, size = 16 }) => {
    switch (shape) {
      case 'circle':
        return (
          <View
            style={[
              styles.shapeIcon,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: color,
              },
            ]}
          />
        );
      case 'square':
        return (
          <View
            style={[
              styles.shapeIcon,
              { width: size, height: size, backgroundColor: color },
            ]}
          />
        );
      case 'triangle':
        return (
          <View
            style={{
              width: size + styles.shapeIcon.marginRight,
              height: size,
              overflow: 'hidden',
            }}
          >
            <View
              style={[
                styles.shapeIcon,
                styles.triangleShape,
                {
                  borderBottomColor: color,
                  borderBottomWidth: size,
                  borderLeftWidth: size / 2,
                  borderRightWidth: size / 2,
                  marginRight: 12,
                },
              ]}
            />
          </View>
        );
      case 'diamond':
        return (
          <View
            style={{
              width: size,
              height: size,
              transform: [{ rotate: '45deg' }],
              marginRight: styles.shapeIcon.marginRight,
            }}
          >
            <View
              style={[
                styles.shapeIcon,
                {
                  width: size * 0.7,
                  height: size * 0.7,
                  backgroundColor: color,
                },
              ]}
            />
          </View>
        );
      default:
        return (
          <View
            style={[
              styles.shapeIcon,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: color,
              },
            ]}
          />
        );
    }
  };

  const markAllAsCompleted = () => {
    // Get the currently filtered items based on selections
    const itemsToUpdate = filteredChecklist.map((item) => item.id);

    // Update all those items to completed status
    const updatedChecklist = checklist.map((item) => {
      if (itemsToUpdate.includes(item.id)) {
        return { ...item, status: 'completed' };
      }
      return item;
    });

    setChecklist(updatedChecklist);
  };

  const groupChecklistByDetailType = () => {
    // If no specific details selected, still group by detail type
    if (selectedDetails.length === 0) {
      // Group by detail type even when none are specifically selected
      return filteredChecklist.reduce((groups, item) => {
        const detailType = item.detail;
        if (!groups[detailType]) {
          groups[detailType] = [];
        }
        groups[detailType].push(item);
        return groups;
      }, {});
    }

    // Group by detail type (existing behavior when filters are active)
    return filteredChecklist.reduce((groups, item) => {
      const detailType = item.detail;
      if (!groups[detailType]) {
        groups[detailType] = [];
      }
      groups[detailType].push(item);
      return groups;
    }, {});
  };

  const getDetailName = (detailId) => {
    const detail = DETAIL_TYPES.find((d) => d.id === detailId);
    return detail ? detail.name : detailId;
  };

  const viewOverviewPhotos = () => {
    // Show photo gallery modal with overview photos
    setSelectedPhotos(overviewPhotos);
    setIsPhotoGalleryVisible(true);

    // Animate the modal sliding up
    Animated.timing(photoGalleryAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Add a function to exit camera mode
  const exitCameraMode = () => {
    setIsInCameraMode(false);
    setHasPhoto(false);
  };

  const openPhotoGallery = (photos: string[]) => {
    setSelectedPhotos(photos);
    setIsPhotoGalleryVisible(true);

    // Animate the modal sliding up
    Animated.timing(photoGalleryAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Update the deletePhoto function to reset hasPhoto state when needed
  // Update the deletePhoto function to properly synchronize state
  const deletePhoto = (photoUri, itemId = null) => {
    // If viewing an item's photos
    if (itemId) {
      const updatedChecklist = checklist.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            photos: item.photos.filter((uri) => uri !== photoUri),
          };
        }
        return item;
      });

      setChecklist(updatedChecklist);

      // Also update currentItem if in issue modal
      if (currentItem && currentItem.id === itemId) {
        const updatedPhotos = currentItem.photos.filter(
          (uri) => uri !== photoUri
        );
        setCurrentItem({
          ...currentItem,
          photos: updatedPhotos,
        });
      }
    }
    // If viewing overview photos
    else {
      const updatedOverviewPhotos = overviewPhotos.filter(
        (uri) => uri !== photoUri
      );
      setOverviewPhotos(updatedOverviewPhotos);
    }

    // Always update selectedPhotos state regardless of source
    const updatedSelectedPhotos = selectedPhotos.filter(
      (uri) => uri !== photoUri
    );
    setSelectedPhotos(updatedSelectedPhotos);

    // If all photos are deleted, reset hasPhoto state
    if (updatedSelectedPhotos.length === 0) {
      // If we were viewing overview photos and they're all gone
      if (
        !itemId &&
        overviewPhotos.filter((uri) => uri !== photoUri).length === 0
      ) {
        setHasPhoto(false);
      }

      // Close the photo gallery modal when all photos are deleted
      setIsPhotoGalleryVisible(false);
      photoGalleryAnimation.setValue(0);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      {/* Header */}
      {true && (
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.replace('/home')}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Kiểm tra dự án</Text>
          <TouchableOpacity>
            <Ionicons name="ellipsis-vertical" size={24} color="#1e293b" />
          </TouchableOpacity>
        </View>
      )}
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
        {/* <Text style={styles.sectionTitle}>Chọn hướng:</Text> */}
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
                size={16}
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
      {/* House Parts Selector */}
      <View style={styles.selectorContainer}>
        {/* <Text style={styles.sectionTitle}>Phần kiểm tra:</Text> */}
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
              size={16}
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
                size={16}
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
        {/* <Text style={styles.sectionTitle}>Chi tiết kiểm tra:</Text> */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {DETAIL_TYPES.map((detail: DetailType) => (
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
                size={16}
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
      {/* Blueprint */}
      <View
        style={[styles.blueprintContainer, { overflow: 'hidden' }]}
        ref={blueprintContainerRef}
        onStartShouldSetResponder={() => true}
        onTouchEnd={handlePlaceIcon}
      >
        <View style={styles.zoomControls}>
          <TouchableOpacity style={styles.zoomButton} onPress={zoomIn}>
            <Ionicons name="add-circle" size={24} color="#2563eb" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.zoomButton} onPress={zoomOut}>
            <Ionicons name="remove-circle" size={24} color="#2563eb" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.zoomButton,
              isPanningEnabled && { backgroundColor: '#dbeafe' },
            ]}
            onPress={togglePanMode}
          >
            <Ionicons
              name="hand"
              size={24}
              color={isPanningEnabled ? '#2563eb' : '#64748b'}
            />
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.blueprintImageContainer,
            {
              transform: [
                { scale: zoomLevel },
                { translateX: panOffset.x },
                { translateY: panOffset.y },
              ],
            },
          ]}
          onLayout={onBlueprintLayout}
          ref={blueprintImageRef}
          onTouchEnd={!isPanningEnabled ? handlePlaceIcon : undefined}
          onResponderGrant={handlePanStart}
          onResponderMove={handlePanMove}
          onStartShouldSetResponder={() => true}
        >
          <Image
            source={getBlueprintSource(selectedDirection)}
            style={styles.blueprint}
            resizeMode="contain"
          />

          {/* Show pinned icons for current direction */}
          {pinnedIcons
            .filter((icon) => icon.direction === selectedDirection)
            .map((icon) => {
              const centerX = blueprintLayout.width / 2;
              const centerY = blueprintLayout.height / 2;

              // Calculate the position relative to center, then apply zoom and pan
              const displayX =
                (icon.x - centerX) * zoomLevel + centerX + panOffset.x;
              const displayY =
                (icon.y - centerY) * zoomLevel + centerY + panOffset.y;

              return (
                <TouchableOpacity
                  key={icon.id}
                  style={[
                    styles.pinnedIcon,
                    {
                      left: displayX - 12,
                      top: displayY - 12,
                    },
                  ]}
                  onPress={() => removePinnedIcon(icon.id)}
                >
                  {icon.shape === 'circle' && (
                    <View
                      style={[
                        styles.pinnedCircle,
                        { backgroundColor: icon.color },
                      ]}
                    />
                  )}
                  {icon.shape === 'triangle' && (
                    <View style={styles.triangleContainer}>
                      <View
                        style={[
                          styles.pinnedTriangle,
                          {
                            borderBottomColor: icon.color,
                            borderBottomWidth: 16,
                            borderLeftWidth: 8,
                            borderRightWidth: 8,
                          },
                        ]}
                      />
                    </View>
                  )}
                  {icon.shape === 'square' && (
                    <View
                      style={[
                        styles.pinnedSquare,
                        { backgroundColor: icon.color },
                      ]}
                    />
                  )}
                  {icon.shape === 'diamond' && (
                    <View style={styles.diamondContainer}>
                      <View
                        style={[
                          styles.pinnedDiamond,
                          { backgroundColor: icon.color },
                        ]}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
        </View>

        {/* Display cursor indicator when a shape is selected */}
        {selectedShape && !isPanningEnabled && (
          <View style={styles.blueprintHelpText}>
            <Text style={styles.blueprintHelpTextContent}>
              Chọn vị trí để đặt ký hiệu
            </Text>
          </View>
        )}

        {/* Camera button - always visible */}
        {!hasPhoto && (
          <TouchableOpacity
            style={[styles.cameraButton]}
            onPress={markAllCompleteAndOpenCamera}
          >
            <Ionicons name="camera" size={16} color="white" />
            <Text style={styles.allOkText}>Tất cả OK</Text>
          </TouchableOpacity>
        )}

        {/* View Photos button - only show when in camera mode and has photos */}
        {hasPhoto && overviewPhotos.length > 0 && (
          <>
            {/* "All OK" button at bottom right */}
            <TouchableOpacity
              style={styles.allOkButton}
              onPress={openAllOKCamera}
            >
              <Ionicons name="checkmark-circle" size={16} color="white" />
              <Text style={styles.allOkText}>Tất cả OK</Text>
            </TouchableOpacity>

            {/* View Photos button at bottom left */}
            <TouchableOpacity
              style={styles.photoGalleryButton}
              onPress={viewOverviewPhotos}
            >
              <Ionicons name="images-outline" size={16} color="white" />
              <Text style={styles.allOkText}>Xem ảnh</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
      <View style={styles.shapesToolbar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.shapesContainer}
        >
          <TouchableOpacity
            style={[
              styles.shapeButton,
              selectedShape &&
                selectedShape.shape === 'circle' &&
                selectedShape.color === '#ef4444' &&
                styles.selectedShapeButton,
            ]}
            onPress={() => selectShape('circle', '#ef4444')}
          >
            <View
              style={[styles.circleShape, { backgroundColor: '#ef4444' }]}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.shapeButton,
              selectedShape &&
                selectedShape.shape === 'triangle' &&
                selectedShape.color === '#f59e0b' &&
                styles.selectedShapeButton,
            ]}
            onPress={() => selectShape('triangle', '#f59e0b')}
          >
            <View style={styles.triangleContainer}>
              <View
                style={[
                  styles.triangleShape,
                  {
                    borderBottomColor: '#f59e0b',
                    borderBottomWidth: 16,
                    borderLeftWidth: 8,
                    borderRightWidth: 8,
                  },
                ]}
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.shapeButton,
              selectedShape &&
                selectedShape.shape === 'square' &&
                selectedShape.color === '#10b981' &&
                styles.selectedShapeButton,
            ]}
            onPress={() => selectShape('square', '#10b981')}
          >
            <View
              style={[styles.squareShape, { backgroundColor: '#10b981' }]}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.shapeButton,
              selectedShape &&
                selectedShape.shape === 'diamond' &&
                selectedShape.color === '#3b82f6' &&
                styles.selectedShapeButton,
            ]}
            onPress={() => selectShape('diamond', '#3b82f6')}
          >
            <View style={styles.diamondContainer}>
              <View
                style={[styles.diamondShape, { backgroundColor: '#3b82f6' }]}
              />
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>
      {/* Checklist */}
      <View style={styles.checklistContainer}>
        <Text style={styles.sectionTitle}>Danh sách kiểm tra:</Text>

        <ScrollView style={styles.checklist}>
          {Object.entries(groupChecklistByDetailType()).map(
            ([detailType, items]) => {
              const completedCount = items.filter(
                (item) => item.status === 'completed'
              ).length;

              return (
                <View key={detailType} style={styles.checklistGroup}>
                  {/* Always show section subtitle, remove the check for 'all' */}
                  <View style={styles.checklistSubtitleContainer}>
                    <MaterialCommunityIcons
                      name={
                        DETAIL_TYPES.find((d) => d.id === detailType)?.icon ||
                        'circle'
                      }
                      size={16}
                      color="#64748b"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.checklistSubtitle}>
                      {getDetailName(detailType)}
                    </Text>

                    <View style={styles.completionCountContainer}>
                      <Text style={styles.completionCount}>
                        {completedCount}/{items.length}
                      </Text>
                    </View>
                  </View>

                  {/* Render items in this group */}
                  {items.map((item) => (
                    <View key={item.id} style={styles.checklistItem}>
                      <View style={styles.checklistHeader}>
                        <ShapeIcon
                          {...getItemIconConfig(item.part, item.detail)}
                          size={18}
                        />

                        <Text style={styles.checklistText}>{item.name}</Text>

                        {item.photos.length > 0 && (
                          <TouchableOpacity
                            style={styles.photoIndicator}
                            onPress={() => openPhotoGallery(item.photos)}
                          >
                            <Ionicons
                              name="images-outline"
                              size={20}
                              color="#2563eb"
                            />
                            <Text style={styles.photoCount}>
                              {item.photos.length}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      <View style={styles.checklistActions}>
                        {/* Action buttons remain unchanged */}
                        <TouchableOpacity
                          style={[
                            styles.actionButton,
                            item.status === 'completed'
                              ? styles.activeCheckButton
                              : styles.checkButton,
                          ]}
                          onPress={() => toggleItemCompletion(item.id)}
                        >
                          <Ionicons name="checkmark" size={20} color="white" />
                        </TouchableOpacity>

                        {item.status === 'completed' && (
                          <TouchableOpacity
                            style={[styles.actionButton, styles.photoButton]}
                            onPress={() => takePicture(item.id)}
                          >
                            <Ionicons name="camera" size={20} color="white" />
                          </TouchableOpacity>
                        )}

                        {item.status !== 'completed' && (
                          <TouchableOpacity
                            style={[styles.actionButton, styles.issueButton]}
                            onPress={() => openIssueModal(item)}
                          >
                            <Ionicons name="close" size={20} color="white" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              );
            }
          )}
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => {
              Keyboard.dismiss();
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
            >
              <View style={styles.modalHeader}>
                <View style={styles.modalHandleBar} />
                <Text style={styles.modalTitle}>Báo cáo vấn đề</Text>
                <TouchableOpacity
                  onPress={() => {
                    Keyboard.dismiss();
                    setIssueModalVisible(false);
                    bottomSheetAnimation.setValue(0);
                  }}
                >
                  <Ionicons name="close" size={24} color="#64748b" />
                </TouchableOpacity>
              </View>

              {currentItem && (
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                  <ScrollView
                    style={styles.modalBody}
                    keyboardShouldPersistTaps="handled"
                  >
                    <Text style={styles.modalItemTitle}>
                      {currentItem.name}
                    </Text>

                    <View style={styles.noteContainer}>
                      <Text style={styles.noteLabel}>Ghi chú vấn đề:</Text>
                      <View style={styles.noteInputContainer}>
                        <TextInput
                          style={styles.noteInput}
                          multiline={true}
                          placeholder="Mô tả vấn đề phát hiện..."
                          value={note}
                          onChangeText={setNote}
                          returnKeyType="done"
                          blurOnSubmit={true}
                          onSubmitEditing={Keyboard.dismiss}
                        />
                      </View>
                    </View>

                    <View style={styles.modalPhotoSection}>
                      <Text style={styles.photoLabel}>Ảnh chụp vấn đề:</Text>

                      {/* Only show ScrollView when there are photos */}
                      {currentItem?.photos?.length > 0 && (
                        <View>
                          <Text style={styles.photoGalleryLabel}>
                            Ảnh đã chụp ({currentItem.photos.length}):
                          </Text>
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.photoList}
                          >
                            {currentItem.photos.map((photo, index) => (
                              <View
                                key={index}
                                style={styles.photoThumbnailContainer}
                              >
                                <Image
                                  source={{ uri: photo }}
                                  style={styles.photoThumbnail}
                                />
                                <TouchableOpacity
                                  style={styles.deletePhotoButtonSmall}
                                  onPress={() =>
                                    deletePhoto(photo, currentItem.id)
                                  }
                                >
                                  <Ionicons
                                    name="close-circle"
                                    size={20}
                                    color="#ef4444"
                                  />
                                </TouchableOpacity>
                              </View>
                            ))}
                          </ScrollView>
                        </View>
                      )}

                      <TouchableOpacity
                        style={styles.takePictureButton}
                        onPress={() => takePicture(currentItem.id)}
                      >
                        <Ionicons name="camera" size={24} color="white" />
                        <Text style={styles.takePictureText}>Chụp ảnh</Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={styles.saveButton}
                      onPress={saveIssue}
                    >
                      <Text style={styles.saveButtonText}>Lưu vấn đề</Text>
                    </TouchableOpacity>

                    {/* Add padding at the bottom to ensure content is visible above keyboard */}
                    <View style={{ height: 100 }} />
                  </ScrollView>
                </TouchableWithoutFeedback>
              )}
            </Animated.View>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
      {/* Add this Photo Gallery Modal after the Issue Modal */}
      <Modal
        animationType="none"
        transparent={true}
        visible={isPhotoGalleryVisible}
        onRequestClose={() => {
          setIsPhotoGalleryVisible(false);
          photoGalleryAnimation.setValue(0);
        }}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            setIsPhotoGalleryVisible(false);
            photoGalleryAnimation.setValue(0);
          }}
        >
          <Animated.View
            style={[
              styles.photoGalleryContent,
              {
                transform: [
                  {
                    translateY: photoGalleryAnimation.interpolate({
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
              <Text style={styles.modalTitle}>Ảnh đã chụp</Text>
              <TouchableOpacity
                onPress={() => {
                  setIsPhotoGalleryVisible(false);
                  photoGalleryAnimation.setValue(0);
                }}
              >
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.photoGrid}>
              {selectedPhotos.map((photo, index) => (
                <View key={index} style={styles.photoContainer}>
                  <Image
                    source={{ uri: photo }}
                    style={styles.galleryPhoto}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.deletePhotoButton}
                    onPress={() => deletePhoto(photo, currentItem?.id)}
                  >
                    <Ionicons name="trash" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              ))}

              {selectedPhotos.length === 0 && (
                <View style={styles.emptyPhotosContainer}>
                  <Ionicons name="images-outline" size={48} color="#cbd5e1" />
                  <Text style={styles.emptyPhotosText}>Không có ảnh nào</Text>
                </View>
              )}
            </ScrollView>
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
    paddingTop: 70,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#f8fafc', // Match container background
    zIndex: 999999, // Ensure header is above other content
  },
  backButton: {
    zIndex: 99999999999, // Ensure it's on top of other elements
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  progressTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4, // Reduced from 8
  },
  progressText: {
    fontSize: 12,
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
    paddingVertical: 6,
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
    paddingVertical: 6,
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
    bottom: 5,
    right: 5,
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
    fontSize: 12,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeCameraButton: {
    backgroundColor: '#10b981', // Green color when in checkmark mode
  },
  selectorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  partButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
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
    paddingVertical: 6,
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
    justifyContent: 'center',
    alignContent: 'center',
    paddingHorizontal: 16,
  },
  checklist: {
    flex: 1,
  },
  checklistGroup: {
    marginBottom: 16,
  },
  checklistSubtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Changed to space-between for layout
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  checklistSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    flex: 1, // Allow text to take available space
  },
  completionCountContainer: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  completionCount: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
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
    backgroundColor: '#64748b', // Changed to a lighter color when not active
  },

  activeCheckButton: {
    backgroundColor: '#10b981', // Green color when active
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
    minHeight: 350,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalHandleBar: {
    position: 'absolute',
    top: 6,
    left: '50%',
    width: 40,
    height: 5,
    backgroundColor: '#cbd5e1',
    borderRadius: 3,
    transform: [{ translateX: -20 }],
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
    textAlign: 'center',
  },
  modalBody: {
    padding: 16,
  },
  modalItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 16,
  },
  // Add these to your StyleSheet
  photoGalleryContent: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    paddingBottom: 30,
  },
  photoContainer: {
    width: '50%',
    padding: 4,
    aspectRatio: 1,
  },
  galleryPhoto: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  noteInputContainer: {
    position: 'relative',
  },
  noteInput: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 12,
    paddingBottom: 40,
    minHeight: 100,
    textAlignVertical: 'top',
    color: '#334155',
  },
  keyboardDoneButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#2563eb',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  keyboardDoneText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 12,
  },
  noteLabel: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 8,
    fontWeight: '500',
  },
  noteInput: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 12,
    height: 100,
    textAlignVertical: 'top',
    color: '#334155',
  },
  modalPhotoSection: {
    marginBottom: 20,
  },
  photoLabel: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 8,
    fontWeight: '500',
  },
  takePictureButton: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  takePictureText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  // Add to your StyleSheet
  photoGalleryLabel: {
    fontSize: 14,
    color: '#475569',
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  photoThumbnailContainer: {
    marginRight: 8,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  photoThumbnail: {
    width: 80,
    height: 80,
  },
  photoList: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  shapeIcon: {
    marginRight: 12,
  },
  triangleShape: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  photoGalleryButton: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  exitCameraButton: {
    position: 'absolute',
    bottom: 45, // Position above the photo gallery button
    left: 5,
    backgroundColor: '#f43f5e',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  deletePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ef4444',
    borderRadius: 18,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  deletePhotoButtonSmall: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyPhotosContainer: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyPhotosText: {
    marginTop: 12,
    fontSize: 16,
    color: '#94a3b8',
  },
  shapesToolbar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    display: 'flex',
  },
  shapesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  shapesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  shapeButton: {
    alignItems: 'center',
    marginRight: 16,
  },
  selectedShapeButton: {
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  pinnedIcon: {
    position: 'absolute',
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  pinnedCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'white',
  },
  pinnedTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  pinnedSquare: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: 'white',
  },
  pinnedDiamond: {
    width: 16,
    height: 16,
    transform: [{ rotate: '45deg' }],
    borderWidth: 2,
    borderColor: 'white',
  },
  blueprintHelpText: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  blueprintHelpTextContent: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: 'white',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    fontSize: 12,
    fontWeight: '600',
  },
  shapeText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  circleShape: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  triangleContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  squareShape: {
    width: 24,
    height: 24,
  },
  diamondContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  diamondShape: {
    width: 16,
    height: 16,
    transform: [{ rotate: '45deg' }],
  },
  pinnedIconContainer: {
    zIndex: 10,
  },
  draggedIcon: {
    position: 'absolute',
    zIndex: 9999,
    opacity: 0.8,
  },
  blueprintImageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    transformOrigin: 'center',
  },
  zoomControls: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 20,
    flexDirection: 'column',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 8,
  },
  zoomButton: {
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomLevelIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 20,
  },
  zoomLevelText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1e293b',
  },
});
