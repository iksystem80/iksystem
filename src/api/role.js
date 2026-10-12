import request from '@/utils/request';

const params = locationid => locationid ? { locationid } : undefined;

export function getRoles(locationid) {
  return request({ url: '/role/getall', method: 'get', params: params(locationid) });
}

export function getRole(id, locationid) {
  return request({ url: `/role/${id}`, method: 'get', params: params(locationid) });
}

// Kept as getPermissions for compatibility with the existing page import.
// The backend now returns module hierarchy instead of CRUD permissions.
export function getPermissions(locationid) {
  return request({ url: '/role/permissions', method: 'get', params: params(locationid) });
}

export function updateLocationModules(locationid, moduleIds) {
  return request({ url: '/role/location-modules', method: 'put', data: { locationid, moduleIds } });
}

export function createRole(data) {
  return request({ url: '/role', method: 'post', data });
}

export function updateRole(id, data) {
  return request({ url: `/role/${id}`, method: 'put', data });
}

export function deleteRole(id, locationid) {
  return request({ url: `/role/${id}`, method: 'delete', params: params(locationid) });
}
