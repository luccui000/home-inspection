import { AntDesign, Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from 'react-native';

export default function Header() {
  const [showDropdown, setShowDropdown] = useState(false);

  const handleGoBack = () => {
    router.back();
  };

  // Add this custom render function inside HistoryScreen component
  const renderItem = (item: any) => {
    return (
      <View style={styles.dropdownItem}>
        <Feather name={item.icon} size={24} color="#2c3e50" />
        <Text style={styles.dropdownItemText}>{item.label}</Text>
      </View>
    );
  };

  const renderSelectedItem = (item: any) => {
    return (
      <View style={styles.selectedItem}>
        <Feather name={item.icon} size={24} color="#2c3e50" />
      </View>
    );
  };

  return (
    <View style={styles.header}>
      <View style={styles.backTitle}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <AntDesign name="arrowleft" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Issue histories</Text>
      </View>
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setShowDropdown(!showDropdown)}
      >
        <Feather name="filter" size={20} color="#2c3e50" />
      </TouchableOpacity>
    </View>
  );
}

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
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
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
});
