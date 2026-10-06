import { io } from 'socket.io-client';

const baseUrl = import.meta.env.VITE_BASE_SERVER;

const socket = io(`${baseUrl}`, {
  transports: ['websocket']
});

export default socket;
