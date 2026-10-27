import { ElMessageBox, ElNotification } from 'element-plus';
import { getToken } from '@/utils/auth';
import { useUserStore } from '@/store/modules/user';

let reviewOpen = false;
let unauthorizedTimer = null;
let loggingOut = false;

function cancelUnauthorizedFallback() {
  if (unauthorizedTimer) clearTimeout(unauthorizedTimer);
  unauthorizedTimer = null;
}

async function returnToLogin() {
  if (loggingOut) return;
  loggingOut = true;
  cancelUnauthorizedFallback();
  try {
    await useUserStore().logout();
  } finally {
    loggingOut = false;
  }
}

// If a 401 arrives before Socket.IO's alert, briefly wait for the alert.
// If offline or missed, redirect instead of leaving an empty dashboard.
export function scheduleInvalidSessionLogout() {
  if (reviewOpen || unauthorizedTimer || loggingOut || !getToken()) return;
  const invalidToken = getToken();
  unauthorizedTimer = setTimeout(async () => {
    unauthorizedTimer = null;
    if (reviewOpen || getToken() !== invalidToken) return;
    await returnToLogin();
    ElNotification.warning({
      title: 'Session ended',
      message: 'Your session is no longer valid. Please sign in again.',
      duration: 6000
    });
  }, 1800);
}

export async function handleSessionReplaced(data) {
  const challenge = data?.challenge;
  if (reviewOpen || typeof challenge !== 'string' || !/^[0-9a-f]{64}$/.test(challenge)) return;
  const previousToken = getToken();
  if (!previousToken) return;

  reviewOpen = true;
  cancelUnauthorizedFallback();

  try {
    await ElMessageBox.confirm(
      'Your account was just signed in on another browser or device. Was this you? This browser\'s session has already been ended.',
      'Security alert — New login detected',
      {
        confirmButtonText: 'Yes, it was me',
        cancelButtonText: 'No, it wasn\'t me',
        type: 'warning',
        distinguishCancelAndClose: true,
        closeOnClickModal: false,
        closeOnPressEscape: false,
        showClose: false,
        closeOnHashChange: false
      }
    );
    await returnToLogin();
    ElNotification.info({
      title: 'Signed out',
      message: 'This browser was signed out. Your other login remains active.',
      duration: 5000
    });
  } catch (choice) {
    if (choice !== 'cancel') {
      await returnToLogin();
      return;
    }

    let revoked = false;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const base = String(import.meta.env.VITE_BASE_API || '/api').replace(/\/+$/, '');
      try {
        const response = await fetch(`${base}/user/report-unrecognized-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Token': previousToken },
          body: JSON.stringify({ challenge }),
          cache: 'no-store',
          signal: controller.signal
        });
        revoked = response.ok && (await response.json())?.success === true;
      } finally {
        clearTimeout(timeout);
      }
    } catch (error) {
      console.error('Unrecognized session report failed:', error);
    }

    await returnToLogin();
    if (revoked) {
      ElNotification.error({
        title: 'Unrecognized login blocked',
        message: 'The other session was revoked. Change your password immediately and contact your administrator.',
        duration: 0
      });
    } else {
      ElNotification.error({
        title: 'Urgent security action required',
        message: 'Unable to confirm revocation of the other session. Contact your administrator and change your password immediately.',
        duration: 0
      });
    }
  } finally {
    reviewOpen = false;
  }
}

export async function handleSessionRevoked(data) {
  if (data?.reason !== 'unrecognized-login') return;
  cancelUnauthorizedFallback();
  await returnToLogin();
  ElNotification.error({
    title: 'Session revoked',
    message: 'Another browser reported this login as unrecognized. You have been signed out.',
    duration: 0
  });
}
