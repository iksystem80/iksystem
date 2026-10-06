import request from '@/utils/request';

export function uploadphoto(data) {
  return request({
    url: '/customer/uploadphoto',
    method: 'post',
    data
  });
}

export function savecustomer(data) {
  return request({
    url: '/customer/savecustomer',
    method: 'post',
    data
  });
}

export function getcustomers(locationid) {
  return request({
    url: '/customer/getall',
    method: 'get',
    params: { locationid }
  });
}
//
export function getcustomerbyid(id) {
  return request({
    url: '/customer/getcustomerbyid',
    method: 'get',
    params: { id }
  });
}
export function deletecustomer(id) {
  return request({
    url: '/customer/delete',
    method: 'delete',
    params: { id }
  });
}
export function updatestatus(id) {
  return request({
    url: '/customer/updatestatus',
    method: 'put',
    params: { id }
  });
}

export function checkin(data) {
  return request({
    url: '/customer/checkin',
    method: 'post',
    data
  });
}
export function checkout(data) {
  return request({ url: '/customer/checkout', method: 'post', data });
}

export function getcheckin(locationid) {
  return request({
    url: '/customer/getcheckin',
    method: 'get',
    params: { locationid }
  });
}

export function approvecheckin(id, userid) {
  return request({
    url: '/customer/approvecheckin',
    method: 'put',
    params: { id, userid }
  });
}

export function saveassignmachine(data) {
  return request({
    url: '/customer/saveassignmachine',
    method: 'post',
    data
  });
}

export function updateCustomerAccount(data) {
  return request({
    url: '/customer/updateCustomerAccount',
    method: 'PUT',
    data
  });
}

export function getcustomerlogs(id) {
  return request({
    url: '/customer/getcustomerlogs',
    method: 'get',
    params: { id }
  });
}

export function getcustomeractivity(id, locationid) {
  return request({
    url: '/customer/getcustomeractivity',
    method: 'get',
    params: {
      id,
      locationid
    }
  });
}

//
