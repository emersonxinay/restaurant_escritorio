import { io, Socket } from 'socket.io-client';

const IS_TAURI = typeof window !== 'undefined' && (!!(window as any).__TAURI_INTERNALS__ || window.location.hostname === 'tauri.localhost' || window.location.protocol === 'tauri:');
const SOCKET_URL = (import.meta as any).env.VITE_SOCKET_URL || (IS_TAURI ? 'http://localhost:14234' : window.location.origin);

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: true,
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('[Socket] Connected to server');
});

socket.on('disconnect', () => {
  console.log('[Socket] Disconnected from server');
});
