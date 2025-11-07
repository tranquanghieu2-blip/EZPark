
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

interface User {
  driver_id: number;
  username: string;
  name: string;
  avatar?: string | null;
}

interface Feedback {
  feedback_id: number;
  parking_spot_id: number;
  driver_id: number;
  average_rating: number; 
  friendliness_rating: number;
  security_rating: number;
  space_rating: number;
  comment: string;
  created_at: string; // ISO date string
  updated_at: string;
  Driver: User; // thông tin user
}

interface FeedbackStatistics {
  totalReviews: number;
  avgRating: number;
  avgFriendlinessRating?: number;
  avgSecurityRating?: number;
  avgSpaceRating?: number;
  ratingDistribution?: {
    fiveStar: number;
    fourStar: number;
    threeStar: number;
    twoStar: number;
    oneStar: number;
  }
}

type SearchParkingSpotWithStats = SearchParkingSpot & {
  statistics: FeedbackStatistics;
};

type ParkingSpotDetailWithStats = ParkingSpotDetail & {
  distance?: number;
  statistics: FeedbackStatistics;
};

interface ListFeedback {
  feedbacks: Feedback[];
  hasMore?: boolean;
  limit?: number;
  offset?: number;
  total?: number
};

interface getListFavoriteParkingSpots {
  favorite_id: number;
  driver_id: number;
  parking_spot_id: number;
  name: string;
  address: string;
  type: "parking hub" | "on street parking";
  created_at: string;
};