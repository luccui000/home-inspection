import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  GestureResponderEvent,
  ActivityIndicator,
  Modal,
  Text,
  TextInput,
  ScrollView,
  Image,
} from 'react-native';
import { AntDesign, MaterialIcons, Entypo } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  PinchGestureHandler,
  PanGestureHandler,
  State,
} from 'react-native-gesture-handler';
import { View as IView } from '@/app/types/type';

// Đảm bảo đường dẫn import là chính xác

const { width, height } = Dimensions.get('window');

interface ScanViewProps {
  views: Array<IView>;
}

// First, update the interfaces to track issues with each marker
interface MarkerPoint {
  x: number;
  y: number;
  viewIndex: number;
  id: string; // Unique identifier for each marker
  issues: IssueData[];
  category?: string; // Primary issue category that determines the icon
}

// Update your IssueData interface if needed
interface IssueData {
  type: string;
  description: string;
  image?: string;
}

// Add this near the top with other interfaces
const ISSUE_CATEGORIES = [
  {
    name: 'Structural',
    issues: [
      'Foundation Cracks',
      'Wall Damage',
      'Ceiling Damage',
      'Floor Issues',
      'Beam Problems',
    ],
  },
  {
    name: 'Plumbing',
    issues: [
      'Water Leak',
      'Pipe Damage',
      'Drainage Issues',
      'Fixture Problems',
      'Water Pressure',
    ],
  },
  {
    name: 'Electrical',
    issues: [
      'Wiring Issues',
      'Outlet Problems',
      'Lighting Issues',
      'Circuit Breaker',
      'Power Outage',
    ],
  },
  {
    name: 'Other',
    issues: ['General Maintenance', 'Safety Concerns', 'Miscellaneous'],
  },
];

// Replace the ISSUE_ICONS constant with a shapes mapping
const ISSUE_SHAPES = {
  Structural: {
    type: 'square',
    color: '#bd4f23', // brick/orange color
  },
  Plumbing: {
    type: 'circle',
    color: '#4169e1', // royal blue
  },
  Electrical: {
    type: 'triangle',
    color: '#ffd700', // gold/yellow
  },
  Other: {
    type: 'hexagon',
    color: '#ff3b30', // red
  },
};

export default function ScanView({ views }: ScanViewProps) {
  // Giữ nguyên các state hiện có
  const [currentViewIndex, setCurrentViewIndex] = useState(0);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState({ x: 0, y: 0 });
  const slideAnim = useRef(new Animated.Value(height)).current;
  const [issueType, setIssueType] = useState('');
  const [issueDescription, setIssueDescription] = useState('');

  // Add these new state variables at the beginning of your component
  const [markerHistory, setMarkerHistory] = useState<MarkerPoint[][]>([]);
  const [maxHistorySteps, setMaxHistorySteps] = useState(10); // Default 10 steps undo

  // Add this state variable with the other state declarations
  const [issues, setIssues] = useState<IssueData[]>([]);

  // Add a new state for search functionality
  const [searchQuery, setSearchQuery] = useState('');

  // State zoom
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const baseScale = useRef(1);
  const pinchScale = useRef(new Animated.Value(1)).current;
  const [scaleValue, setScaleValue] = useState(1);

  // Thay đổi: Sử dụng Animated.Value cho focal points
  const translateX = useRef(new Animated.Value(0));
  const translateY = useRef(new Animated.Value(0));
  const focalX = useRef(new Animated.Value(0)).current;
  const focalY = useRef(new Animated.Value(0)).current;

  // Refs để theo dõi giá trị cuối cùng
  const lastTranslateX = useRef(0);
  const lastTranslateY = useRef(0);
  const lastScale = useRef(1);
  const lastDistance = useRef(0);
  const lastFocalX = useRef(0);
  const lastFocalY = useRef(0);

  const MAX_ZOOM = 5;
  const MIN_ZOOM = 1;
  const ZOOM_STEP = 0.5;

  const handleZoomIn = () => {
    if (baseScale.current < MAX_ZOOM) {
      baseScale.current = Math.min(baseScale.current + ZOOM_STEP, MAX_ZOOM);
      setZoomLevel(baseScale.current);
      setIsZoomed(baseScale.current > 1);
      setScaleValue(baseScale.current);
    }
  };

  const handleZoomOut = () => {
    if (baseScale.current > MIN_ZOOM) {
      baseScale.current = Math.max(baseScale.current - ZOOM_STEP, MIN_ZOOM);
      setZoomLevel(baseScale.current);
      setIsZoomed(baseScale.current > 1);
      setScaleValue(baseScale.current);

      // Khi thu nhỏ về min zoom, reset translate
      if (baseScale.current === MIN_ZOOM) {
        translateX.current.setValue(0);
        translateY.current.setValue(0);
        lastTranslateX.current = 0;
        lastTranslateY.current = 0;
      }
    }
  };

  // Thêm state cho việc loading ảnh và cache đã load
  const [isImageLoading, setIsImageLoading] = useState(true);
  const loadedImages = useRef<Set<string>>(new Set()).current;

  // Cập nhật các handlers chuyển ảnh
  const handlePrevView = useCallback(() => {
    const newIndex =
      currentViewIndex === 0 ? views.length - 1 : currentViewIndex - 1;
    const nextImageUrl = views[newIndex].image;

    // Chỉ hiển thị loading khi ảnh chưa được tải
    if (!loadedImages.has(nextImageUrl)) {
      setIsImageLoading(true);
    }

    setCurrentViewIndex(newIndex);
  }, [currentViewIndex, views, loadedImages]);

  const handleNextView = useCallback(() => {
    const newIndex =
      currentViewIndex === views.length - 1 ? 0 : currentViewIndex + 1;
    const nextImageUrl = views[newIndex].image;

    // Chỉ hiển thị loading khi ảnh chưa được tải
    if (!loadedImages.has(nextImageUrl)) {
      setIsImageLoading(true);
    }

    setCurrentViewIndex(newIndex);
  }, [currentViewIndex, views, loadedImages]);

  // Xử lý khi ảnh được tải
  const handleImageLoad = useCallback(() => {
    const currentImageUrl = views[currentViewIndex].image;
    loadedImages.add(currentImageUrl);
    setIsImageLoading(false);
  }, [currentViewIndex, views]);

  // Cập nhật lại state loading khi chuyển ảnh
  useEffect(() => {
    const currentImageUrl = views[currentViewIndex].image;
    // Nếu ảnh đã tải trước đó, không hiển thị loading
    if (loadedImages.has(currentImageUrl)) {
      setIsImageLoading(false);
    }
  }, [currentViewIndex, loadedImages, views]);

  // State để theo dõi các điểm đã click
  const [markerPoints, setMarkerPoints] = useState<MarkerPoint[]>([]);
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);

  // Add a state to track if we're in "edit marker" mode
  const [editingMarker, setEditingMarker] = useState(false);

  // Add this state to track potential new marker position
  const [pendingMarkerPosition, setPendingMarkerPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Tính toán tỷ lệ giữa tọa độ click và tọa độ thực tế trên ảnh
  const getOriginalCoordinates = (
    x: number,
    y: number,
    scale: number,
    translateX: number,
    translateY: number
  ) => {
    // Tính toán tọa độ gốc dựa trên scale và translate hiện tại
    const centerX = width / 2;
    const centerY = height / 2;

    // Tính toạ độ tương đối so với trung tâm
    const relX = (x - centerX - translateX) / scale;
    const relY = (y - centerY - translateY) / scale;

    // Trả về tọa độ gốc (cộng với trung tâm để có tọa độ tuyệt đối)
    return {
      x: relX + centerX,
      y: relY + centerY,
    };
  };

  // Tính toạ độ hiển thị của marker dựa trên tỷ lệ phóng to và vị trí pan
  const getDisplayCoordinates = (
    x: number,
    y: number,
    scale: number,
    translateX: number,
    translateY: number
  ) => {
    // Tính toán tọa độ hiển thị dựa trên scale và translate hiện tại
    const centerX = width / 2;
    const centerY = height / 2;

    // Tính toạ độ tương đối so với trung tâm
    const relX = x - centerX;
    const relY = y - centerY;

    // Trả về tọa độ hiển thị sau khi áp dụng scale và translate
    return {
      x: centerX + relX * scale + translateX,
      y: centerY + relY * scale + translateY,
    };
  };

  // Fix the saveHistoryState function to properly preserve the marker state
  const saveHistoryState = () => {
    setMarkerHistory((prev) => {
      // Create a deep copy of current markers
      const currentState = JSON.parse(JSON.stringify(markerPoints));

      // Add to history and limit number of steps
      const newHistory = [...prev, currentState];
      if (newHistory.length > maxHistorySteps) {
        return newHistory.slice(newHistory.length - maxHistorySteps);
      }
      return newHistory;
    });
  };

  // Fix the handleUndo function to properly handle the history
  const handleUndo = () => {
    if (markerHistory.length > 0) {
      // Get the previous state (second to last item in history)
      const previousState = markerHistory[markerHistory.length - 1];

      // Update markers to previous state
      setMarkerPoints(previousState);

      // Remove the restored state from history
      setMarkerHistory((prev) => prev.slice(0, prev.length - 1));
    }
  };

  // Update handleBlueprintPress to store position but not create marker yet
  const handleBlueprintPress = (event: GestureResponderEvent) => {
    const { locationX, locationY } = event.nativeEvent;

    // Store absolute coordinates
    const absoluteX = locationX;
    const absoluteY = locationY;

    // Check if user clicked on an existing marker
    const clickedMarker = findMarkerAtPoint(absoluteX, absoluteY);

    if (clickedMarker) {
      // Edit existing marker
      setActiveMarkerId(clickedMarker.id);
      setSelectedPoint({ x: clickedMarker.x, y: clickedMarker.y });
      setIssues([...clickedMarker.issues]);
      setEditingMarker(true);
      setPendingMarkerPosition(null); // No pending marker when editing
    } else {
      // Store coordinates for potential new marker but don't create it yet
      setSelectedPoint({ x: absoluteX, y: absoluteY });
      setPendingMarkerPosition({ x: absoluteX, y: absoluteY });
      setEditingMarker(false);
      setActiveMarkerId(null);
    }

    // Show modal
    setShowIssueModal(true);

    // Animate showing modal
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Helper function to find if user clicked on an existing marker
  const findMarkerAtPoint = (x: number, y: number) => {
    const clickThreshold = 10; // Reduced from 15 to 10

    return markerPoints.find(
      (marker) =>
        marker.viewIndex === currentViewIndex &&
        Math.abs(marker.x - x) < clickThreshold &&
        Math.abs(marker.y - y) < clickThreshold
    );
  };

  // Generate a unique ID for each marker
  const generateUniqueId = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  };

  // Sửa onPinchGestureEvent để sử dụng Animated.Value cho focal points
  const onPinchGestureEvent = Animated.event(
    [
      {
        nativeEvent: {
          scale: pinchScale,
          focalX: focalX,
          focalY: focalY,
        },
      },
    ],
    { useNativeDriver: false }
  );

  useEffect(() => {
    // Theo dõi thay đổi của focalX/Y
    const focalXListener = focalX.addListener(({ value }) => {
      lastFocalX.current = value;
    });

    const focalYListener = focalY.addListener(({ value }) => {
      lastFocalY.current = value;
    });

    // Theo dõi thay đổi của pinchScale
    const pinchListener = pinchScale.addListener(({ value }) => {
      // Cập nhật scale value dựa trên pinchScale * baseScale
      const newScaleValue = value * baseScale.current;
      setScaleValue(newScaleValue);

      // Chỉ tính toán translation khi có focal point và scale thay đổi
      if (
        lastFocalX.current > 0 &&
        lastFocalY.current > 0 &&
        lastScale.current !== value
      ) {
        const focX = lastFocalX.current;
        const focY = lastFocalY.current;

        // Tính toán tỷ lệ thay đổi scale
        const changeRatio = value / lastScale.current;

        // Tính toán focal point trong hệ toạ độ gốc (trung tâm màn hình)
        const centerX = width / 2;
        const centerY = height / 2;

        // Tính vị trí tương đối của focal point so với trung tâm sau khi đã áp dụng translation
        const relativeX = focX - centerX - lastTranslateX.current;
        const relativeY = focY - centerY - lastTranslateY.current;

        // Tính toán lượng dịch chuyển cần thiết để giữ focal point cố định
        const dx = relativeX - relativeX * changeRatio;
        const dy = relativeY - relativeY * changeRatio;

        // Áp dụng dịch chuyển mới
        translateX.current.setValue(lastTranslateX.current + dx);
        translateY.current.setValue(lastTranslateY.current + dy);
      }

      lastScale.current = value;
    });

    return () => {
      // Clean up listeners
      pinchScale.removeListener(pinchListener);
      focalX.removeListener(focalXListener);
      focalY.removeListener(focalYListener);
    };
  }, []);

  const onPinchHandlerStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      // Khi gesture kết thúc, cập nhật baseScale
      const newScale = baseScale.current * event.nativeEvent.scale;
      baseScale.current = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newScale));
      setZoomLevel(baseScale.current);
      setIsZoomed(baseScale.current > 1);
      setScaleValue(baseScale.current);

      // Lưu lại trạng thái translation hiện tại
      lastTranslateX.current = 0;
      lastTranslateY.current = 0;

      // Reset pinchScale về 1 cho lần pinch tiếp theo
      pinchScale.setValue(1);

      // Nếu thu nhỏ về mức tối thiểu, reset translate về giữa
      if (baseScale.current === MIN_ZOOM) {
        translateX.current.setValue(0);
        translateY.current.setValue(0);
        lastTranslateX.current = 0;
        lastTranslateY.current = 0;
      }
    } else if (event.nativeEvent.state === State.BEGAN) {
      // Ghi lại vị trí bắt đầu của gesture
      lastFocalX.current = event.nativeEvent.focalX;
      lastFocalY.current = event.nativeEvent.focalY;

      // Đặt focalX/Y Animated.Value để bắt đầu theo dõi
      focalX.setValue(event.nativeEvent.focalX);
      focalY.setValue(event.nativeEvent.focalY);
    }
  };

  // Thêm thêm handler cho Pan gesture
  const onPanGestureEvent = Animated.event(
    [
      {
        nativeEvent: {
          translationX: translateX.current,
          translationY: translateY.current,
        },
      },
    ],
    { useNativeDriver: false }
  );

  const onPanHandlerStateChange = (event: any) => {
    // Chỉ xử lý kéo khi ảnh đã được phóng to
    if (!isZoomed) return;

    if (event.nativeEvent.oldState === State.ACTIVE) {
      // Lưu lại vị trí hiện tại khi kết thúc pan
      lastTranslateX.current += event.nativeEvent.translationX;
      lastTranslateY.current += event.nativeEvent.translationY;

      // Giới hạn khoảng di chuyển dựa vào mức zoom
      const maxTranslate = (baseScale.current - 1) * 200; // Giá trị này có thể điều chỉnh

      lastTranslateX.current = Math.max(
        -maxTranslate,
        Math.min(maxTranslate, lastTranslateX.current)
      );
      lastTranslateY.current = Math.max(
        -maxTranslate,
        Math.min(maxTranslate, lastTranslateY.current)
      );

      // Cập nhật giá trị translateX/Y
      translateX.current.setValue(lastTranslateX.current);
      translateY.current.setValue(lastTranslateY.current);

      // Nếu zoom về mức tối thiểu, reset translate
      if (baseScale.current <= MIN_ZOOM) {
        translateX.current.setValue(0);
        translateY.current.setValue(0);
        lastTranslateX.current = 0;
        lastTranslateY.current = 0;
      }
    }
  };

  // Update handleCloseModal to clear pending marker
  const handleCloseModal = () => {
    // Animate the modal closing
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowIssueModal(false);
      setPendingMarkerPosition(null); // Clear pending marker position on cancel
    });
  };

  const handleSaveIssue = () => {
    // Implement saving issue logic here
    console.log('Issue saved:', {
      point: selectedPoint,
      viewIndex: currentViewIndex,
      type: issueType,
      description: issueDescription,
    });

    handleCloseModal();
  };

  // Add these handler functions
  const handleAddNewIssue = () => {
    setIssues([...issues, { type: '', description: '' }]);
  };

  const handleDeleteIssue = (index: number) => {
    const updatedIssues = [...issues];
    updatedIssues.splice(index, 1);
    setIssues(updatedIssues);
  };

  const handleUpdateIssueType = (index: number, type: string) => {
    const updatedIssues = [...issues];
    updatedIssues[index].type = type;
    setIssues(updatedIssues);
  };

  const handleUpdateIssueDescription = (index: number, description: string) => {
    const updatedIssues = [...issues];
    updatedIssues[index].description = description;
    setIssues(updatedIssues);
  };

  const handleCaptureImage = async (index: number) => {
    // In a real implementation, this would use something like expo-image-picker
    // For now, just add a placeholder
    alert('Camera would open here to capture an image');

    // Mock implementation (in real app, would get image from camera)
    const updatedIssues = [...issues];
    updatedIssues[index].image = 'https://via.placeholder.com/300';
    setIssues(updatedIssues);
  };

  const handleSaveAllIssues = () => {
    // Update the issues for the active marker
    setMarkerPoints((prevMarkers) =>
      prevMarkers.map((marker) =>
        marker.id === activeMarkerId
          ? { ...marker, issues: [...issues] }
          : marker
      )
    );

    console.log('Saving issues for marker:', activeMarkerId);
    handleCloseModal();
  };

  // Modify handleSelectAndSaveIssue to explicitly ensure category is saved
  const handleSelectAndSaveIssue = (category: string, issueName: string) => {
    // Save current state to history before updating
    saveHistoryState();

    // Create a new issue with the selected type
    const newIssue = {
      type: issueName,
      description: '',
      category: category,
    };

    if (activeMarkerId) {
      // Update existing marker
      setMarkerPoints((prevMarkers) =>
        prevMarkers.map((marker) =>
          marker.id === activeMarkerId
            ? {
                ...marker,
                issues: [newIssue],
                category: category,
              }
            : marker
        )
      );
    } else if (pendingMarkerPosition) {
      // Create new marker only when user selects an issue
      const newMarkerId = generateUniqueId();
      const newMarker: MarkerPoint = {
        x: pendingMarkerPosition.x,
        y: pendingMarkerPosition.y,
        viewIndex: currentViewIndex,
        id: newMarkerId,
        issues: [newIssue],
        category: category,
      };

      setMarkerPoints((prev) => [...prev, newMarker]);
    }

    // Close the modal
    handleCloseModal();
  };

  // Add this function to handle marker deletion
  // Modify handleDeleteMarker to save history before deleting
  const handleDeleteMarker = () => {
    // Ask for confirmation before deleting
    if (activeMarkerId) {
      // Save current state to history before deleting
      saveHistoryState();

      // Remove the marker with activeMarkerId from markerPoints
      setMarkerPoints((prevMarkers) =>
        prevMarkers.filter((marker) => marker.id !== activeMarkerId)
      );

      console.log('Deleted marker:', activeMarkerId);
      setActiveMarkerId(null);
      handleCloseModal();
    }
  };

  // Add a function to filter issues based on search query
  const getFilteredCategories = () => {
    if (!searchQuery.trim()) {
      return ISSUE_CATEGORIES;
    }

    const query = searchQuery.toLowerCase();

    return ISSUE_CATEGORIES.map((category) => ({
      ...category,
      issues: category.issues.filter(
        (issue) =>
          issue.toLowerCase().includes(query) ||
          category.name.toLowerCase().includes(query)
      ),
    })).filter((category) => category.issues.length > 0);
  };

  // Add this function to count and sort issues
  const getIssueSummary = useCallback(() => {
    // Count issues by type
    const issueCount: { [key: string]: { count: number; category: string } } =
      {};

    markerPoints
      .filter((marker) => marker.viewIndex === currentViewIndex)
      .forEach((marker) => {
        if (marker.issues && marker.issues.length > 0 && marker.category) {
          marker.issues.forEach((issue) => {
            if (!issue.type) return;

            const key = issue.type;
            if (issueCount[key]) {
              issueCount[key].count += 1;
            } else {
              issueCount[key] = {
                count: 1,
                category: marker.category || '',
              };
            }
          });
        }
      });

    // Convert to array and sort by count
    const sortedIssues = Object.entries(issueCount)
      .map(([type, data]) => ({
        type,
        count: data.count,
        category: data.category,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Take only top 5

    return sortedIssues;
  }, [markerPoints, currentViewIndex]);

  return (
    <View style={styles.scanView}>
      <View style={styles.blueprintContainer}>
        {/* Canh giữa mũi tên trái */}
        <TouchableOpacity
          style={[styles.navigationArrow, styles.leftArrow]}
          onPress={handlePrevView}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.05)', 'rgba(0,0,0,0.0)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.gradientContainer}
          >
            <AntDesign name="left" size={36} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Kết hợp PanGestureHandler và PinchGestureHandler */}
        <PanGestureHandler
          onGestureEvent={onPanGestureEvent}
          onHandlerStateChange={onPanHandlerStateChange}
          enabled={isZoomed} // Chỉ cho phép pan khi đã phóng to
          avgTouches // Sử dụng điểm trung bình của tất cả các touch để xác định pan
        >
          <Animated.View style={{ flex: 1, width: '100%' }}>
            <PinchGestureHandler
              onGestureEvent={onPinchGestureEvent}
              onHandlerStateChange={onPinchHandlerStateChange}
            >
              <Animated.View style={styles.imageContainer}>
                {isImageLoading && (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0066cc" />
                  </View>
                )}

                <View
                  style={{
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                  }}
                >
                  <Animated.View
                    style={{
                      width: '100%',
                      height: '100%',
                      transform: [
                        { translateX: isZoomed ? translateX.current : 0 },
                        { translateY: isZoomed ? translateY.current : 0 },
                        { scale: scaleValue },
                      ],
                    }}
                  >
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={handleBlueprintPress}
                      style={{ width: '100%', height: '100%' }}
                    >
                      <Image
                        source={{
                          uri: views[currentViewIndex].image,
                        }}
                        style={[
                          styles.blueprintImage,
                          isImageLoading && { opacity: 0 },
                        ]}
                        onLoadStart={() => {
                          const currentImageUrl = views[currentViewIndex].image;
                          if (!loadedImages.has(currentImageUrl)) {
                            setIsImageLoading(true);
                          }
                        }}
                        onLoad={handleImageLoad}
                        onError={(e) => {
                          console.log('Image error:', e.nativeEvent.error);
                          setIsImageLoading(false);
                        }}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>

                    {/* Place markers in the same transformed container */}
                    {markerPoints
                      .filter((marker) => marker.viewIndex === currentViewIndex)
                      .map((marker) => {
                        // Determine which shape to show based on the marker's category
                        const shapeInfo = marker.category
                          ? ISSUE_SHAPES[marker.category]
                          : {
                              type: 'circle',
                              color: '#0066cc',
                            };

                        const isActive = marker.id === activeMarkerId;
                        const markerColor = isActive
                          ? '#ff3b30'
                          : shapeInfo.color;

                        return (
                          <View
                            key={marker.id}
                            style={[
                              styles.marker,
                              {
                                position: 'absolute',
                                left: marker.x - 8, // Reduced from 12 to 8
                                top: marker.y - 8, // Reduced from 12 to 8
                              },
                            ]}
                          >
                            {/* Render different shapes based on the issue category */}
                            {shapeInfo.type === 'circle' && (
                              <View
                                style={[
                                  styles.shapeMarker,
                                  styles.circleMarker,
                                  { backgroundColor: markerColor },
                                ]}
                              />
                            )}
                            {shapeInfo.type === 'square' && (
                              <View
                                style={[
                                  styles.shapeMarker,
                                  styles.squareMarker,
                                  { backgroundColor: markerColor },
                                ]}
                              />
                            )}
                            {shapeInfo.type === 'triangle' && (
                              <View
                                style={[
                                  styles.triangleContainer,
                                  { width: 16, height: 16 }, // Reduced from 24 to 16
                                ]}
                              >
                                <View
                                  style={[
                                    styles.triangleMarker,
                                    { borderBottomColor: markerColor },
                                  ]}
                                />
                              </View>
                            )}
                            {shapeInfo.type === 'hexagon' && (
                              <View
                                style={[
                                  styles.shapeMarker,
                                  styles.hexagonMarker,
                                  { backgroundColor: markerColor },
                                ]}
                              />
                            )}
                          </View>
                        );
                      })}
                  </Animated.View>
                </View>
              </Animated.View>
            </PinchGestureHandler>
          </Animated.View>
        </PanGestureHandler>

        {/* Canh giữa mũi tên phải */}
        <TouchableOpacity
          style={[styles.navigationArrow, styles.rightArrow]}
          onPress={handleNextView}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.05)', 'rgba(0,0,0,0.1)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.gradientContainer}
          >
            <AntDesign name="right" size={36} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Nút zoom in/out */}
        <View style={styles.zoomControlsContainer}>
          <TouchableOpacity
            style={[
              styles.zoomControlButton,
              { marginBottom: 15 },
              markerHistory.length === 0 && { opacity: 0.5 },
            ]}
            onPress={handleUndo}
            disabled={markerHistory.length === 0}
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.3)']}
              style={styles.zoomButtonGradient}
            >
              <MaterialIcons name="undo" size={24} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.zoomControlButton}
            onPress={handleZoomIn}
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.3)']}
              style={styles.zoomButtonGradient}
            >
              <MaterialIcons name="add" size={24} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.zoomControlButton}
            onPress={handleZoomOut}
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.3)']}
              style={styles.zoomButtonGradient}
            >
              <MaterialIcons name="remove" size={24} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Issue summary in top-left */}
        <View style={styles.issueSummaryContainer}>
          {getIssueSummary().map((issue, index) => {
            // Get shape info for the category
            const shapeInfo = ISSUE_SHAPES[issue.category] || {
              type: 'circle',
              color: '#0066cc',
            };

            return (
              <View key={`summary-${index}`} style={styles.issueSummaryItem}>
                <View style={styles.issueSummaryIconContainer}>
                  {/* Show appropriate shape based on category */}
                  {shapeInfo.type === 'circle' && (
                    <View
                      style={[
                        styles.miniShapeMarker,
                        styles.miniCircleMarker,
                        { backgroundColor: shapeInfo.color },
                      ]}
                    />
                  )}
                  {shapeInfo.type === 'square' && (
                    <View
                      style={[
                        styles.miniShapeMarker,
                        styles.miniSquareMarker,
                        { backgroundColor: shapeInfo.color },
                      ]}
                    />
                  )}
                  {shapeInfo.type === 'triangle' && (
                    <View style={styles.miniTriangleContainer}>
                      <View
                        style={[
                          styles.miniTriangleMarker,
                          { borderBottomColor: shapeInfo.color },
                        ]}
                      />
                    </View>
                  )}
                  {shapeInfo.type === 'hexagon' && (
                    <View
                      style={[
                        styles.miniShapeMarker,
                        styles.miniHexagonMarker,
                        { backgroundColor: shapeInfo.color },
                      ]}
                    />
                  )}
                </View>
                <Text style={styles.issueSummaryText} numberOfLines={1}>
                  {issue.type}
                </Text>
                <View style={styles.issueSummaryCount}>
                  <Text style={styles.issueSummaryCountText}>
                    {issue.count}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

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
              {
                transform: [{ translateY: slideAnim }],
                height: height * 0.7, // Reduce height as we don't need as much space
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingMarker ? 'Edit Issue' : 'Select Issue'}
              </Text>
              <View style={styles.headerButtons}>
                {editingMarker && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={handleDeleteMarker}
                  >
                    <AntDesign name="delete" size={22} color="#ff3b30" />
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleCloseModal}
                >
                  <AntDesign name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.locationInfoContainer}>
              <Text style={styles.modalLabel}>Location</Text>
              <View style={styles.coordinatesContainer}>
                <Text style={styles.coordinates}>
                  X: {Math.round(selectedPoint.x)}, Y:{' '}
                  {Math.round(selectedPoint.y)}
                </Text>
                <Text style={styles.viewLabel}>
                  View:{' '}
                  {views[currentViewIndex].name ||
                    `View ${currentViewIndex + 1}`}
                </Text>
              </View>
            </View>

            {/* Add search bar */}
            <View style={styles.searchContainer}>
              <AntDesign
                name="search1"
                size={18}
                color="#999"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search issues..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                clearButtonMode="while-editing"
              />
            </View>
            <ScrollView style={styles.issueListContainer}>
              <View style={styles.issueCategoriesContainer}>
                {getFilteredCategories().map((category, catIndex) => (
                  <View
                    key={`cat-${catIndex}`}
                    style={styles.categoryContainer}
                  >
                    <Text style={styles.categoryTitle}>{category.name}</Text>
                    <View style={styles.issuesGrid}>
                      {category.issues.map((issueName, issueIndex) => {
                        // Get the appropriate icon/shape for this issue
                        const shapeInfo = ISSUE_SHAPES[category.name];
                        const iconColor = shapeInfo.color;

                        return (
                          <TouchableOpacity
                            key={`issue-${category.name}-${issueIndex}`}
                            style={styles.issueTypeButton}
                            onPress={() =>
                              handleSelectAndSaveIssue(category.name, issueName)
                            }
                          >
                            {/* Show the appropriate shape icon */}
                            <View style={styles.issueIconContainer}>
                              {category.name === 'Structural' && (
                                <View
                                  style={[
                                    styles.miniShapeMarker,
                                    styles.miniSquareMarker,
                                    { backgroundColor: iconColor },
                                  ]}
                                />
                              )}
                              {category.name === 'Plumbing' && (
                                <View
                                  style={[
                                    styles.miniShapeMarker,
                                    styles.miniCircleMarker,
                                    { backgroundColor: iconColor },
                                  ]}
                                />
                              )}
                              {category.name === 'Electrical' && (
                                <View style={styles.miniTriangleContainer}>
                                  <View
                                    style={[
                                      styles.miniTriangleMarker,
                                      { borderBottomColor: iconColor },
                                    ]}
                                  />
                                </View>
                              )}
                              {category.name === 'Other' && (
                                <View
                                  style={[
                                    styles.miniShapeMarker,
                                    styles.miniHexagonMarker,
                                    { backgroundColor: iconColor },
                                  ]}
                                />
                              )}
                            </View>

                            <Text style={styles.issueTypeText}>
                              {issueName}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.cancelButton, { flex: 1 }]}
                onPress={handleCloseModal}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  scanView: {
    flex: 1,
    backgroundColor: '#fff',
  },
  blueprintContainer: {
    flex: 1,
    backgroundColor: '#ffffff', // Changed from '#1a1a1a' to white
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navigationArrow: {
    width: 50,
    height: 100,
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -28 }],
    zIndex: 10,
    borderRadius: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  gradientContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightArrow: {
    right: 5,
  },
  leftArrow: {
    left: 5,
  },
  blueprintImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  zoomControlsContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 10,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  zoomControlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    marginBottom: 5,
  },
  zoomButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
    backgroundColor: 'rgba(0,0,0,0.1)', // Làm tối màn hình một chút khi loading
  },
  marker: {
    position: 'absolute',
    width: 16, // Reduced from 20 to 16
    height: 16, // Reduced from 20 to 16
    zIndex: 200,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBody: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  coordinatesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  coordinates: {
    fontSize: 14,
  },
  viewLabel: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  issueTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  issueTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8, // Reduced from 12 to 8
    borderRadius: 6,
    backgroundColor: '#f0f7ff',
    marginRight: 6, // Reduced from 8 to 6
    marginBottom: 6, // Reduced from 8 to 6
    borderWidth: 1,
    borderColor: '#deeaff',
    width: '47%', // Set to approximately half the container minus margins
  },
  issueTypeText: {
    fontSize: 13, // Reduced from 15 to 13
    color: '#0066cc',
    flex: 1,
  },
  issueIconContainer: {
    marginRight: 6,
    justifyContent: 'center',
    alignItems: 'center',
    width: 12,
    height: 12,
  },
  issuesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start', // Align items from start
  },
  miniShapeMarker: {
    width: 10,
    height: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 1,
  },
  miniCircleMarker: {
    borderRadius: 5,
  },
  miniSquareMarker: {
    borderRadius: 2,
  },
  miniTriangleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 10,
    height: 10,
  },
  miniTriangleMarker: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  miniHexagonMarker: {
    width: 10,
    height: 8,
    borderRadius: 2,
    transform: [{ rotate: '30deg' }],
  },
  issueInput: {
    height: 80,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#ccc',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#333',
  },
  saveButton: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#0066cc',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
  },
  locationInfoContainer: {
    marginBottom: 10,
  },
  issueListContainer: {
    flex: 1,
    marginBottom: 10,
  },
  issueItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  issueTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  issueTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  issueTypeLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 5,
  },
  issueTypeButtonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  issueLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  imageSection: {
    marginTop: 10,
  },
  imageContainer: {
    position: 'relative',
  },
  issueImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  replaceImageButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#0066cc',
    padding: 5,
    borderRadius: 5,
  },
  replaceImageText: {
    color: '#fff',
    fontSize: 12,
  },
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0066cc',
    padding: 10,
    borderRadius: 5,
  },
  captureButtonText: {
    color: '#fff',
    marginLeft: 5,
  },
  noIssuesText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
  },
  addIssueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0066cc',
    padding: 10,
    borderRadius: 5,
  },
  addIssueButtonText: {
    color: '#fff',
    marginLeft: 5,
  },
  selectedIssuesContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  selectedIssueItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  issueSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  issueCategoriesContainer: {
    marginBottom: 20,
  },
  categoryContainer: {
    marginBottom: 15,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  issuesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start', // Align items from start
  },
  markerCount: {
    position: 'absolute',
    top: -6, // Adjusted from -10 to -6
    right: -6, // Adjusted from -10 to -6
    backgroundColor: '#ff3b30',
    borderRadius: 8, // Adjusted from 10 to 8
    padding: 1, // Adjusted from 2 to 1
    minWidth: 16, // Reduced from 20 to 16
    minHeight: 16, // Reduced from 20 to 16
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerCountText: {
    color: '#fff',
    fontSize: 10, // Reduced from 12 to 10
    fontWeight: 'bold',
  },
  shapeMarker: {
    width: 16, // Reduced from 24 to 16
    height: 16, // Reduced from 24 to 16
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, // Reduced shadow offset
    shadowOpacity: 0.3,
    shadowRadius: 1, // Reduced shadow radius
    elevation: 2, // Reduced elevation
  },
  circleMarker: {
    borderRadius: 8, // Reduced from 12 to 8
  },
  squareMarker: {
    borderRadius: 3, // Reduced from 4 to 3
  },
  triangleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  triangleMarker: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8, // Reduced from 12 to 8
    borderRightWidth: 8, // Reduced from 12 to 8
    borderBottomWidth: 16, // Reduced from 22 to 16
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  hexagonMarker: {
    width: 16, // Reduced from 24 to 16
    height: 14, // Reduced from 22 to 14
    borderRadius: 3, // Reduced from 4 to 3
    transform: [{ rotate: '30deg' }],
  },
  ellipseMarker: {
    width: 28,
    height: 18,
    borderRadius: 9,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    backgroundColor: '#ffeeee',
    padding: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#ff3b30',
    marginLeft: 4,
    fontWeight: '500',
  },
  closeButton: {
    padding: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    height: 40,
  },
  issueIconContainer: {
    marginRight: 6,
    justifyContent: 'center',
    alignItems: 'center',
    width: 12,
    height: 12,
  },
  miniShapeMarker: {
    width: 10,
    height: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 1,
  },
  miniCircleMarker: {
    borderRadius: 5,
  },
  miniSquareMarker: {
    borderRadius: 2,
  },
  miniTriangleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 10,
    height: 10,
  },
  miniTriangleMarker: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  miniHexagonMarker: {
    width: 10,
    height: 8,
    borderRadius: 2,
    transform: [{ rotate: '30deg' }],
  },
  issueSummaryContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 20,
    maxWidth: '50%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  issueSummaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  issueSummaryIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  issueSummaryText: {
    fontSize: 12,
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  issueSummaryCount: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  issueSummaryCountText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
});
