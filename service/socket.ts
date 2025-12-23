import io from 'socket.io-client';

// Cấu hình URL backend
const API_URL = 'https://ezpark-9gnn.onrender.com';

// Định nghĩa các event types cho type safety
// interface ServerToClientEvents {
//   notification: (data: any) => void;
//   parking_update: (data: any) => void;
//   route_update: (data: any) => void;
//   chat_message: (data: any) => void;
// }

// interface ClientToServerEvents {
//   join_room: (data: { userId: string }) => void;
//   leave_room: (data: { userId: string }) => void;
//   send_message: (data: any) => void;
// }

// Tạo typed socket instance
const socket = io(API_URL, {
  transports: ['websocket'],
  reconnection: true, // Tự động reconnect khi mất kết nối
//   reconnectionAttempts: 5, // Số lần thử reconnect
//   reconnectionDelay: 1000, // Delay giữa các lần reconnect (ms)
//   timeout: 10000, // Timeout cho connection
  autoConnect: false, // Không tự động connect khi khởi tạo
});

// Event listeners cho debugging
socket.on('connect', () => {
  console.log('✅ Socket connected:', socket.id);
  
  // Tự động join vào room "joinUser" khi kết nối thành công
  socket.emit("joinUser");
  console.log('📩 Joined room: joinUser');
});

// socket.on('disconnect', (reason: string) => {
//   console.log('❌ Socket disconnected:', reason);
// });

// socket.on('connect_error', (error: Error) => {
//   console.error('🔴 Socket connection error:', error.message);
// });

// socket.on('reconnect_attempt', (attemptNumber: number) => {
//   console.log(`🔄 Reconnecting... Attempt ${attemptNumber}`);
// });

// socket.on('reconnect', (attemptNumber: number) => {
//   console.log(`✅ Reconnected after ${attemptNumber} attempts`);
// });

export default socket;
// export type { ServerToClientEvents, ClientToServerEvents };
