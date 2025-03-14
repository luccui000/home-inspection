import { View, Text, SafeAreaView, StyleSheet } from 'react-native';

export default function SettingTab() {
  return (
    <SafeAreaView style={style.conatainer}>
      <Text>Comming soon</Text>
    </SafeAreaView>
  );
}

const style = StyleSheet.create({
  conatainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 40,
    fontWeight: 'bold',
  },
});
