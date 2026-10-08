import request from '@/utils/request';

export function getBonusGiveState() {
  return request({
    url: '/bonus/give/state',
    method: 'get'
  });
}

export function getBonusGiveMachine(machineNumber) {
  return request({
    url: '/bonus/give/machine',
    method: 'get',
    params: {
      machinenumber: machineNumber
    }
  });
}

export function getActiveBonusChoices() {
  return request({
    url: '/bonus/give/active/list',
    method: 'get'
  });
}

export function saveBonusAward(data) {
  return request({
    url: '/bonus/give/save',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

export function getBonuses(locationId) {
  return request({
    url: '/bonus',
    method: 'get',
    params: {
      locationid: locationId
    }
  });
}

export function getBonus(id) {
  return request({
    url: `/bonus/${id}`,
    method: 'get'
  });
}

export function createBonus(data) {
  return request({
    url: '/bonus',
    method: 'post',
    data
  });
}

export function updateBonus(id, data) {
  return request({
    url: `/bonus/${id}`,
    method: 'put',
    data
  });
}

export function updateBonusStatus(id, isActive) {
  return request({
    url: `/bonus/${id}/status`,
    method: 'patch',
    data: {
      isActive
    }
  });
}

export function deleteBonus(id) {
  return request({
    url: `/bonus/${id}`,
    method: 'delete'
  });
}
