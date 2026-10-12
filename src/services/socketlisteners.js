import socket from './socket';
import { useUserStore } from '@/store/modules/user';
import { useCheckinStore } from '@/store/modules/checkin';
import { useRefreshStore } from '@/store/modules/refresh';
import { ElNotification } from 'element-plus';

let initialized = false;
let currentLocationId = null;
let connectScheduled = false;

function normalizedLocationId(value) {
  const id = Number(value);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function joinCurrentLocation() {
  if (!socket.connected || !currentLocationId) return;
  socket.emit('join-location', currentLocationId);
}

function connectWhenIdle() {
  if (socket.connected || connectScheduled) return;

  connectScheduled = true;

  const connect = () => {
    connectScheduled = false;

    if (!socket.connected) {
      socket.connect();
    }
  };

  // Let the first page render and its API requests start before opening
  // the realtime connection. timeout guarantees it still connects quickly.
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(connect, { timeout: 1000 });
  } else {
    setTimeout(connect, 0);
  }
}

export function initializeSocketListeners(locationId) {
  currentLocationId = normalizedLocationId(locationId);

  if (!initialized) {
    initialized = true;

    socket.on('connect', joinCurrentLocation);
    socket.on('customer-checkin', NotifyCheckin);
    socket.on('app-refresh', NotifyAppRefresh);
  }

  // If already connected (for example after a location change), join now.
  // Otherwise connect in the background without blocking first render.
  if (socket.connected) {
    joinCurrentLocation();
  } else {
    connectWhenIdle();
  }
}

export function cleanupSocket() {
  socket.off('connect', joinCurrentLocation);
  socket.off('customer-checkin', NotifyCheckin);
  socket.off('app-refresh', NotifyAppRefresh);

  initialized = false;
  currentLocationId = null;
}

function NotifyAppRefresh(data) {
  const userStore = useUserStore();

  if (Number(data?.locationId) !== Number(userStore.locationId)) return;

  const refreshStore = useRefreshStore();
  refreshStore.notify(data?.targets || [], data || {});
}

function NotifyCheckin(data) {
  const userStore = useUserStore();
  const checkinStore = useCheckinStore();

  if (Number(data?.locationId) !== Number(userStore.locationId)) return;

  checkinStore.notifyNewCheckin();

  ElNotification({
    title: `${data.firstname} ${data.lastname}`,
    message: `checked-in at ${new Date().toLocaleTimeString()}`,
    duration: 5000,
    type: 'success',
    progress: true,
    pauseOnHover: false,
    position: 'bottom-right'
  });
}
