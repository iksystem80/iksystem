import request from '@/utils/request';

export function getPromotions(params = {}) {
  return request({
    url: '/promotion/list',
    method: 'get',
    params
  });
}

export function getPromotion(id) {
  return request({
    url: '/promotion/detail',
    method: 'get',
    params: { id }
  });
}

export function createPromotion(data) {
  return request({
    url: '/promotion/create',
    method: 'post',
    data
  });
}

export function updatePromotion(data) {
  return request({
    url: '/promotion/update',
    method: 'put',
    data
  });
}

export function savePromotionRecipients(data) {
  return request({
    url: '/promotion/recipients',
    method: 'post',
    data
  });
}

export function sendPromotion(id) {
  return request({
    url: '/promotion/send',
    method: 'post',
    data: { id }
  });
}

export function getPromotionRecipients(id) {
  return request({
    url: '/promotion/recipients',
    method: 'get',
    params: { id }
  });
}

export function getPromotionLogs(id) {
  return request({
    url: '/promotion/logs',
    method: 'get',
    params: { id }
  });
}
