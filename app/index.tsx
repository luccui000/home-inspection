import { Redirect } from 'expo-router';
import { View } from 'react-native';

export default function App() {
  return (
    <View>
      <Redirect href={'/checklist'}></Redirect>
    </View>
  );
}
