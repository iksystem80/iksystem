import request from '@/utils/request';

export function getSystemCompanies() {
  return request({
    url: '/company/getall',
    method: 'get'
  });
}

export function getSystemLocations(companyId) {
  return request({
    url: `/location/company/${companyId}`,
    method: 'get'
  });
}

export function getLocationModuleAssignment(locationId) {
  return request({
    url: '/role/permissions',
    method: 'get',
    params: { locationid: locationId }
  });
}

export function saveLocationModuleAssignment(locationId, moduleIds) {
  return request({
    url: '/role/location-modules',
    method: 'put',
    data: {
      locationid: locationId,
      moduleIds
    }
  });
}
