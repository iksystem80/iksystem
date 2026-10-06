import request from '@/utils/request';

// ============================================================
// GET ALL BONUSES
// ============================================================

export function getBonuses(locationId) {
  return request({
    url: '/bonus',
    method: 'get',
    params: {
      locationid: locationId
    }
  });
}

// ============================================================
// GET SINGLE BONUS
// ============================================================

export function getBonus(id) {
  return request({
    url: `/bonus/${id}`,
    method: 'get'
  });
}

// ============================================================
// CREATE BONUS
// ============================================================

export function createBonus(data) {
  return request({
    url: '/bonus',
    method: 'post',
    data
  });
}

// ============================================================
// UPDATE BONUS
// ============================================================

export function updateBonus(id, data) {
  return request({
    url: `/bonus/${id}`,
    method: 'put',
    data
  });
}

// ============================================================
// ENABLE / DISABLE BONUS
// ============================================================

export function updateBonusStatus(id, isActive) {
  return request({
    url: `/bonus/${id}/status`,
    method: 'patch',
    data: {
      isActive
    }
  });
}

// ============================================================
// DELETE BONUS
// ============================================================

export function deleteBonus(id) {
  return request({
    url: `/bonus/${id}`,
    method: 'delete'
  });
}

// ============================================================
// CURRENT ACTIVE BONUSES
// ============================================================

export function getCurrentActiveBonuses(locationId) {
  return request({
    url: '/bonus/active/current/list',
    method: 'get',
    params: {
      locationid: locationId
    }
  });
}
