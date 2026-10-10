
import socket from './socket';
import { useUserStore } from '@/store/modules/user';
import { useCheckinStore } from '@/store/modules/checkin';
import { ElNotification } from 'element-plus';

let initialized = false;

export function initializeSocketListeners(locationId) {
  console.log('Initializing socket listeners...');

  socket.emit('join-location', locationId);

  if (initialized) {
    console.log('Socket listeners already initialized');
    return;
  }

  initialized = true;

  socket.on('customer-checkin', NotifyCheckin);

  console.log('customer-checkin listener registered');
}

export function cleanupSocket() {
  console.log('Cleaning up socket listeners...');

  socket.off('customer-checkin', NotifyCheckin);

  initialized = false;
}

function NotifyCheckin(data) {
  console.log('NotifyCheckin called');
  const userStore = useUserStore();
  const checkinStore = useCheckinStore();

  console.log('NotifyCheckin called 2');
  console.log(data.locationId);
  console.log(userStore.locationId);

  if (Number(data.locationId) === Number(userStore.locationId)) {
    console.log('Refreshing check-in list...: ' + data);
    console.log(data);
    // Tell the application that a new check-in happened
    checkinStore.notifyNewCheckin();

    // ElNotification.success({
    //   title: `${data.firstname} ${data.lastname}`,
    //   message: `checked-in at ${new Date().toLocaleTimeString()}`,
    //   duration: 5000
    // });

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
}
