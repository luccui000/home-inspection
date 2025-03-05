import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ScrollView,
} from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import Issue, { IssueType } from '../types/type';

const issueTypes: IssueType[] = [
  { id: 'all', label: 'All' },
  { id: 'structural', label: 'Structural' },
  { id: 'electrical', label: 'Electrical' },
  { id: 'plumbing', label: 'Plumbing' },
  { id: 'finishing', label: 'Finishing' },
  { id: 'other', label: 'Other' },
];

// Update the views array to include icons
const views = [
  { label: 'Front View', value: '0', icon: 'arrow-up-circle' },
  { label: 'Right View', value: '1', icon: 'arrow-right-circle' },
  { label: 'Back View', value: '2', icon: 'arrow-down-circle' },
  { label: 'Left View', value: '3', icon: 'arrow-left-circle' },
];

export default function HistoryView({ mockIssues }: { mockIssues: Issue[] }) {
  const [selectedViews, setSelectedViews] = useState([]);
  const [activeTab, setActiveTab] = useState('all');

  const filteredIssues = mockIssues.filter((issue: Issue) => {
    const matchesType = activeTab === 'all' || issue.type === activeTab;
    const matchesView =
      selectedViews.length === 0 ||
      selectedViews.includes(issue.viewIndex.toString());
    return matchesType && matchesView;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  };

  const getIssueTypeIcon = (type: string) => {
    switch (type) {
      case 'structural':
        return <MaterialIcons name="foundation" size={20} color="#e74c3c" />;
      case 'electrical':
        return (
          <MaterialIcons name="electrical-services" size={20} color="#f39c12" />
        );
      case 'plumbing':
        return <MaterialIcons name="plumbing" size={20} color="#3498db" />;
      case 'finishing':
        return <MaterialIcons name="brush" size={20} color="#9b59b6" />;
      default:
        return <MaterialIcons name="error-outline" size={20} color="#7f8c8d" />;
    }
  };

  const renderIssueItem = ({ item }: { item: Issue }) => (
    <View style={styles.issueCard}>
      <View style={styles.issueHeader}>
        <View style={styles.issueTypeContainer}>
          {getIssueTypeIcon(item.type)}
          <Text style={styles.issueType}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </Text>
        </View>
        <Text style={styles.issueDate}>{formatDate(item.timestamp)}</Text>
      </View>

      <View style={styles.issueLocation}>
        <Feather name="map-pin" size={16} color="#7f8c8d" />
        <Text style={styles.issueLocationText}>
          {item.viewName} (X: {Math.round(item.position.x)}, Y:{' '}
          {Math.round(item.position.y)})
        </Text>
      </View>

      <Text style={styles.issueDescription}>{item.description}</Text>

      {item.image && (
        <Image
          source={{ uri: item.image }}
          style={styles.issueImage}
          resizeMode="cover"
        />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.filtersContainer}>
        <Text style={styles.filterTitle}>Issue Type:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          {issueTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.tabButton,
                activeTab === type.id && styles.activeTabButton,
              ]}
              onPress={() => setActiveTab(type.id)}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === type.id && styles.activeTabButtonText,
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {filteredIssues.length > 0 ? (
        <FlatList
          data={filteredIssues}
          renderItem={renderIssueItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.issuesList}
        />
      ) : (
        <View style={styles.emptyState}>
          <MaterialIcons name="search-off" size={60} color="#bdc3c7" />
          <Text style={styles.emptyStateText}>
            No issues match the selected filters
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2c3e50',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 24,
  },
  filtersContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  tabsContainer: {
    paddingBottom: 5,
  },
  tabButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#f0f0f0',
  },
  activeTabButton: {
    backgroundColor: '#2c3e50',
  },
  tabButtonText: {
    color: '#555',
    fontWeight: '500',
  },
  activeTabButtonText: {
    color: '#fff',
  },
  issuesList: {
    padding: 15,
  },
  issueCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  issueTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  issueType: {
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 5,
  },
  issueDate: {
    color: '#7f8c8d',
    fontSize: 12,
  },
  issueLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  issueLocationText: {
    marginLeft: 5,
    color: '#7f8c8d',
    fontSize: 14,
  },
  issueDescription: {
    fontSize: 15,
    color: '#333',
    marginBottom: 10,
    lineHeight: 20,
  },
  issueImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 10,
  },
  dropdown: {
    height: 50,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectedStyle: {
    borderRadius: 8,
    backgroundColor: 'rgba(44, 62, 80, 0.1)',
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
});
