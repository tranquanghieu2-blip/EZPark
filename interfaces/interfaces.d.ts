
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

interface PredictionForParkingSpot {
  parking_spot_id: number;
  name: string;
  address: string;
  predicted_for: string; // ISO date string
  prediction: {
    availability_percentage: string;
    is_holiday: boolean;
    calculated_at: string; // ISO date string
  }
}

interface SearchParkingSpot {
  parking_spot_id: number;
  name: string;
  address: string;
  capacity: number;
  latitude: number;
  longitude: number;
  distance: number | null; // khoảng cách tính bằng km, có thể null nếu chưa tính
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
  distance: number | null;
  statistics: FeedbackStatistics;
  predictionData?: PredictionForParkingSpot;
};

interface SearchNoParkingRoute {
  no_parking_route_id: number;
  street: string;
  description: string;
  time_range: TimeRange[];
  side: "both" | "odd" | "even";
  type: "no parking" | "no stopping" | "alternate days";
  days_restricted: string[];
  distance?: number;
}

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

interface ChatMessage {
  log_id: string;
  user_query: string;
  llm_response: string;
  created_at: string;
  intent?: string;
  search_method?: string;
  parking_spots?: ParkingSpotDetail[];
};

interface SessionInfo {
  first_message_at: string;
  last_activity_at: string;
  message_count: number;
  is_expired: boolean;
  hours_since_activity: number;
};

interface HistoryChat {
  session_id: number;
  session_info: SessionInfo;
  messages: ChatMessage[];
};

interface ResponseFromChatbot {
  session_id: number;
  session_status: string;
  query: string;
  response: string;
  parking_spots: ParkingSpotDetail[];
  no_parking_routes: NoParkingRoute[];
  timestamp: string;
}

type Message = {
  id: string;
  from: "user" | "bot";
  text: string;
  time: string; // thêm thời gian gửi
};