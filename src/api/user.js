import request from '@/utils/request';

export function login(data) {
  return request({
    url: '/user/login',
    method: 'post',
    data
  });
}

export function getInfo(token, userid) {
  return request({
    url: '/user/userinfo',
    method: 'get',
    params: {
      token,
      userid
    }
  });
}
