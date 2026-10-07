import request from '@/utils/request'

export function getBonusGiveState() {
  return request({
    url: '/bonus/give/state',
    method: 'get'
  })
}

export function getBonusGiveMachine(machinenumber) {
  return request({
    url: '/bonus/give/machine',
    method: 'get',
    params: { machinenumber }
  })
}

export function getActiveBonusChoices() {
  return request({
    url: '/bonus/give/active/list',
    method: 'get'
  })
}

export function saveBonusAward(data) {
  return request({
    url: '/bonus/give/save',
    method: 'post',
    data
  })
}
