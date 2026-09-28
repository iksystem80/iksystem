import request from '@/utils/request'

export function getPromotionTemplates(params = {}) {
  return request({
    url: '/promotion-template/list',
    method: 'get',
    params
  })
}

export function getPromotionTemplate(id) {
  return request({
    url: '/promotion-template/detail',
    method: 'get',
    params: { id }
  })
}

export function createPromotionTemplate(data) {
  return request({
    url: '/promotion-template/create',
    method: 'post',
    data
  })
}

export function updatePromotionTemplate(data) {
  return request({
    url: '/promotion-template/update',
    method: 'put',
    data
  })
}

export function duplicatePromotionTemplate(data) {
  return request({
    url: '/promotion-template/duplicate',
    method: 'post',
    data
  })
}

export function deletePromotionTemplate(id) {
  return request({
    url: '/promotion-template/delete',
    method: 'delete',
    params: { id }
  })
}

export function generatePromotionTemplateImage(data) {
  return request({
    url: '/promotion-template/generate',
    method: 'post',
    data
  })
}

export function uploadPromotionAsset(data) {
  return request({
    url: '/promotion-template/upload-asset',
    method: 'post',
    data
  })
}
