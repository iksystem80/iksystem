import request from '@/utils/request'

export function clockIn(data) {
    return request({
        url: '/employeesession/clockin',
        method: 'post',
        data
    })
}

export function clockOut(data) {
    return request({
        url: '/employeesession/clockout',
        method: 'post',
        data
    })
}

export function getClockStatus(userid) {
    return request({
        url:
            `/employeesession/status/${userid}`,

        method: 'get'
    })
}
export function getEmployeeSessions(
    userid,
    locationid,
    days = 14
) {
    return request({
        url:
            `/employeesession/employee/${userid}`,

        method: 'get',

        params: {
            locationid,
            days
        }
    })
}

export function getEmployeeSessionSummary(locationid) {
  return request({
    url: '/employeesession/reports/employees',
    method: 'get',
    params: { locationid }
  })
}

export function getEmployeeReportSessions(userid, locationid) {
  return request({
    url: `/employeesession/reports/employee/${userid}/sessions`,
    method: 'get',
    params: { locationid }
  })
}

export function getEmployeeSessionReport(sessionid, locationid) {
  return request({
    url: `/employeesession/reports/session/${sessionid}`,
    method: 'get',
    params: { locationid }
  })
}

export function updateCustomerMatchReview(matchid, data) {
    return request({
        url: `/employeesession/reports/points/${matchid}/review`,
        method: 'put',
        data
    })
}

export function getEmployeeSessionPointsReport(sessionid, locationid) {
  return request({
    url: `/employeesession/reports/session/${sessionid}/points`,
    method: 'get',
    params: { locationid }
  })
}

export function getEmployeeSessionShiftReport(sessionid, locationid) {
    return request({
        url: `/employeesession/reports/session/${sessionid}/shift`,
        method: 'get',
        params: { locationid }
    })
}

