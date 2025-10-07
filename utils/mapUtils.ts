import { Region } from "react-native-maps";
import { daNangBounds, daNangRegion } from "@/constants/mapBounds";

export const clampRegionToDaNang = (reg: Region): Region => {
  let { latitude, longitude, latitudeDelta, longitudeDelta } = reg;

  if (longitudeDelta > daNangRegion.longitudeDelta) {
    latitudeDelta = daNangRegion.latitudeDelta;
    longitudeDelta = daNangRegion.longitudeDelta;
  }

  if (latitudeDelta < 0.0001) latitudeDelta = 0.0001;
  if (longitudeDelta < 0.0001) longitudeDelta = 0.0001;

  const halfLat = latitudeDelta / 2;
  const halfLon = longitudeDelta / 2;

  if (latitude - halfLat < daNangBounds.south) latitude = daNangBounds.south + halfLat;
  if (latitude + halfLat > daNangBounds.north) latitude = daNangBounds.north - halfLat;
  if (longitude - halfLon < daNangBounds.west) longitude = daNangBounds.west + halfLon;
  if (longitude + halfLon > daNangBounds.east) longitude = daNangBounds.east - halfLon;

  return { latitude, longitude, latitudeDelta, longitudeDelta };
};
