import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import {
  MaterialIcons,
  Ionicons,
  AntDesign,
  Feather,
} from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

// Define house type
interface House {
  id: string;
  name: string;
  address: string;
  image?: string;
  completedItems?: number;
  totalItems?: number;
}

// Define checklist item type
interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'ok' | 'issue';
  photo?: string;
}

// Define category type
interface Category {
  id: string;
  name: string;
  items: ChecklistItem[];
}

export default function ChecklistTab() {
  const router = useRouter();

  // House selection state
  const [houses, setHouses] = useState<House[]>([
    {
      id: 'house1',
      name: '青山レジデンス',
      address: '東京都港区南青山3-1-30',
      image: 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg',
      completedItems: 5,
      totalItems: 15,
    },
    {
      id: 'house2',
      name: '桜ヶ丘マンション',
      address: '東京都世田谷区桜ヶ丘2-11-15',
      image:
        'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg',
      completedItems: 0,
      totalItems: 15,
    },
    {
      id: 'house3',
      name: '緑風タワー',
      address: '東京都江東区東雲1-9-10',
      image: 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg',
      completedItems: 8,
      totalItems: 15,
    },
    {
      id: 'house4',
      name: '海辺のヴィラ',
      address: '神奈川県藤沢市片瀬海岸1-12-7',
      image:
        'https://images.pexels.com/photos/1029599/pexels-photo-1029599.jpeg',
      completedItems: 12,
      totalItems: 15,
    },
  ]);

  const [selectedHouse, setSelectedHouse] = useState<House | null>(null);
  const [showHouseSelection, setShowHouseSelection] = useState(false);

  // Set initial selected house
  useEffect(() => {
    if (houses.length > 0 && !selectedHouse) {
      setSelectedHouse(houses[0]);
    }
  }, [houses]);

  // Initial checklist data (same as before)
  const [categories, setCategories] = useState<Category[]>([
    {
      id: 'exterior',
      name: '外部 (Exterior)',
      items: [
        {
          id: 'ext-1',
          title: '屋根 (Roof)',
          description: '損傷、劣化、ひび割れなし',
          status: 'pending',
        },
        {
          id: 'ext-2',
          title: '外壁 (External walls)',
          description: '破損、ひび割れ、塗装の剥がれなし',
          status: 'pending',
        },
        {
          id: 'ext-3',
          title: '基礎 (Foundation)',
          description: '沈下、ひび割れ、隙間なし',
          status: 'pending',
        },
      ],
    },
    {
      id: 'interior',
      name: '内部 (Interior)',
      items: [
        {
          id: 'int-1',
          title: '壁・床・天井 (Walls/Floors/Ceilings)',
          description: '傷、しみ、変色、ひび割れなし',
          status: 'pending',
        },
        {
          id: 'int-2',
          title: '窓・ドア (Windows/Doors)',
          description: '開閉スムーズ、気密性あり',
          status: 'pending',
        },
        {
          id: 'int-3',
          title: '換気 (Ventilation)',
          description: '換気扇作動、自然換気可能',
          status: 'pending',
        },
      ],
    },
    {
      id: 'plumbing',
      name: '水道設備 (Plumbing)',
      items: [
        {
          id: 'plumb-1',
          title: '給水圧 (Water pressure)',
          description: '適切な水圧で一定',
          status: 'pending',
        },
        {
          id: 'plumb-2',
          title: '排水 (Drainage)',
          description: 'スムーズに排水、詰まりなし',
          status: 'pending',
        },
        {
          id: 'plumb-3',
          title: '水漏れ (Leaks)',
          description: '配管接続部、蛇口からの漏れなし',
          status: 'pending',
        },
      ],
    },
    {
      id: 'electrical',
      name: '電気設備 (Electrical)',
      items: [
        {
          id: 'elec-1',
          title: 'コンセント (Outlets)',
          description: '動作確認済み、損傷なし',
          status: 'pending',
        },
        {
          id: 'elec-2',
          title: '照明 (Lighting)',
          description: '全ての照明が正常に動作',
          status: 'pending',
        },
        {
          id: 'elec-3',
          title: 'ブレーカー (Circuit breakers)',
          description: '適切に配線、容量適正',
          status: 'pending',
        },
      ],
    },
    {
      id: 'structure',
      name: '構造 (Structure)',
      items: [
        {
          id: 'struct-1',
          title: '床の傾斜 (Floor leveling)',
          description: '著しい傾斜なし',
          status: 'pending',
        },
        {
          id: 'struct-2',
          title: '柱・梁 (Pillars/Beams)',
          description: '変形、腐食なし',
          status: 'pending',
        },
        {
          id: 'struct-3',
          title: '耐震性 (Earthquake resistance)',
          description: '耐震基準適合',
          status: 'pending',
        },
      ],
    },
  ]);

  // Calculate completion progress
  const getTotalItems = () => {
    return categories.reduce((sum, category) => sum + category.items.length, 0);
  };

  const getCompletedItems = () => {
    return categories.reduce((sum, category) => {
      return (
        sum + category.items.filter((item) => item.status !== 'pending').length
      );
    }, 0);
  };

  const completionPercentage =
    Math.round((getCompletedItems() / getTotalItems()) * 100) || 0;

  // Update house completion data when checklist changes
  useEffect(() => {
    if (selectedHouse) {
      setHouses((prevHouses) =>
        prevHouses.map((house) =>
          house.id === selectedHouse.id
            ? {
                ...house,
                completedItems: getCompletedItems(),
                totalItems: getTotalItems(),
              }
            : house
        )
      );
    }
  }, [completionPercentage, selectedHouse]);

  // Select a house
  const handleSelectHouse = (house: House) => {
    setSelectedHouse(house);
    setShowHouseSelection(false);

    // In a real app, you would load the specific checklist for this house
    // For this demo, we'll just reset the status to simulate a different house
    resetChecklistStatus();
  };

  // Reset checklist status (simulating loading a different house's checklist)
  const resetChecklistStatus = () => {
    setCategories((prevCategories) =>
      prevCategories.map((category) => ({
        ...category,
        items: category.items.map((item) => ({
          ...item,
          status: 'pending',
          photo: undefined,
        })),
      }))
    );
  };

  // Your existing handlers (handleStatusChange, handleTakePhoto, handleItemClick)
  const handleStatusChange = (
    categoryId: string,
    itemId: string,
    newStatus: 'ok' | 'issue'
  ) => {
    // Your existing implementation
  };

  const handleTakePhoto = async (categoryId: string, itemId: string) => {
    // Your existing implementation
  };

  const handleItemClick = (item: ChecklistItem) => {
    // Your existing implementation
  };

  return (
    <View style={styles.container}>
      {/* House selection header */}
      <View style={styles.houseSelectionHeader}>
        <TouchableOpacity
          style={styles.selectedHouseContainer}
          onPress={() => setShowHouseSelection(true)}
        >
          {selectedHouse && (
            <>
              {selectedHouse.image && (
                <Image
                  source={{ uri: selectedHouse.image }}
                  style={styles.selectedHouseImage}
                />
              )}
              <View style={styles.selectedHouseInfo}>
                <Text style={styles.selectedHouseName}>
                  {selectedHouse.name}
                </Text>
                <Text style={styles.selectedHouseAddress} numberOfLines={1}>
                  {selectedHouse.address}
                </Text>
              </View>
              <AntDesign name="caretdown" size={16} color="#666" />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Header with progress */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>住宅検査チェックリスト</Text>
        <Text style={styles.headerSubtitle}>Home Inspection Checklist</Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${completionPercentage}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{completionPercentage}% 完了</Text>
        </View>
      </View>

      {/* Your existing ScrollView and checklist items */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {categories.map((category) => (
          <View key={category.id} style={styles.categoryContainer}>
            <Text style={styles.categoryTitle}>{category.name}</Text>

            {category.items.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.itemContainer,
                  item.status === 'ok' && styles.itemContainerOk,
                  item.status === 'issue' && styles.itemContainerIssue,
                ]}
                onPress={() => handleItemClick(item)}
                activeOpacity={item.status === 'issue' ? 0.7 : 1}
              >
                <View style={styles.itemContent}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemDescription}>{item.description}</Text>

                  {/* Show photo thumbnail if available */}
                  {item.photo && (
                    <View style={styles.photoContainer}>
                      <Image
                        source={{ uri: item.photo }}
                        style={styles.photoThumbnail}
                      />
                    </View>
                  )}
                </View>

                <View style={styles.itemActions}>
                  {/* Your existing action buttons */}
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      item.status === 'ok' && styles.actionButtonActive,
                    ]}
                    onPress={() =>
                      handleStatusChange(category.id, item.id, 'ok')
                    }
                  >
                    {item.status === 'ok' ? (
                      <MaterialIcons
                        name="check-circle"
                        size={24}
                        color="#4CAF50"
                      />
                    ) : (
                      <MaterialIcons
                        name="check-circle-outline"
                        size={24}
                        color="#757575"
                      />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      item.status === 'issue' && styles.actionButtonIssue,
                    ]}
                    onPress={() =>
                      handleStatusChange(category.id, item.id, 'issue')
                    }
                  >
                    {item.status === 'issue' ? (
                      <MaterialIcons name="error" size={24} color="#F44336" />
                    ) : (
                      <MaterialIcons
                        name="error-outline"
                        size={24}
                        color="#757575"
                      />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleTakePhoto(category.id, item.id)}
                  >
                    <Ionicons
                      name={item.photo ? 'camera' : 'camera-outline'}
                      size={24}
                      color={item.photo ? '#2196F3' : '#757575'}
                    />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <View style={styles.footer} />
      </ScrollView>

      {/* House Selection Modal */}
      <Modal
        visible={showHouseSelection}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowHouseSelection(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>物件を選択</Text>
            <TouchableOpacity onPress={() => setShowHouseSelection(false)}>
              <AntDesign name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={houses}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.houseItem,
                  selectedHouse?.id === item.id && styles.selectedHouseItem,
                ]}
                onPress={() => handleSelectHouse(item)}
              >
                <Image
                  source={{
                    uri: item.image || 'https://via.placeholder.com/60',
                  }}
                  style={styles.houseImage}
                />
                <View style={styles.houseInfo}>
                  <Text style={styles.houseName}>{item.name}</Text>
                  <Text style={styles.houseAddress} numberOfLines={1}>
                    {item.address}
                  </Text>
                  <View style={styles.houseProgressContainer}>
                    <View style={styles.houseProgressBar}>
                      <View
                        style={[
                          styles.houseProgressFill,
                          {
                            width: `${
                              item.totalItems
                                ? (item.completedItems! / item.totalItems!) *
                                  100
                                : 0
                            }%`,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.houseProgressText}>
                      {item.completedItems || 0}/{item.totalItems || 0}
                    </Text>
                  </View>
                </View>
                {selectedHouse?.id === item.id && (
                  <View style={styles.selectedIndicator}>
                    <Feather name="check" size={18} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={styles.houseList}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // Your existing styles
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 15,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },

  // Add new styles for house selection
  houseSelectionHeader: {
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  selectedHouseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedHouseImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
  },
  selectedHouseInfo: {
    flex: 1,
  },
  selectedHouseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
  },
  selectedHouseAddress: {
    fontSize: 12,
    color: '#757575',
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingTop: 50,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
  },
  houseList: {
    paddingVertical: 10,
  },
  houseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  selectedHouseItem: {
    backgroundColor: '#EBF5FB',
  },
  houseImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 15,
  },
  houseInfo: {
    flex: 1,
  },
  houseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  houseAddress: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 8,
  },
  houseProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  houseProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 8,
  },
  houseProgressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  houseProgressText: {
    fontSize: 12,
    color: '#757575',
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginLeft: 85,
  },
  selectedIndicator: {
    position: 'absolute',
    right: 15,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Keep your existing styles below
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#212121',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 15,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    minWidth: 60,
  },
  scrollView: {
    flex: 1,
  },
  categoryContainer: {
    marginTop: 20,
    paddingHorizontal: 15,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  itemContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemContainerOk: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  itemContainerIssue: {
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  itemContent: {
    marginBottom: 10,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 5,
  },
  itemDescription: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 5,
  },
  photoContainer: {
    marginTop: 10,
  },
  photoThumbnail: {
    width: '100%',
    height: 150,
    borderRadius: 6,
    resizeMode: 'cover',
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 10,
  },
  actionButton: {
    padding: 8,
    marginLeft: 10,
  },
  actionButtonActive: {
    backgroundColor: '#E8F5E9',
    borderRadius: 20,
  },
  actionButtonIssue: {
    backgroundColor: '#FFEBEE',
    borderRadius: 20,
  },
  footer: {
    height: 40,
  },
});
