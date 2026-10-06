import request from '@/utils/request';

export function getCompanies() {
  return request({
    url: '/company/getall',
    method: 'get'
  });
}

export function getCompany(id) {
  return request({
    url: `/company/get/${id}`,
    method: 'get'
  });
}

export function createCompany(data) {
  return request({
    url: '/company/create',
    method: 'post',
    data
  });
}

export function updateCompany(id, data) {
  return request({
    url: `/company/update/${id}`,
    method: 'put',
    data
  });
}

export function updateCompanyStatus(id, isActive) {
  return request({
    url: `/company/status/${id}`,
    method: 'patch',
    data: {
      isActive
    }
  });
}
