import request from '@/utils/request'

export function getRoles() {
    return request({
        url: '/role/getall',
        method: 'get'
    })
}

export function getRole(id) {
    return request({
        url: `/role/${id}`,
        method: 'get'
    })
}

export function getPermissions() {
    return request({
        url: '/role/permissions',
        method: 'get'
    })
}

export function createRole(data) {
    return request({
        url: '/role',
        method: 'post',
        data
    })
}

export function updateRole(id, data) {
    return request({
        url: `/role/${id}`,
        method: 'put',
        data
    })
}

export function deleteRole(id) {
    return request({
        url: `/role/${id}`,
        method: 'delete'
    })
}