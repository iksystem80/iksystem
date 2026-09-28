import request from '@/utils/request'

export function getManageRules(locationid) {
    return request({
        url: '/managerules/get',
        method: 'get',
        params: { locationid }
    })
}

export function updateManageRules(data) {
    return request({
        url: '/managerules/update',
        method: 'put',
        data
    })
}
