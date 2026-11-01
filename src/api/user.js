import request from '@/utils/request';

export function login(data) {
  return request({
    url: '/user/login',
    method: 'post',
    data
  });
}

export function getActiveLoginCount() {
  return request({ url: '/user/active-login-count', method: 'get' });
}

export function logoutSession() {
  return request({ url: '/user/logout', method: 'post' });
}

export function getInfo(token, userid, locationid) {
  const params = {
    userid
  };

  if (locationid) {
    params.locationid = locationid;
  }

  return request({
    url: '/user/userinfo',
    method: 'get',
    params,
    headers: { 'x-token': token }
  });
}
