import request from '@/utils/request';

export function getLuckyBirdGiveState() {
  return request({
    url: '/luckybird/give/state',
    method: 'get'
  });
}

export function getLuckyBirdGiveMachine(machineNumber) {
  return request({
    url: '/luckybird/give/machine',
    method: 'get',
    params: {
      machinenumber: machineNumber
    }
  });
}

export function saveLuckyBirdAward(data) {
  return request({
    url: '/luckybird/give/save',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}
