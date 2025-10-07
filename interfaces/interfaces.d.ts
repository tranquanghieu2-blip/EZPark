interface ParkingSpot {
  parking_spot_id: number;
  latitude: number;
  longitude: number;
}

interface TimeRange {
  start: string;   // ví dụ "06:00:00"
  end: string;     // ví dụ "08:00:00"
}

interface NoParkingRoute {
  no_parking_route_id: number;
  street: string;
  description: string;
  location_begin: [number, number]; // [longitude, latitude]
  location_end: [number, number];   // [longitude, latitude]
  // geometry theo chuẩn GeoJSON
  route: {
    type: "LineString";
    coordinates: [number, number][];
  };
  time_range: TimeRange[]; // nhiều khoảng giờ trong ngày
  side: "both" | "odd" | "even";
  type: "no parking" | "no stopping" | "alternate days";
  days_restricted: string[];        // danh sách các ngày
}


interface ParkingSpotDetail {
  parking_spot_id: number;
  name: string;
  address: string;
  type: "parking hub" | "on street parking";
  capacity: number;
  description: string;
  latitude: number;
  longitude: number;
}

interface SearchParkingSpot {
  parking_spot_id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance?: number;
  type: "parking hub" | "on street parking";
}