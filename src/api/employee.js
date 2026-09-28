import request from '@/utils/request'

export function getemployees(locationid) {
    return request({
        url: '/employee/getall',
        method: 'get',
        params: { locationid }
    })
}

export function getemployee(id) {
    return request({
        url: `/employee/get/${id}`,
        method: 'get'
    })
}

export function saveemployee(data) {
    return request({
        url: '/employee/saveemployee',
        method: 'post',
        data
    })
}

export function updateemployee(id, data) {
    return request({
        url: `/employee/update/${id}`,
        method: 'put',
        data
    })
}

export function updateemployeestatus(id, isActive) {
    return request({
        url: `/employee/status/${id}`,
        method: 'patch',
        data: { isActive }
    })
}

export function deleteemployee(id) {
    return request({
        url: '/employee/delete',
        method: 'delete',
        params: { id }
    })
}