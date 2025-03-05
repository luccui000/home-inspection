import { router, useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Platform,
  Text,
  TouchableOpacity,
  View,
  Animated,
  Alert,
} from 'react-native';
import HistoryView from './HistoryView';
import Issue from '../types/type';
import { StyleSheet } from 'react-native';
import { AntDesign, Feather, MaterialIcons } from '@expo/vector-icons';

export default function History() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedView, setSelectedView] = useState<string | null>(null);
  const navigation = useNavigation();
  // Animation for dropdown
  const [dropdownAnim] = useState(new Animated.Value(0));

  // Show/hide dropdown with animation
  useEffect(() => {
    if (showDropdown) {
      console.log('Opening dropdown');
      Animated.timing(dropdownAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      console.log('Closing dropdown');
      Animated.timing(dropdownAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [showDropdown]);

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      router.replace('/home');
    }
  };

  const toggleDropdown = () => {
    console.log('Toggle dropdown, current state:', showDropdown);
    // Add a visual confirmation with Alert so we know the function was called
    // Alert.alert("Debug", `Toggle dropdown: ${!showDropdown}`);
    setShowDropdown((prev) => !prev);
  };

  // Sample data for demonstration
  const issues: Issue[] = [
    {
      id: '1',
      type: 'structural',
      description: 'Crack in foundation wall',
      position: { x: 156, y: 230 },
      viewIndex: 0,
      viewName: 'Front View',
      timestamp: '2025-03-01T14:22:18.000Z',
      image:
        'https://api.a0.dev/assets/image?text=crack%20in%20foundation%20wall&aspect=4:3&seed=111',
    },
    {
      id: '2',
      type: 'electrical',
      description: 'Missing outlet cover',
      position: { x: 245, y: 178 },
      viewIndex: 0,
      viewName: 'Front View',
      timestamp: '2025-03-02T09:45:32.000Z',
      image:
        'https://api.a0.dev/assets/image?text=missing%20outlet%20cover&aspect=4:3&seed=222',
    },
    {
      id: '3',
      type: 'plumbing',
      description: 'Water leak at pipe joint',
      position: { x: 120, y: 350 },
      viewIndex: 1,
      viewName: 'Right View',
      timestamp: '2025-03-02T11:18:45.000Z',
      image:
        'https://api.a0.dev/assets/image?text=water%20leak%20pipe%20joint&aspect=4:3&seed=333',
    },
    {
      id: '4',
      type: 'finishing',
      description: 'Damaged drywall',
      position: { x: 89, y: 205 },
      viewIndex: 2,
      viewName: 'Back View',
      timestamp: '2025-03-03T15:30:12.000Z',
      image:
        'https://api.a0.dev/assets/image?text=damaged%20drywall&aspect=4:3&seed=444',
    },
    {
      id: '5',
      type: 'other',
      description: 'Incorrect window dimensions',
      position: { x: 300, y: 150 },
      viewIndex: 3,
      viewName: 'Left View',
      timestamp: '2025-03-04T10:12:33.000Z',
      image:
        'https://api.a0.dev/assets/image?text=incorrect%20window%20dimensions&aspect=4:3&seed=555',
    },
  ];

  // Extract unique views from issues
  const viewOptions = [...new Set(issues.map((issue) => issue.viewName))];

  // Filter issues based on selected view
  const filteredIssues = selectedView
    ? issues.filter((issue) => issue.viewName === selectedView)
    : issues;

  // Toggle filter selection
  const handleSelectView = (viewName: string) => {
    if (selectedView === viewName) {
      setSelectedView(null); // Deselect if already selected
    } else {
      setSelectedView(viewName); // Select the view
    }
    setShowDropdown(false); // Close dropdown after selection
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSelectedView(null);
    setShowDropdown(false);
  };

  useEffect(() => {
    navigation.setOptions({
      headerTransparent: true,
      headerTitle: '',
      headerBackVisible: false,
    });
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <View style={styles.backTitle}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <AntDesign name="arrowleft" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Histories</Text>
        </View>

        <View>
          {/* Make touchable area larger and ensure it's not covered by anything else */}
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedView && styles.activeFilterButton,
            ]}
            onPress={toggleDropdown}
            activeOpacity={0.7} // Add visual feedback when pressed
          >
            <Feather name="filter" size={20} color="#2c3e50" />
            {selectedView && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>1</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Make sure dropdown has higher zIndex */}
          {showDropdown && (
            <Animated.View
              style={[
                styles.dropdown,
                {
                  opacity: dropdownAnim,
                  transform: [
                    {
                      translateY: dropdownAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-20, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              {/* Dropdown content remains the same */}
              <View style={styles.filterHeader}>
                <Text style={styles.dropdownTitle}>Filter by view</Text>
                {selectedView && (
                  <TouchableOpacity onPress={handleClearFilters}>
                    <Text style={styles.clearButton}>Clear</Text>
                  </TouchableOpacity>
                )}
              </View>

              {viewOptions.map((viewName, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.dropdownItem}
                  onPress={() => handleSelectView(viewName)}
                >
                  <View style={styles.checkboxContainer}>
                    {selectedView === viewName && (
                      <MaterialIcons name="check" size={18} color="#0066cc" />
                    )}
                  </View>
                  <Text style={styles.dropdownItemText}>{viewName}</Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          )}
        </View>
      </View>

      {/* Show selected filter as chip if any */}
      {selectedView && (
        <View style={styles.selectedFiltersContainer}>
          <TouchableOpacity
            style={styles.filterChip}
            onPress={() => setSelectedView(null)}
          >
            <Text style={styles.filterChipText}>{selectedView}</Text>
            <AntDesign name="close" size={14} color="#0066cc" />
          </TouchableOpacity>
        </View>
      )}

      <HistoryView mockIssues={filteredIssues} />
    </View>
  );
}

// Update the styles to ensure proper z-indexing
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2c3e50',
    paddingVertical: 10, // Giảm padding
    paddingHorizontal: 10,
    paddingTop: Platform.OS === 'ios' ? 60 : 8, // Điều chỉnh padding top cho iOS
  },
  backTitle: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 999,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  backButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  filterButton: {
    padding: 10, // Increased padding for larger touch target
    borderRadius: 8,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 100, // Ensure this is clickable
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  dropdownItemText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#2c3e50',
  },
  selectedItem: {
    padding: 4,
    marginRight: 5,
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dropdown: {
    position: 'absolute',
    right: 0,
    top: 50,
    width: 200,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    padding: 10,
    zIndex: 1000, // Ensure dropdown is above other elements
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 5,
  },
  checkboxContainer: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  activeFilterButton: {
    borderColor: '#0066cc',
    borderWidth: 1,
  },
  clearButton: {
    color: '#0066cc',
    fontSize: 14,
  },
  selectedFiltersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    backgroundColor: '#f9f9f9',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f2ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#cce4ff',
  },
  filterChipText: {
    color: '#0066cc',
    fontSize: 14,
    marginRight: 6,
  },
});
