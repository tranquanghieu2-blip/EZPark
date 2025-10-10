export const DA_NANG_BOUNDS = {
  north: 16.125,
  south: 15.975,
  east: 108.28,
  west: 108.1,
};

// Tâm bản đồ
export const DA_NANG_CENTER = {
  latitude: (DA_NANG_BOUNDS.north + DA_NANG_BOUNDS.south) / 2,
  longitude: (DA_NANG_BOUNDS.east + DA_NANG_BOUNDS.west) / 2,
};

// Delta (khoảng cách hiển thị)
export const DA_NANG_DELTAS = {
  latitudeDelta: DA_NANG_BOUNDS.north - DA_NANG_BOUNDS.south,
  longitudeDelta: DA_NANG_BOUNDS.east - DA_NANG_BOUNDS.west,
};

// Full object tương đương Region (không dùng Region)
export const DA_NANG_VIEWPORT = {
  latitude: DA_NANG_CENTER.latitude,
  longitude: DA_NANG_CENTER.longitude,
  latitudeDelta: DA_NANG_DELTAS.latitudeDelta,
  longitudeDelta: DA_NANG_DELTAS.longitudeDelta,
};
