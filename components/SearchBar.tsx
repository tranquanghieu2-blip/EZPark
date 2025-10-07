import { View, Text, Image, TextInput } from 'react-native'
import React from 'react'
import { IconSearch } from './Icons';
import { ImageBackground } from 'react-native';
import { images } from '@/constants/images';

interface Props {
  placeholder: string;
  onPress?: () => void;
  value?: string;
  onChangeText?: (text: string) => void;
}

const SearchBar = ({ placeholder, onPress, value, onChangeText }: Props) => {
  return (
    <View className='absolute top-2 left-0 right-0 z-10 flex-row items-center bg-secondary rounded-[10px] px-3 overflow-hidden mx-4 my-2 h-[55px]
    border border-gray-400 shadow-2xl'>
      <TextInput
        onPress={onPress}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor="gray"
        className='flex-1 ml-2 text-black'>
      </TextInput>
      <ImageBackground
        source={images.bottomNavItem}
        className="min-w-[50px] h-[80%] rounded-lg overflow-hidden justify-center items-center">
        <IconSearch size={20} color="#fff" />
      </ImageBackground>

    </View>
  )
}

export default SearchBar