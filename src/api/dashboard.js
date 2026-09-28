import request from '@/utils/request';

export function getdashboard(locationid) {
    return request({
        url: '/dashboard/getdashboard',
        method: 'get',
        params: { locationid }
    });
}

export function getMatchPointsByEmployee(locationid) {
    return request({
        url: '/dashboard/match-points-by-employee',
        method: 'get',
        params: {
            locationid
        }
    })
}
