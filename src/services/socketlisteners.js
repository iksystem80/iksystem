import socket from './socket';
import { useUserStore } from '@/store/modules/user';
import { useCheckinStore } from '@/store/modules/checkin';
import { useRefreshStore } from '@/store/modules/refresh';
import { ElNotification } from 'element-plus';

let initialized = false;
let currentLocationId = null;
let currentCompanyId = null;
let connectScheduled = false;

function normalizedId(value) {
  const id = Number(value);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function joinCurrentContext() {
  if (!socket.connected) return;

  socket.emit('join-user-context', {
    locationId: currentLocationId,
    companyId: currentCompanyId
  });
}

function connectWhenIdle() {
  if (socket.connected || connectScheduled) return;

  connectScheduled = true;

  const connect = () => {
    connectScheduled = false;

    // cleanupSocket() may have run while this idle callback was waiting.
    if (!initialized) return;

    if (!socket.connected) {
      socket.connect();
    }
  };

  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(connect, { timeout: 1000 });
  } else {
    setTimeout(connect, 0);
  }
}

export function initializeSocketListeners(locationId, companyId = null) {
  currentLocationId = normalizedId(locationId);
  currentCompanyId = normalizedId(companyId);

  if (!initialized) {
    initialized = true;

    socket.on('connect', joinCurrentContext);
    socket.on('customer-checkin', NotifyCheckin);
    socket.on('app-refresh', NotifyAppRefresh);
    socket.on('access-status', NotifyAccessStatus);
    socket.on('locations-refresh', NotifyLocationsRefresh);
  }

  if (socket.connected) {
    joinCurrentContext();
  } else {
    connectWhenIdle();
  }
}

export function cleanupSocket() {
  socket.off('connect', joinCurrentContext);
  socket.off('customer-checkin', NotifyCheckin);
  socket.off('app-refresh', NotifyAppRefresh);
  socket.off('access-status', NotifyAccessStatus);
  socket.off('locations-refresh', NotifyLocationsRefresh);

  initialized = false;
  currentLocationId = null;
  currentCompanyId = null;
  connectScheduled = false;

  if (socket.connected) {
    socket.disconnect();
  }
}

function NotifyAccessStatus(data) {
  const userStore = useUserStore();
  const scope = String(data?.scope || '').toLowerCase();
  const status = String(data?.status || '').toLowerCase();

  if (!['inactive', 'suspended'].includes(status)) return;

  if (
    scope === 'location' &&
    Number(data?.id) !== Number(userStore.locationId)
  ) {
    return;
  }

  if (
    scope === 'company' &&
    Number(data?.id) !== Number(userStore.companyId)
  ) {
    return;
  }

  userStore.forceAccessLogout({
    scope,
    status,
    name: data?.name || ''
  });
}

async function NotifyLocationsRefresh(data) {
  const userStore = useUserStore();

  if (
    Number(data?.companyId) !==
    Number(userStore.companyId)
  ) {
    return;
  }

  await userStore.refreshAvailableLocations();
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
