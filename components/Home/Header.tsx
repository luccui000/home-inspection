import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';

export default function Header() {
  const router = useRouter();

  const navigateToHistory = () => {
    router.push({
      pathname: '/scan-history',
    });
  };

  return (
    <View style={styles.header}>
      <Text style={styles.title}>2D House</Text>
      <TouchableOpacity
        style={styles.historyButton}
        onPress={navigateToHistory}
      >
        <MaterialIcons name="history" size={16} color="#fff" />
        <Text style={styles.historyButtonText}>History</Text>
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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 8, // Điều chỉnh padding top cho iOS
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34495e',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  historyButtonText: {
    color: '#fff',
    marginLeft: 5,
    fontWeight: '600',
  },
  viewName: {
    alignItems: 'center',
    padding: 5, // Giảm padding
    backgroundColor: '#2c3e50', // Thêm màu nền
  },
  viewNameText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
