// import React, { useState, useRef } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   Image,
//   Dimensions,
//   Modal,
//   ScrollView,
//   TextInput,
//   Animated,
//   Pressable,
//   GestureResponderEvent,
//   SafeAreaView, // thay đổi dòng import này
//   Platform,
// } from 'react-native';
// import { useNavigation } from '@react-navigation/native';
// import {
//   AntDesign,
//   MaterialIcons,
//   Ionicons,
//   Feather,
// } from '@expo/vector-icons';
// import * as ImagePicker from 'expo-image-picker';

// const { width, height } = Dimensions.get('window');

// export default function HomeScreen() {
//   const [currentViewIndex, setCurrentViewIndex] = useState(0);
//   const [showIssueModal, setShowIssueModal] = useState(false);
//   const [selectedPoint, setSelectedPoint] = useState({ x: 0, y: 0 });
//   const [issueText, setIssueText] = useState('');
//   const [issueType, setIssueType] = useState('structural');
//   const [capturedImage, setCapturedImage] = useState<string | null>(null);
//   const slideAnim = useRef(new Animated.Value(height)).current;

//   const navigation = useNavigation();

//   const views = [
//     {
//       name: 'Front View',
//       image: `https://api.a0.dev/assets/image?text=2D%20House%20Blueprint%20-%20Front%20View&aspect=16:9&seed=1234`,
//     },
//     {
//       name: 'Right View',
//       image: `https://api.a0.dev/assets/image?text=2D%20House%20Blueprint%20-%20Right%20Side%20View&aspect=16:9&seed=2345`,
//     },
//     {
//       name: 'Back View',
//       image: `https://api.a0.dev/assets/image?text=2D%20House%20Blueprint%20-%20Back%20View&aspect=16:9&seed=3456`,
//     },
//     {
//       name: 'Left View',
//       image: `https://api.a0.dev/assets/image?text=2D%20House%20Blueprint%20-%20Left%20Side%20View&aspect=16:9&seed=4567`,
//     },
//   ];

//   const issueTypes = [
//     { id: 'structural', label: 'Structural' },
//     { id: 'electrical', label: 'Electrical' },
//     { id: 'plumbing', label: 'Plumbing' },
//     { id: 'finishing', label: 'Finishing' },
//     { id: 'other', label: 'Other' },
//   ];

//   const handlePrevView = () => {
//     setCurrentViewIndex((prev) => (prev === 0 ? views.length - 1 : prev - 1));
//   };

//   const handleNextView = () => {
//     setCurrentViewIndex((prev) => (prev === views.length - 1 ? 0 : prev + 1));
//   };

//   const handleBlueprintPress = (event: GestureResponderEvent) => {
//     const { locationX, locationY } = event.nativeEvent;
//     setSelectedPoint({ x: locationX, y: locationY });

//     // Show modal with animation
//     setShowIssueModal(true);
//     Animated.timing(slideAnim, {
//       toValue: 0,
//       duration: 300,
//       useNativeDriver: true,
//     }).start();
//   };

//   const handleCloseModal = () => {
//     Animated.timing(slideAnim, {
//       toValue: height,
//       duration: 300,
//       useNativeDriver: true,
//     }).start(() => {
//       setShowIssueModal(false);
//       setIssueText('');
//       setIssueType('structural');
//       setCapturedImage(null);
//     });
//   };

//   const takePicture = async () => {
//     const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

//     if (permissionResult.granted === false) {
//       alert('You need to grant camera permission to take pictures');
//       return;
//     }

//     const result = await ImagePicker.launchCameraAsync({
//       allowsEditing: true,
//       aspect: [4, 3],
//       quality: 1,
//     });

//     if (!result.canceled) {
//       setCapturedImage(result.assets[0].uri);
//     }
//   };

//   const handleSaveIssue = () => {
//     // Here you would typically save the issue to a database
//     // For now, we'll just close the modal

//     // Create a new issue object
//     const newIssue = {
//       id: Date.now().toString(),
//       type: issueType,
//       description: issueText,
//       image: capturedImage,
//       position: selectedPoint,
//       viewIndex: currentViewIndex,
//       viewName: views[currentViewIndex].name,
//       timestamp: new Date().toISOString(),
//     };

//     // In a real app, you would add this to your issues state or dispatch to a store
//     // For now, we'll just log it
//     console.log('Saved issue:', newIssue);

//     handleCloseModal();
//   };

//   const navigateToHistory = () => {
//     navigation.navigate('history/index' as never);
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.header}>
//         <Text style={styles.title}>2D House Blueprint Viewer</Text>
//         <TouchableOpacity
//           style={styles.historyButton}
//           onPress={navigateToHistory}
//         >
//           <MaterialIcons name="history" size={24} color="#fff" />
//           <Text style={styles.historyButtonText}>History</Text>
//         </TouchableOpacity>
//       </View>

//       <View style={styles.viewName}>
//         <Text style={styles.viewNameText}>{views[currentViewIndex].name}</Text>
//       </View>

//       <View style={styles.blueprintContainer}>
//         <TouchableOpacity
//           style={styles.navigationArrow}
//           onPress={handlePrevView}
//         >
//           <AntDesign name="left" size={36} color="#fff" />
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={styles.blueprintTouchable}
//           onPress={handleBlueprintPress}
//           activeOpacity={0.9}
//         >
//           <Image
//             source={{ uri: views[currentViewIndex].image }}
//             style={styles.blueprintImage}
//             resizeMode="contain"
//           />
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={[styles.navigationArrow, styles.rightArrow]}
//           onPress={handleNextView}
//         >
//           <AntDesign name="right" size={36} color="#fff" />
//         </TouchableOpacity>
//       </View>

//       {/* Issue Modal */}
//       <Modal
//         visible={showIssueModal}
//         transparent={true}
//         animationType="none"
//         onRequestClose={handleCloseModal}
//       >
//         <View style={styles.modalOverlay}>
//           <Animated.View
//             style={[
//               styles.modalContent,
//               { transform: [{ translateY: slideAnim }] },
//             ]}
//           >
//             <View style={styles.modalHeader}>
//               <Text style={styles.modalTitle}>Add Issue</Text>
//               <TouchableOpacity onPress={handleCloseModal}>
//                 <AntDesign name="close" size={24} color="#333" />
//               </TouchableOpacity>
//             </View>

//             <ScrollView style={styles.modalScrollView}>
//               <Text style={styles.modalLabel}>Selected Position</Text>
//               <View style={styles.coordinatesContainer}>
//                 <Text style={styles.coordinates}>
//                   X: {Math.round(selectedPoint.x)}, Y:{' '}
//                   {Math.round(selectedPoint.y)}
//                 </Text>
//                 <Text style={styles.viewLabel}>
//                   {views[currentViewIndex].name}
//                 </Text>
//               </View>

//               <Text style={styles.modalLabel}>Issue Type</Text>
//               <ScrollView
//                 horizontal
//                 showsHorizontalScrollIndicator={false}
//                 contentContainerStyle={styles.issueTypesContainer}
//               >
//                 {issueTypes.map((type) => (
//                   <TouchableOpacity
//                     key={type.id}
//                     style={[
//                       styles.issueTypeButton,
//                       issueType === type.id && styles.selectedIssueType,
//                     ]}
//                     onPress={() => setIssueType(type.id)}
//                   >
//                     <Text
//                       style={[
//                         styles.issueTypeText,
//                         issueType === type.id && styles.selectedIssueTypeText,
//                       ]}
//                     >
//                       {type.label}
//                     </Text>
//                   </TouchableOpacity>
//                 ))}
//               </ScrollView>

//               <Text style={styles.modalLabel}>Description</Text>
//               <TextInput
//                 style={styles.issueInput}
//                 multiline
//                 placeholder="Describe the issue here..."
//                 value={issueText}
//                 onChangeText={setIssueText}
//               />

//               <Text style={styles.modalLabel}>Photo Evidence</Text>
//               {capturedImage ? (
//                 <View style={styles.capturedImageContainer}>
//                   <Image
//                     source={{ uri: capturedImage }}
//                     style={styles.capturedImage}
//                   />
//                   <TouchableOpacity
//                     style={styles.retakeButton}
//                     onPress={takePicture}
//                   >
//                     <Feather name="camera" size={16} color="#fff" />
//                     <Text style={styles.retakeButtonText}>Retake</Text>
//                   </TouchableOpacity>
//                 </View>
//               ) : (
//                 <TouchableOpacity
//                   style={styles.takePictureButton}
//                   onPress={takePicture}
//                 >
//                   <Ionicons name="camera-outline" size={24} color="#fff" />
//                   <Text style={styles.takePictureText}>Take Picture</Text>
//                 </TouchableOpacity>
//               )}
//             </ScrollView>

//             <View style={styles.modalFooter}>
//               <TouchableOpacity
//                 style={styles.cancelButton}
//                 onPress={handleCloseModal}
//               >
//                 <Text style={styles.cancelButtonText}>Cancel</Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={styles.saveButton}
//                 onPress={handleSaveIssue}
//               >
//                 <Text style={styles.saveButtonText}>Save Issue</Text>
//               </TouchableOpacity>
//             </View>
//           </Animated.View>
//         </View>
//       </Modal>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#1a1a1a', // Thay đổi màu nền chính
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     backgroundColor: '#2c3e50',
//     paddingVertical: 8, // Giảm padding
//     paddingHorizontal: 20,
//     paddingTop: Platform.OS === 'ios' ? 40 : 8, // Điều chỉnh padding top cho iOS
//   },
//   title: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#fff',
//   },
//   historyButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#34495e',
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderRadius: 20,
//   },
//   historyButtonText: {
//     color: '#fff',
//     marginLeft: 5,
//     fontWeight: '600',
//   },
//   viewName: {
//     alignItems: 'center',
//     padding: 5, // Giảm padding
//     backgroundColor: '#2c3e50', // Thêm màu nền
//   },
//   viewNameText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   blueprintContainer: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#1a1a1a',
//     marginTop: 0, // Đảm bảo không có margin
//   },
//   navigationArrow: {
//     padding: 10,
//     zIndex: 10,
//     backgroundColor: 'rgba(0,0,0,0.3)',
//     borderRadius: 30,
//     margin: 10,
//   },
//   rightArrow: {
//     right: 0,
//   },
//   blueprintTouchable: {
//     flex: 1,
//     height: '100%',
//     justifyContent: 'center',
//   },
//   blueprintImage: {
//     width: '100%',
//     height: '100%',
//   },
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.5)',
//     justifyContent: 'flex-end',
//   },
//   modalContent: {
//     backgroundColor: '#fff',
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     height: height * 0.9,
//     paddingBottom: 20,
//   },
//   modalHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//     padding: 15,
//   },
//   modalTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
//   modalScrollView: {
//     padding: 15,
//   },
//   modalLabel: {
//     fontSize: 16,
//     fontWeight: '600',
//     marginTop: 15,
//     marginBottom: 8,
//     color: '#333',
//   },
//   coordinatesContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     backgroundColor: '#f0f0f0',
//     padding: 10,
//     borderRadius: 8,
//   },
//   coordinates: {
//     fontSize: 14,
//     color: '#555',
//   },
//   viewLabel: {
//     fontSize: 14,
//     color: '#555',
//     fontWeight: '500',
//   },
//   issueTypesContainer: {
//     paddingVertical: 5,
//   },
//   issueTypeButton: {
//     backgroundColor: '#f0f0f0',
//     paddingHorizontal: 15,
//     paddingVertical: 8,
//     borderRadius: 20,
//     marginRight: 10,
//     marginBottom: 5,
//   },
//   selectedIssueType: {
//     backgroundColor: '#2c3e50',
//   },
//   issueTypeText: {
//     color: '#555',
//   },
//   selectedIssueTypeText: {
//     color: '#fff',
//   },
//   issueInput: {
//     backgroundColor: '#f0f0f0',
//     borderRadius: 8,
//     padding: 10,
//     height: 100,
//     textAlignVertical: 'top',
//   },
//   takePictureButton: {
//     backgroundColor: '#3498db',
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 15,
//     borderRadius: 8,
//     marginTop: 10,
//   },
//   takePictureText: {
//     color: '#fff',
//     fontWeight: '600',
//     marginLeft: 10,
//   },
//   capturedImageContainer: {
//     marginTop: 10,
//     position: 'relative',
//   },
//   capturedImage: {
//     width: '100%',
//     height: 200,
//     borderRadius: 8,
//   },
//   retakeButton: {
//     position: 'absolute',
//     right: 10,
//     bottom: 10,
//     backgroundColor: 'rgba(0,0,0,0.6)',
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 8,
//     borderRadius: 20,
//   },
//   retakeButtonText: {
//     color: '#fff',
//     marginLeft: 5,
//     fontSize: 12,
//   },
//   modalFooter: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     paddingHorizontal: 15,
//     paddingTop: 10,
//     borderTopWidth: 1,
//     borderTopColor: '#eee',
//   },
//   cancelButton: {
//     flex: 1,
//     padding: 15,
//     alignItems: 'center',
//     marginRight: 10,
//     borderWidth: 1,
//     borderColor: '#ddd',
//     borderRadius: 8,
//   },
//   cancelButtonText: {
//     color: '#555',
//     fontWeight: '600',
//   },
//   saveButton: {
//     flex: 1,
//     backgroundColor: '#27ae60',
//     padding: 15,
//     alignItems: 'center',
//     borderRadius: 8,
//   },
//   saveButtonText: {
//     color: '#fff',
//     fontWeight: '600',
//   },
// });
