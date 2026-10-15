import request from '@/utils/request';

export function updateMyProfile(data: FormData) {
  return request({
    url: '/user/profile',
    method: 'put',
    data
  });
}

export function updateMyPassword(data: {
  currentPassword: string;
  newPassword: string;
}) {
  return request({
    url: '/user/profile/password',
    method: 'put',
    data
  });
}
