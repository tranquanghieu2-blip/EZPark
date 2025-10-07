import { Region } from "react-native-maps";

export const daNangBounds = {
  north: 16.125,
  south: 15.975,
  east: 108.28,
  west: 108.1,
};

export const daNangRegion: Region = {
  latitude: (daNangBounds.north + daNangBounds.south) / 2,
  longitude: (daNangBounds.east + daNangBounds.west) / 2,
  latitudeDelta: daNangBounds.north - daNangBounds.south,
  longitudeDelta: daNangBounds.east - daNangBounds.west,
};
