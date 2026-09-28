import request from '@/utils/request'

// Keep existing src/api/reading unchanged. This module adds coverage APIs only.
export const getReadingEmployeeCoverage = (sessionid, locationid) => request({
  url: '/reading/employee-sessions', method: 'get', params: { sessionid, locationid }
})
export const saveReadingEmployeeCoverage = (data) => request({
  url: '/reading/employee-sessions', method: 'put', data
})
