import request from '@/utils/request';

export function getInitialMachineReadings(locationid) {
  return request({
    url: '/machine/initial-readings',
    method: 'get',
    params: { locationid }
  });
}

export function saveInitialMachineReading(machineId, data) {
  return request({
    url: `/machine/initial-readings/${machineId}`,
    method: 'put',
    data
  });
}

export function resetInitialMachineReading(machineId, locationid) {
  return request({
    url: `/machine/initial-readings/${machineId}`,
    method: 'delete',
    params: { locationid }
  });
}

export function deactivateMachine(machineId, locationId) {
  return request({
    url: `/machine/deactivate/${machineId}`,
    method: 'patch',
    data: { locationId }
  });
}
