import request from '@/utils/request';
import { useUserStore } from '@/store/modules/user';

// Promotions are location-specific; unlike company-wide Promotion Templates,
// always send the selected location via query/body (never a custom header).
function selectedLocation() {
  return Number(useUserStore().locationId || 0);
}

function query(params = {}) {
  return { ...params, locationid: selectedLocation() };
}

function body(data = {}) {
  return { ...data, locationid: selectedLocation() };
}

export function getPromotions() {
  return request({ url: '/promotion/list', method: 'get', params: query() });
}

export function getPromotion(id) {
  return request({ url: '/promotion/detail', method: 'get', params: query({ id }) });
}

export function createPromotion(data) {
  return request({ url: '/promotion/create', method: 'post', data: body(data) });
}

export function updatePromotion(data) {
  return request({ url: '/promotion/update', method: 'put', data: body(data) });
}

export function getPromotionRecipients(id) {
  return request({ url: '/promotion/recipients', method: 'get', params: query({ id }) });
}

export function savePromotionRecipients(data) {
  return request({ url: '/promotion/recipients', method: 'post', data: body(data) });
}

export function sendPromotion(id) {
  return request({ url: '/promotion/send', method: 'post', data: body({ id }) });
}

export function getPromotionLogs(id) {
  return request({ url: '/promotion/logs', method: 'get', params: query({ id }) });
}
