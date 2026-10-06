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
