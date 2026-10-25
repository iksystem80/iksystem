import request from '@/utils/request'

export function getWeeklyReportWeek(params) {
  return request({
    url: '/reading/weeklyreport/week',
    method: 'get',
    params
  })
}

export function getWeeklyReportDay(params) {
  return request({
    url: '/reading/weeklyreport/day',
    method: 'get',
    params
  })
}

export function getWeeklyReportLoans(params) {
  return request({
    url: `/employeefinance/reports/reading-session/${params.sessionid}/loans`,
    method: 'get',
    params: { locationid: params.locationid }
  })
}

// Dedicated loan report, independent from Weekly Report cash calculations.
export function getLoanReport(params) {
  return request({ url: '/employeefinance/reports/loans', method: 'get', params })
}
