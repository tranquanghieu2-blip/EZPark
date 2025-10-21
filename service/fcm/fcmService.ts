import messaging from '@react-native-firebase/messaging';
import DeviceInfo from 'react-native-device-info';
import axios from 'axios';
import { getFcmToken } from '../firebasesetup';

export const API_CONFIG = {
  BASE_URL: "https://ezpark-9gnn.onrender.com/api",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
};

export const registerDevice = async () => {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.warn('Notification permission not granted');
     console.log('Thông báo', 'Quyền thông báo chưa được cấp.');
      return false;
    }

    const fcmToken = await messaging().getToken();
    const deviceId = await DeviceInfo.getUniqueId();

    console.log('registerDevice payload:', { device_id: deviceId, typeof: typeof deviceId, token: fcmToken });

    const res = await fetch(`${API_CONFIG.BASE_URL}/devices/register`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      }, 
      body: JSON.stringify({
        device_id: deviceId,
        token: fcmToken,
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      console.error('Register device failed:', res.status, data);
      const msg = data?.message || 'Đăng ký thiết bị thất bại';
      console.log('Lỗi đăng ký', msg);
      return false;
    }

    console.log('Device registered response:', res.status, data);
    console.log('Thành công', 'Đăng ký thiết bị thành công.');
    return true;
  } catch (error: any) {
    console.error('Register device error:', error);
    console.log('Lỗi', 'Không thể đăng ký thiết bị. Vui lòng thử lại.');
    return false;
  }
};


export const subscribeToRoute = async (routeId: number) => {
  try {
    const fcmToken = await messaging().getToken();
    console.log('subscribeToRoute - fcmToken:', fcmToken);
    if (!fcmToken) {
      console.error('subscribeToRoute - no FCM token available');
      return null;
    }

    const payload = { no_parking_route_id: routeId, fcm_token: fcmToken };
    console.log('subscribeToRoute - payload:', payload);

    const res = await fetch(`${API_CONFIG.BASE_URL}/notifications/schedule`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (e) {
      data = text; // non-JSON response
    }

    console.log('subscribeToRoute - response status:', res.status, 'body:', data);

    if (!res.ok) {
      return null;
    }
    return data; // successful response body
  } catch (error) {
    console.error('subscribeToRoute - error:', error);
    return null;
  }
};
// ...existing code...

// Hủy đăng ký thông báo tuyến đường
export const unsubscribeFromRoute = async () => {
  try {
    const fcmToken = await getFcmToken();
    if (!fcmToken) throw new Error('No FCM token available');
    
    const res = await axios.delete(`${API_CONFIG.BASE_URL}/notifications/cancel/${fcmToken}`);
    return res.status === 200;
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return false;
  }
};


// Hủy thông báo khi người dùng tắt thông báo
export const disableNotifications = async () => {
  try {
    const deviceId = await DeviceInfo.getUniqueId();
    await axios.delete(`${API_CONFIG.BASE_URL}/devices/delete/${deviceId}`);
    return true;
  } catch (error) {
    console.error('Disable notifications error:', error);
    return false;
  }
};
