import request from '@/utils/request';
import { getToken } from '@/utils/auth';

// Keep the same key for a retry of the same unfinished submission.
// A confirmed success clears it, so a later intentional identical transaction
// receives a new key. Backend enforcement remains the source of truth.
const pendingFinancialRequests = new Map();

function newIdempotencyKey() {
  // Browsers and Capacitor secure contexts expose crypto.getRandomValues.
  const bytes = new Uint8Array(16);
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error('Secure random number generation is required for financial transactions.');
  }
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

async function protectedFinancialPost(url, data) {
  // Include the signed-in session in local identity to avoid reusing a key
  // when another account logs in on the same device.
  const identity = JSON.stringify([getToken() || '', url, data]);
  let key = pendingFinancialRequests.get(identity);
  if (!key) {
    key = newIdempotencyKey();
    pendingFinancialRequests.set(identity, key);
  }

  try {
    const result = await request({
      url,
      method: 'post',
      data,
      headers: { 'Idempotency-Key': key }
    });
    pendingFinancialRequests.delete(identity);
    return result;
  } catch (error) {
    // An unknown network outcome may mean the backend already committed.
    // Reuse this key on retry instead of accidentally creating another entry.
    throw error;
  }
}

const root = '/employeefinance';
export const getEmployeeFinance = locationid => request({ url: `${root}/current`, method: 'get', params: { locationid }});
export const getExpenseTypes = locationid => request({ url: `${root}/expense-types`, method: 'get', params: { locationid }});
export const getLoanLenders = locationid => request({ url: `${root}/loan-lenders`, method: 'get', params: { locationid }});
export const getCreditTypes = locationid => request({ url: `${root}/credit-types`, method: 'get', params: { locationid }});
export const setOpeningCash = data => request({ url: `${root}/opening`, method: 'post', data });
export const addCashTransaction = data => protectedFinancialPost(`${root}/transaction`, data);
export const handoverAndClockOut = data => request({ url: `${root}/handover-and-clockout`, method: 'post', data });
export const acceptCashHandover = (id, data) => request({ url: `${root}/handovers/${id}/accept`, method: 'post', data });
export const createExpenseType = data => request({ url: `${root}/expense-types`, method: 'post', data });
export const setExpenseTypeStatus = (id, data) => request({ url: `${root}/expense-types/${id}`, method: 'patch', data });
export const createCreditType = data => request({ url: `${root}/credit-types`, method: 'post', data });
export const setCreditTypeStatus = (id, data) => request({ url: `${root}/credit-types/${id}`, method: 'patch', data });
export const getCashHistory = (locationid, range = 'today') => request({ url: `${root}/history`, method: 'get', params: { locationid, range }});

export const getAdminFinanceOverview = (locationid, days = 30) =>
  request({ url: `${root}/admin/overview`, method: 'get', params: { locationid, days }});
export const createAdminFunding = data => request({ url: `${root}/admin/funding`, method: 'post', data });
export const updateAdminFunding = (id, data) => request({ url: `${root}/admin/funding/${id}`, method: 'put', data });
export const cancelAdminFunding = (id, data) => request({ url: `${root}/admin/funding/${id}/cancel`, method: 'post', data });
export const acceptAdminFunding = (id, data) => request({ url: `${root}/admin/funding/${id}/accept`, method: 'post', data });
export const getSessionCashHistoryReport = params => request({ url: `${root}/history/report`, method: 'get', params });
export const getAdminMoneyTrail = (locationid, range = 'today') => request({ url: `${root}/admin/trail`, method: 'get', params: { locationid, range }});
export const getAdminMoneyTrailReport = params => request({ url: `${root}/admin/trail/report`, method: 'get', params });
export const createAdminWithdrawal = data => request({ url: `${root}/admin/withdrawal`, method: 'post', data });
export const getReadingProfitPosting = (sessionId, locationid) => request({ url: `${root}/reading-profit/${sessionId}`, method: 'get', params: { locationid }});
export const postReadingProfit = (sessionId, data) => request({ url: `${root}/reading-profit/${sessionId}`, method: 'post', data });
export const getAdminFinanceActivity = params => request({ url: `${root}/admin/activity`, method: 'get', params });

const cashRoot = '/locationcash';
export const getLocationCash = locationid => request({ url: `${cashRoot}/overview`, method: 'get', params: { locationid }});
export const addInitialCapital = data => protectedFinancialPost(`${cashRoot}/initial-capital`, data);
export const setCustodyOpening = data => protectedFinancialPost(`${cashRoot}/cutover-opening`, data);
export const sendCustodyTransfer = data => protectedFinancialPost(`${cashRoot}/transfer`, data);
export const acceptCustodyTransfer = (id, data) => request({ url: `${cashRoot}/transfers/${id}/accept`, method: 'post', data });
export const cancelCustodyTransfer = (id, data) => request({ url: `${cashRoot}/transfers/${id}/cancel`, method: 'post', data });
export const depositBusinessBank = data => protectedFinancialPost(`${cashRoot}/bank-deposit`, data);
export const withdrawBusinessBank = data => protectedFinancialPost(`${cashRoot}/bank-withdrawal`, data);
export const distributeOwnerCash = data => protectedFinancialPost(`${cashRoot}/owner-distribution`, data);
export const sendCustodyEmployeeSupport = data => protectedFinancialPost(`${cashRoot}/employee-support`, data);
export const acceptInitialCapital = (id, data) => request({ url: `${cashRoot}/capital/${id}/accept`, method: 'post', data });
export const cancelInitialCapital = (id, data) => request({ url: `${cashRoot}/capital/${id}/cancel`, method: 'post', data });
export const addCustodyExpense = data => protectedFinancialPost(`${cashRoot}/expense`, data);
export const getAdminMachineCollections = locationid => request({ url: `${cashRoot}/machine-collections`, method: 'get', params: { locationid }});
