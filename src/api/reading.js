import request from '@/utils/request'

// ============================================================
// READING SESSIONS
// ============================================================

export function getactivesession(locationid) {
    return request({
        url: '/reading/getactivesession',
        method: 'get',
        params: {
            locationid
        }
    })
}

export function startnewsession(locationid) {
    return request({
        url: '/reading/startnewsession',
        method: 'post',
        params: {
            locationid
        }
    })
}

export function endsession(
    sessionid,
    locationid
) {
    return request({
        url: '/reading/endsession',
        method: 'put',
        data: {
            sessionid,
            locationid
        }
    })
}

export function deletesession(
    id,
    locationid
) {
    return request({
        url: '/reading/deletesession',
        method: 'delete',
        params: {
            id,
            locationid
        }
    })
}

// ============================================================
// MACHINE READINGS
// ============================================================

export function savereading(data) {
    return request({
        url: '/reading/savereading',
        method: 'post',
        data
    })
}

export function getreadings(
    sessionid,
    locationid
) {
    return request({
        url: '/reading/getreadings',
        method: 'get',
        params: {
            sessionid,
            locationid
        }
    })
}

export function getpreviousreading(
    machineid,
    locationid,
    sessionid = null
) {
    return request({
        url: '/reading/previousreading',
        method: 'get',
        params: {
            machineid,
            locationid,
            sessionid
        }
    })
}

export function deletereading(
    id,
    locationid
) {
    return request({
        url: '/reading/deletereading',
        method: 'delete',
        params: {
            id,
            locationid
        }
    })
}

export function getCompletedSessions(locationid) {
    return request({
        url: '/reading/completedsessions',
        method: 'get',
        params: {
            locationid
        }
    })
}

export function getSessionReport(
    sessionid,
    locationid
) {
    return request({
        url: '/reading/sessionreport',
        method: 'get',
        params: {
            sessionid,
            locationid
        }
    })
}