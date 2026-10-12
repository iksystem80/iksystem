import { io } from 'socket.io-client';

const baseUrl = import.meta.env.VITE_BASE_SERVER;

// Do not open the socket as soon as this module is imported.
// The app/page can render first; initializeSocketListeners() connects it
// in the background when the browser is idle.
const socket = io(baseUrl, {
  transports: ['websocket', 'polling'],
  autoConnect: false
});

export default socket;
