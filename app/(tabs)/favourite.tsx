import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { IconFavorite, IconStar } from '@/components/Icons';
import Colors from '@/constants/colors';
import { images } from '@/constants/images';
import api from '@/service/apiClient';
import { StackNavigationProp } from '@react-navigation/stack';
import { mapEvents, EVENT_OPEN_SPOT } from '@/utils/eventEmitter';
import { useAuth } from '../context/AuthContext';
import NoUserLogin from '@/components/NoUserLogin';

const Favourite = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true); // lần đầu load
  const [refreshing, setRefreshing] = useState(false); // khi kéo để reload

  // Nếu chưa đăng nhập
  if (!user) {
    return <NoUserLogin />;
  }

  const typeLabel: Record<'parking hub' | 'on street parking', string> = {
    'parking hub': 'Bãi đỗ xe tập trung',
    'on street parking': 'Đỗ xe ven đường',
  };

  const fetchFavorites = async (showMainLoading = true) => {
    try {
      if (showMainLoading) setLoading(true);
      const response = await api.get('/favorites/list');
      setFavorites(response.data.data);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      if (showMainLoading) setLoading(false);
      setRefreshing(false);
    }
  };

  // Load lại khi màn hình được focus
  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, []),
  );

  // Khi người dùng kéo để reload
  const onRefresh = () => {
    setRefreshing(true);
    fetchFavorites(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-4">
      <Text className="text-2xl font-bold text-gray-900 mt-4">
        Danh sách yêu thích
      </Text>

      {loading ? (
        //Loading lần đầu mở trang
        <View className="flex-1 justify-center items-center mt-10">
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={item => item.favorite_id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="py-4 border-b border-gray-200"
              onPress={() => {
                const spotId = item.parking_spot_id ?? item.id ?? item.spot_id;
                mapEvents.emit(EVENT_OPEN_SPOT, spotId);
                navigation.navigate('index');
              }}
            >
              <View>
                <View className="flex-row justify-between">
                  <Text className="text-lg font-bold text-gray-900 flex-1">
                    {item.name}
                  </Text>
                  <IconFavorite size={18} color={Colors.heart} />
                </View>
                <Text className="text-sm text-gray-600 mt-1">
                  {item.address}
                </Text>
                <Text className="text-sm text-gray-500 mt-1 italic">
                  {typeLabel[item.type as keyof typeof typeLabel] ??
                    'Không xác định'}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          //Loading xoay khi kéo để reload
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center mt-20">
              <Image
                source={images.noData}
                style={{ width: 150, height: 150, resizeMode: 'contain' }}
              />
              <Text className="mt-3 text-lg text-gray-500 text-center">
                Chưa có bãi đỗ yêu thích nào
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default Favourite;
