
import api from '@/service/apiClient';
import { normalizeFilePath } from '@/utils/normalizeFilePath';
import { UserLocation } from '@rnmapbox/maps';

import { Linking } from 'react-native';
export const API_CONFIG = {
  BASE_URL: 'https://ezpark-9gnn.onrender.com/api',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
};

export const fetchNoParkingRoutes = async (): Promise<NoParkingRoute[]> => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/no-parking-routes`, {
      method: 'GET',
      headers: API_CONFIG.headers,
    });
    if (!response.ok) {
      throw new Error(`Error fetching routes: ${response.statusText}`);
    }
    const data = await response.json();
    // Trả về mảng NoParkingRoute
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};

export const fetchParkingSpots = async (): Promise<ParkingSpot[]> => {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/parking-spots/get-all`,
      {
        method: 'GET',
        headers: API_CONFIG.headers,
      },
    );
    if (!response.ok) {
      throw new Error(`Error fetching routes: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};

export const fetchParkingSpotDetail = async (
  parkingSpotId: number,
): Promise<ParkingSpotDetail> => {
  console.log('Fetching details for parking spot ID:', parkingSpotId);
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/parking-spots/get-info-by-id?parking_spot_id=${parkingSpotId}`,
      {
        method: 'GET',
        headers: API_CONFIG.headers,
      },
    );

    if (!response.ok) {
      throw new Error(
        `Error fetching parking spot detail: ${response.statusText}`,
      );
    }
    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Fetch error:', error.message || error);
    throw error;
  }
};

export async function updateNoParkingRouteGeometry(
  no_parking_route_id: number,
  geometry: any,
) {
  const res = await fetch(
    `${API_CONFIG.BASE_URL}/no-parking-routes/add-route-data`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ no_parking_route_id, route: geometry }),
    },
  );

  const json = await res.json();

  if (!res.ok) {
    console.error('❌ Lỗi cập nhật route:', json);
    throw new Error(json?.msg || 'Failed to update route geometry');
  }

  // In rõ ràng ra console
  console.log('✅ Kết quả API add-route-data:', json.data.route);

  return json;
}

export const searchParkingSpot = async ({
  nameParking,
  latitude,
  longitude,
  page = 1,
  limit = 5,
  offset = 0,
  type,
  avgRating,
}: {
  nameParking: string;
  latitude: number;
  longitude: number;
  page?: number;
  limit?: number;
  offset?: number;
  type?: string;
  avgRating?: number;
}): Promise<SearchParkingSpot[]> => {
  const url = `${API_CONFIG.BASE_URL}/parking-spots/search?query=${nameParking}&lat=${latitude}&lng=${longitude}&page=${page}&limit=${limit}&offset=${offset}&type=${type}&rate=${avgRating}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: API_CONFIG.headers,
  });

  if (!response.ok) {
    throw new Error(`Error fetching parking spots: ${response.statusText}`);
  }

  return await response.json();
};

export async function signUp(email: string, password: string, name: string) {
  const res = await fetch(`${API_CONFIG.BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, name }),
  });

  const json = await res.json();

  if (!res.ok) {
    console.error('Lỗi đăng ký:', json);
    throw new Error(json?.message || 'Đăng ký thất bại');
  }
  return json;
}

export async function verifyOtp(email: string, otp: string) {
  const res = await fetch(`${API_CONFIG.BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, otp }),
  });

  const json = await res.json();

  if (!res.ok) {
    console.error('Lỗi xác thực otp:', json);
    throw new Error(json?.msg || 'Failed to verify otp');
  }
  return json;
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_CONFIG.BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const json = await res.json();

  if (!res.ok) {
    console.error('Lỗi đăng nhập:', json);
    throw new Error(json?.msg || 'Failed to login');
  }
  return json;
}
export async function GGLogin() {
  Linking.openURL(`${API_CONFIG.BASE_URL}/auth/google`);
}

const buildFeedbackPayload = (data: {
  parking_spot_id: number;
  friendliness_rating: number;
  space_rating: number;
  security_rating: number;
  comment: string;
}) => ({
  parking_spot_id: data.parking_spot_id,
  friendliness_rating: data.friendliness_rating,
  space_rating: data.space_rating,
  security_rating: data.security_rating,
  comment: data.comment.trim(),
});

const handleApiError = (action: string, error: any) => {
  console.error(` Error ${action} feedback:`, error);
  if (error.response) {
    throw new Error(
      error.response.data?.message || `Server error when ${action} feedback`,
    );
  } else {
    throw new Error(`Network error when ${action} feedback`);
  }
};

export const createFeedback = async (feedback: {
  parking_spot_id: number;
  friendliness_rating: number;
  space_rating: number;
  security_rating: number;
  comment: string;
}) => {
  try {
    const payload = buildFeedbackPayload(feedback);
    const res = await api.post('/feedbacks/create', payload);
    return res.data.data;
  } catch (error) {
    handleApiError('creating', error);
  }
};

export const updateFeedback = async (
  feedback_id: number,
  feedback: {
    parking_spot_id: number;
    friendliness_rating: number;
    space_rating: number;
    security_rating: number;
    comment: string;
  },
) => {
  try {
    const payload = buildFeedbackPayload(feedback);
    const res = await api.put(`/feedbacks/update/${feedback_id}`, payload);
    return res.data.data;
  } catch (error) {
    handleApiError('updating', error);
  }
};

export const deleteFeedback = async (feedback_id: number) => {
  try {
    const res = await api.delete(`/feedbacks/delete/${feedback_id}`);
    return res.data.data;
  } catch (error) {
    handleApiError('deleting', error);
  }
};

export const getMyFeedback = async (parking_spot_id: number) => {
  try {
    const res = await api.get(`/feedbacks/my-feedback/${parking_spot_id}`);
    return res.data.data;
  } catch (error) {
    handleApiError('fetching my', error);
  }
};

// 🟦 Lấy danh sách feedback (có phân trang)
export const getListFeedback = async (
  parkingSpotId: number,
  limit = 5,
  offset = 0,
): Promise<ListFeedback> => {
  try {
    const response = await api.get(`/feedbacks/all/${parkingSpotId}`, {
      params: { limit, offset },
    });
    return response.data.data;
  } catch (error) {
    handleApiError('fetching feedback list', error);
    throw error;
  }
};

export const getFeedbackStatistic = async (
  parkingSpotId: number,
): Promise<FeedbackStatistics> => {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/feedbacks/statistics/${parkingSpotId}`,
      {
        method: 'GET',
        headers: API_CONFIG.headers,
      },
    );

    if (!response.ok) {
      throw new Error(`Error get feedback statistics: ${response.statusText}`);
    }

    const res = await response.json();
    return res.data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};

export const fetchUserProfile = async (): Promise<User> => {
  try {
    const res = await api.get('/user/profile');
    return res.data?.data as User;
  } catch (error) {
    handleApiError('fetching user profile', error);
    throw error; // ✅ Nên ném lỗi ra để component có thể bắt và xử lý
  }
};

export const updateUserProfile = async (profileData: {
  name?: string;
  avatar?: { uri: string; type?: string; fileName?: string } | null;
}): Promise<User> => {
  try {
    const formData = new FormData();

    if (profileData.name) {
      formData.append('name', profileData.name);
    }

    if (profileData.avatar) {
      const fileUri = await normalizeFilePath(profileData.avatar.uri);
      formData.append('avatar', {
        uri: fileUri,
        type: profileData.avatar.type || 'image/jpeg',
        name: profileData.avatar.fileName || 'avatar.jpg',
      } as any);
    }

    const res = await api.put(`/user/profile`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return res.data.data as User;
  } catch (error: any) {
    console.error('Lỗi updateUserProfile:', error?.response?.data || error);
    throw error;
  }
};

export const addFavoriteParkingSpot = async (parking_spot_id: number) => {
  try {
    const res = await api.post(`/favorites/`, { parking_spot_id });
    return res.data.data;
  } catch (error) {
    handleApiError('adding favorite parking spot', error);
  }
};

export const removeFavoriteParkingSpot = async (parking_spot_id: number) => {
  try {
    await api.delete(`/favorites/delete/${parking_spot_id}`);
  } catch (error) {
    handleApiError('removing favorite parking spot', error);
  }
};

export const getListFavoriteParkingSpots = async (): Promise<
  getListFavoriteParkingSpots[]
> => {
  try {
    const res = await api.get('/favorites/list');
    return res.data.data;
  } catch (error) {
    handleApiError('fetching favorite parking spots', error);
    throw error;
  }
};

// export const checkFavoriteParkingSpot = async (
//   parking_spot_id: number,
// ): Promise<{ isFavorite: boolean; favoriteId: number | null }> => {
//   try {
//     const res = await api.get(`/favorites/check/${parking_spot_id}`);
//     const favoriteId = res.data.data; // API trả về favoriteId hoặc null
    
//     return {
//       isFavorite: !!favoriteId, // true nếu có favoriteId, false nếu null
//       favoriteId: favoriteId || null
//     };
//   } catch (error) {
//     handleApiError("Checking favorite status", error);
//     throw error;
//   }
// };
export const checkFavoriteParkingSpot = async (
  parking_spot_id: number,
): Promise<{ isFavorite: boolean; favoriteId: number | null }> => {
  try {
    const res = await api.get(`/favorites/check/${parking_spot_id}`);

    const favoriteId = res.data?.data?.favorite_id ?? null;

    return {
      favoriteId,
      isFavorite: !!favoriteId,
    };
  } catch (error) {
    handleApiError("Checking favorite status", error);
    throw error;
  }
};



export const updatePassword = async (passwordData: {
  currentPassword: string;
  newPassword: string;
  refreshToken?: string;
}) => {
  try {
    const res = await api.put('/auth/change-password', passwordData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return res.data;
  } catch (error: any) {
    console.error(
      'Lỗi updatePassword:',
      error?.response?.data.message || error,
    );
    throw error;
  }
};

export const sendPasswordResetOtp = async (email: string) => {
  try {
    const res = await fetch(`${API_CONFIG.BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const json = await res.json();

    if (!res.ok || !json.success) {  
      console.error('Lỗi sendPasswordResetOtp:', json);
      throw new Error(json?.message || 'Failed to send password reset OTP');
    }

    return json;
  } catch (error) {
    console.error('Lỗi sendPasswordResetOtp:', error);
    throw new Error('Network or server error while sending OTP');
  }
};


export const verifyPasswordResetOtp = async (email: string, resetOTP: string) => {
  try {
    const res = await fetch(`${API_CONFIG.BASE_URL}/auth/verify-reset-otp`, {
      method: 'POST',
      headers: API_CONFIG.headers,
      body: JSON.stringify({ email, resetOTP }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      console.error('Lỗi verifyPasswordResetOtp:', json);
      throw new Error(json?.message || 'Failed to verify password reset OTP');
    }
    return json;
  } catch (error: any) {
    console.error(
      'Lỗi verifyPasswordResetOtp:',
      error?.response?.data.message || error,
    );
    throw error;
  }
};

export const resetPassword = async (
  email: string,
  resetToken: string,
  newPassword: string
) => {
  try {
    const res = await fetch(`${API_CONFIG.BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: API_CONFIG.headers,
      body: JSON.stringify({ email, resetToken, newPassword }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      console.error('Lỗi resetPassword:', json);
      throw new Error(json?.message || 'Failed to reset password');
    }
    return json;
  } catch (error: any) {
    console.error(
      'Lỗi resetPassword:',
      error?.response?.data.message || error,
    );
    throw error;
  }
};

export const fetchPredictionForParkingSpot = async (
  parking_spot_id: number,
  day_predict: Date
): Promise<PredictionForParkingSpot> => {
  try {
    console.log('Fetching prediction for parking spot ID:', parking_spot_id, 'for day:', day_predict);
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/predictions/parking-spot?parking_spot_id=${parking_spot_id}&day_predict=${day_predict}`,
      {
        method: 'GET',
        headers: API_CONFIG.headers,
      },
    );

    if (!response.ok) {
      throw new Error(
        `Error fetching parking spot prediction: ${response.statusText}`,
      );
    }
    const data = await response.json();
    return data.data;
  } catch (error: any) {
    console.error('Fetch error:', error.message || error);
    throw error;
  }
};

export const fetchHistoryChat = async (session_id?: string): Promise<HistoryChat> => {
  try {
    const url = session_id
      ? `${API_CONFIG.BASE_URL}/chat/history/${session_id}`
      : `${API_CONFIG.BASE_URL}/chat/history`;

    const response = await fetch(url, {
      method: 'GET',
      headers: API_CONFIG.headers,
    });

    if (!response.ok) {
      throw new Error(`Error fetching chat history: ${response.statusText}`);
    }

    const json = await response.json();
    return json?.data ?? json; // fallback nếu backend không có .data
  } catch (error: any) {
    console.error('Fetch history chat error:', error.message || error);
    throw error;
  }
};


export const postChatMessage = async (
  query: string,
  session_id?: string
): Promise<ResponseFromChatbot> => {
  try {
    const body: Record<string, any> = { query };
    if (session_id) body.session_id = session_id;

    const response = await fetch(`${API_CONFIG.BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        ...API_CONFIG.headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Error posting chat message: ${response.statusText}`);
    }

    const json = await response.json();
    return json?.data ?? json;
  } catch (error: any) {
    console.error('Post chat message error:', error.message || error);
    throw error;
  }
};

export const searchNoParkingRoute = async ({
  street,
  latitude,
  longitude,
  page = 1,
  limit = 5,
  offset = 0,
}: {
  street: string;
  latitude: number;
  longitude: number;
  page?: number;
  limit?: number;
  offset?: number;
}): Promise<SearchNoParkingRoute[]> => {
  const url = `${API_CONFIG.BASE_URL}/no-parking-routes/search?street=${street}&lat=${latitude}&lng=${longitude}&page=${page}&limit=${limit}&offset=${offset}`;

  const response = await fetch(url, {
    method: "GET",
    headers: API_CONFIG.headers,
  });

  if (!response.ok) {
    throw new Error(`Error fetching parking spots: ${response.statusText}`);
  }

  const json = await response.json();
  return json.data;                   
};

