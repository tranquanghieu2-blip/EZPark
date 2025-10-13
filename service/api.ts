export const API_CONFIG = {
  BASE_URL: "https://ezpark-9gnn.onrender.com/api",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
};

export const fetchNoParkingRoutes = async (): Promise<NoParkingRoute[]> => {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/no-parking-routes`,
      {
        method: "GET",
        headers: API_CONFIG.headers,
      }
    );
    if (!response.ok) {
      throw new Error(`Error fetching routes: ${response.statusText}`);
    }
    const data = await response.json();
    // Trả về mảng NoParkingRoute
    return data;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
};


export const fetchParkingSpots = async (): Promise<ParkingSpot[]> => {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/parking-spots/get-all`,
      {
        method: "GET",
        headers: API_CONFIG.headers,
      }
    );
    if (!response.ok) {
      throw new Error(`Error fetching routes: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
};

export const fetchParkingSpotDetail = async (parkingSpotId: number): Promise<ParkingSpotDetail> => {
  console.log("Fetching details for parking spot ID:", parkingSpotId);
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/parking-spots/get-info-by-id?parking_spot_id=${parkingSpotId}`,
      {
        method: "GET",
        headers: API_CONFIG.headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Error fetching parking spot detail: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
};

export async function updateNoParkingRouteGeometry(
  no_parking_route_id: number,
  geometry: any
) {
  const res = await fetch(
    `${API_CONFIG.BASE_URL}/no-parking-routes/add-route-data`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ no_parking_route_id, route: geometry }),
    }
  );

  const json = await res.json();

  if (!res.ok) {
    console.error("❌ Lỗi cập nhật route:", json);
    throw new Error(json?.msg || "Failed to update route geometry");
  }

  // In rõ ràng ra console
  console.log("✅ Kết quả API add-route-data:", json.data.route);

  return json;
}


export const searchParkingSpot = async ({
  nameParking,
  latitude,
  longitude,
  page = 1,
  limit = 5,
  offset = 0,
  type
}: {
  nameParking: string;
  latitude: number;
  longitude: number;
  page?: number;
  limit?: number;
  offset?: number;
  type?: string;
}): Promise<SearchParkingSpot[]> => {
  const url = `${API_CONFIG.BASE_URL}/parking-spots/search?query=${nameParking}&lat=${latitude}&lng=${longitude}&page=${page}&limit=${limit}&offset=${offset}&type=${type}`;

  const response = await fetch(url, {
    method: "GET",
    headers: API_CONFIG.headers,
  });

  if (!response.ok) {
    throw new Error(`Error fetching parking spots: ${response.statusText}`);
  }

  return await response.json();
};



export async function signUp(
  email: string,
  password: string,
  name: string
) {
  const res = await fetch(`${API_CONFIG.BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password, name }),
  });

  const json = await res.json();

  if (!res.ok) {
    console.error("Lỗi đăng ký:", json);
    throw new Error(json?.message || "Đăng ký thất bại");
  }
  return json;
}

export async function verifyOtp(
  email: string,
  otp: string,
) {
  const res = await fetch(`${API_CONFIG.BASE_URL}/auth/verify-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, otp}),
  });

  const json = await res.json();

  if (!res.ok) {
    console.error("Lỗi xác thực otp:", json);
    throw new Error(json?.msg || "Failed to verify otp");
  }
  return json;
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_CONFIG.BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const json = await res.json();

  if (!res.ok) {
    console.error("Lỗi đăng nhập:", json);
    throw new Error(json?.msg || "Failed to login");
  }
  return json;
}
export async function GGLogin() {
  try {
    const res = await fetch(`${API_CONFIG.BASE_URL}/auth/google`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) throw new Error("Login failed");
    const data = await res.json();

    // Backend trả URL redirect đến Google
    if (data.url) {
      window.location.href = data.url;
    } else {
      console.error("Missing redirect URL from backend");
    }
  } catch (error) {
    console.error("Google login error:", error);
  }
}
