import request from '@/utils/request';

// Machines
export function getMachines(locationid) {
  return request({
    url: '/machine/getall',
    method: 'get',
    params: { locationid }
  });
}

export function getmachinebynumber(machinenumber, locationid) {
  return request({
    url: '/machine/getmachinebynumber',
    method: 'get',
    params: { machinenumber, locationid }
  });
}

export function generateMachines(data) {
  return request({
    url: '/machine/generate',
    method: 'post',
    data
  });
}

export function updateMachine(id, data) {
  return request({
    url: `/machine/update/${id}`,
    method: 'put',
    data
  });
}

export function getMachineLogs(machineId) {
  return request({
    url: `/machine/logs/${machineId}`,
    method: 'get'
  });
}

export function getMachineStatuses() {
  return request({
    url: '/machine/statuses',
    method: 'get'
  });
}

// Machine Types
export function getMachineTypes() {
  return request({
    url: '/machine/types',
    method: 'get'
  });
}

export function createMachineType(data) {
  return request({
    url: '/machine/types',
    method: 'post',
    data
  });
}

export function updateMachineType(id, data) {
  return request({
    url: `/machine/types/${id}`,
    method: 'put',
    data
  });
}

export function deleteMachineType(id) {
  return request({
    url: `/machine/types/${id}`,
    method: 'delete'
  });
}

// Games
export function getGames(machineTypeId) {
  return request({
    url: '/machine/games',
    method: 'get',
    params: machineTypeId
      ? { machineTypeId }
      : {}
  });
}

export function createGame(data) {
  return request({
    url: '/machine/games',
    method: 'post',
    data
  });
}

export function updateGame(id, data) {
  return request({
    url: `/machine/games/${id}`,
    method: 'put',
    data
  });
}

export function deleteGame(id) {
  return request({
    url: `/machine/games/${id}`,
    method: 'delete'
  });
}
