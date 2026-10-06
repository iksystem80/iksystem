import request from '@/utils/request';

// ============================================================
// EMPLOYEES
// ============================================================

export function getPointWatchingEmployees(
  locationId
) {
  return request({
    url: '/pointwatching/employees',
    method: 'get',

    params: {
      locationid: locationId
    }
  });
}

// ============================================================
// POINTS BY DATE
// ============================================================

export function getPointsByDate(
  locationId,
  date
) {
  return request({
    url: '/pointwatching/by-date',
    method: 'get',

    params: {
      locationid: locationId,
      date
    }
  });
}

// ============================================================
// POINTS BY EMPLOYEE
// ============================================================

export function getPointsByEmployee(
  employeeId,
  locationId,
  days = 14
) {
  return request({
    url:
            `/pointwatching/by-employee/${employeeId}`,

    method: 'get',

    params: {
      locationid: locationId,
      days
    }
  });
}

// ============================================================
// CUSTOMERS / POINT ENTRIES INSIDE ONE EMPLOYEE SESSION
// ============================================================

export function getPointSessionEntries(
  sessionId
) {
  return request({
    url:
            `/pointwatching/session/${sessionId}/entries`,

    method: 'get'
  });
}
