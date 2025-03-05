import { useNavigation } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import HistoryView from './HistoryView';
import Issue from '../types/type';
import Header from '@/components/ScanHistory/Header';

export default function History() {
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      headerTransparent: true,
      headerTitle: '',
      headerBackVisible: false,
    });
  }, []);

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

  return (
    <View>
      <Header />
      <HistoryView mockIssues={issues} />
    </View>
  );
}
