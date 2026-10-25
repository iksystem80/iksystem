import request from '@/utils/request';
import { useUserStore } from '@/store/modules/user';

// Resolve the selected location when each API call is made, including after a location switch.
function withActiveLocation(params = {}) {
  return { ...params, locationid: useUserStore().locationId };
}

export function getPromotionTemplates(params = {}) {
  return request({
    url: '/promotion-template/list',
    method: 'get',
    params: withActiveLocation(params)
  });
}

export function getPromotionTemplate(id) {
  return request({
    url: '/promotion-template/detail',
    method: 'get',
    params: withActiveLocation({ id })
  });
}

export function createPromotionTemplate(data) {
  return request({
    url: '/promotion-template/create',
    params: withActiveLocation(),
    method: 'post',
    data
  });
}

export function updatePromotionTemplate(data) {
  return request({
    url: '/promotion-template/update',
    params: withActiveLocation(),
    method: 'put',
    data
  });
}

export function duplicatePromotionTemplate(data) {
  return request({
    url: '/promotion-template/duplicate',
    params: withActiveLocation(),
    method: 'post',
    data
  });
}

export function deletePromotionTemplate(id) {
  return request({
    url: '/promotion-template/delete',
    method: 'delete',
    params: withActiveLocation({ id })
  });
}

export function generatePromotionTemplateImage(data) {
  return request({
    url: '/promotion-template/generate',
    params: withActiveLocation(),
    method: 'post',
    data
  });
}

export function uploadPromotionAsset(data) {
  return request({
    url: '/promotion-template/upload-asset',
    params: withActiveLocation(),
    method: 'post',
    data
  });
}
