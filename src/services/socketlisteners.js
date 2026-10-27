import socket from './socket';
import { useUserStore } from '@/store/modules/user';
import { useCheckinStore } from '@/store/modules/checkin';
import { useRefreshStore } from '@/store/modules/refresh';
import { ElNotification } from 'element-plus';
import { handleSessionReplaced, handleSessionRevoked } from './sessionSecurity';

let initialized = false;
let currentLocationId = null;
let currentCompanyId = null;
let connectScheduled = false;
let connectedToken = null;

function currentLoginToken() {
  const token = useUserStore().token;
  return typeof token === 'string' ? token.trim() : '';
}

// Socket.IO invokes this for each connection attempt, including reconnections.
function socketAuth(callback) {
  callback({ token: currentLoginToken() });
}

function normalizedId(value) {
  const id = Number(value);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function joinCurrentContext() {
  if (!socket.connected) return;

  socket.emit('join-user-context', {
    // `locationId` is included for existing deployed servers.
    // New servers can standardize on lowercase `locationid`.
    locationid: currentLocationId,
    locationId: currentLocationId
  });
}

function connectWhenIdle() {
  if (socket.connected || connectScheduled) return;

  connectScheduled = true;

  const connect = () => {
    connectScheduled = false;

    // cleanupSocket() may have run while this idle callback was waiting.
    if (!initialized) return;

    const token = currentLoginToken();
    if (!token) return; // Wait until the user is logged in.

    socket.auth = socketAuth;
    if (!socket.connected) {
      connectedToken = token;
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

  // Always read the latest login token instead of capturing it at import time.
  socket.auth = socketAuth;
  const token = currentLoginToken();
  if (socket.connected && token !== connectedToken) {
    socket.disconnect();
    connectedToken = null;
  }

  if (!initialized) {
    initialized = true;

    socket.on('connect', joinCurrentContext);
    socket.on('customer-checkin', NotifyCheckin);
    socket.on('app-refresh', NotifyAppRefresh);
    socket.on('access-status', NotifyAccessStatus);
    socket.on('locations-refresh', NotifyLocationsRefresh);
    socket.on('session-replaced', handleSessionReplaced);
    socket.on('session-revoked', handleSessionRevoked);
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
  socket.off('session-replaced', handleSessionReplaced);
  socket.off('session-revoked', handleSessionRevoked);

  initialized = false;
  currentLocationId = null;
  currentCompanyId = null;
  connectScheduled = false;
  connectedToken = null;

  if (socket.connected || socket.active) {
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
