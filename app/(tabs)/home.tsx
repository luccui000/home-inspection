import Header from '@/components/Home/Header';
import ScanView from '@/components/Home/ScanView';
import { View, StyleSheet } from 'react-native';
import { View as IView } from '../types/type';

export default function HomeTab() {
  const views: IView[] = [
    {
      id: 1,
      name: 'Front View',
      image: `https://api.a0.dev/assets/image?text=2D%20House%20Blueprint%20-%20Front%20View&aspect=16:9&seed=1234`,
    },
    {
      id: 2,
      name: 'Right View',
      image: `https://api.a0.dev/assets/image?text=2D%20House%20Blueprint%20-%20Right%20Side%20View&aspect=16:9&seed=2345`,
    },
    {
      id: 3,
      name: 'Back View',
      image: `https://api.a0.dev/assets/image?text=2D%20House%20Blueprint%20-%20Back%20View&aspect=16:9&seed=3456`,
    },
    {
      id: 4,
      name: 'Left View',
      image: `https://api.a0.dev/assets/image?text=2D%20House%20Blueprint%20-%20Left%20Side%20View&aspect=16:9&seed=4567`,
    },
  ];

  return (
    <View style={styles.container}>
      <Header />
      <ScanView views={views} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  scanView: {
    flex: 1,
  },
});
