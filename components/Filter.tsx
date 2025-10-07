import { images } from '@/constants/images'
import React from 'react'
import { ImageBackground, View, Text, TouchableOpacity } from 'react-native'
import { IconFilter } from './Icons'

interface Props {
  onPress?: () => void;
}

const Filter = ({ onPress }: Props) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <ImageBackground
        source={images.bottomNavItem}
        className="h-[50px] rounded-xl overflow-hidden justify-center items-center"
      >

        <IconFilter size={20} color="#fff" />


      </ImageBackground>
    </TouchableOpacity>
  );
};

export default Filter;
