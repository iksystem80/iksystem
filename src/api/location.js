import request from '@/utils/request'

export function getCompanyLocations(companyId) {
    return request({
        url: `/location/company/${companyId}`,
        method: 'get'
    })
}

export function createLocation(data) {
    return request({
        url: '/location/create',
        method: 'post',
        data
    })
}

export function updateLocation(id, data) {
    return request({
        url: `/location/update/${id}`,
        method: 'put',
        data
    })
}