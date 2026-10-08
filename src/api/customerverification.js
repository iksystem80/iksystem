import request from '@/utils/request'

export function sendcustomerverification(data) {
  return request({
    url: '/customerverification/send',
    method: 'post',
    data
  })
}

export function verifycustomerverification(data) {
  return request({
    url: '/customerverification/verify',
    method: 'post',
    data,
    timeout: 60000
  })
}

export function bypasscustomerverification(data) {
  return request({
    url: '/customerverification/bypass',
    method: 'post',
    data
  })
}
