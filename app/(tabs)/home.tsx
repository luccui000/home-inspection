import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function Home() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home Inspection</Text>

      <View style={styles.projectList}>
        <TouchableOpacity
          style={styles.projectCard}
          onPress={() => router.push('/inspection')}
        >
          <Ionicons name="home-outline" size={32} color="#2563eb" />
          <View style={styles.projectInfo}>
            <Text style={styles.projectName}>Dự án Villa Thảo Điền</Text>
            <Text style={styles.projectStatus}>
              Đang kiểm tra: 12/48 hạng mục
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#64748b" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.projectCard}>
          <Ionicons name="business-outline" size={32} color="#2563eb" />
          <View style={styles.projectInfo}>
            <Text style={styles.projectName}>Dự án Chung cư Masteri</Text>
            <Text style={styles.projectStatus}>Chưa bắt đầu</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#64748b" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => console.log('Add new project')}
      >
        <Ionicons name="add-circle" size={24} color="white" />
        <Text style={styles.addButtonText}>Thêm dự án mới</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#1e293b',
  },
  projectList: {
    flex: 1,
  },
  projectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  projectInfo: {
    flex: 1,
    marginLeft: 16,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  projectStatus: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
});
