import { View, Text, ImageBackground, Pressable } from 'react-native'
import React from 'react'
import { IconSearch } from './Icons'
import { images } from '@/constants/images'

interface Props {
  placeholder: string
  onPress?: () => void
  value?: string
}

const SearchBar = ({ placeholder, onPress, value }: Props) => {
  return (
    <Pressable
      onPress={onPress}
      className='absolute top-2 left-0 right-0 z-10 flex-row items-center bg-secondary rounded-[10px] overflow-hidden mx-4 my-2 h-[45px]
      border border-gray-200 shadow-2xl active:opacity-80'
    >
      <View className='flex-1 ml-3'>
        <Text className={value ? 'text-black' : 'text-gray-400'}>
          {value || placeholder}
        </Text>
      </View>

      <ImageBackground
        source={images.bottomNavItem}
        className="min-w-[45px] h-[100%] rounded-lg overflow-hidden justify-center items-center"
      >
        <IconSearch size={20} color="#fff" />
      </ImageBackground>
    </Pressable>
  )
}

export default SearchBar
