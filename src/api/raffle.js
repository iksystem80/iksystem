import request from '@/utils/request';

export const getRaffleState = () => request({ url: '/raffle/state', method: 'get' });
export const startRaffle = () => request({ url: '/raffle/start', method: 'post' });
export const redrawRaffle = id => request({ url: `/raffle/${id}/redraw`, method: 'post' });
export const getCheckedInCustomers = () => request({ url: '/raffle/checked-in-customers', method: 'get' });
export const completeRaffle = (id, data) => request({ url: `/raffle/${id}/complete`, method: 'post', data });
export const getRaffleSettings = locationid => request({ url: '/raffle/settings', method: 'get', params: { locationid }});
export const saveRaffleSettings = data => request({ url: '/raffle/settings', method: 'put', data });
export const getRaffleWinners = locationid => request({ url: '/raffle/winners', method: 'get', params: { locationid }});
export const getRaffleWinnerHistory = (customerId, locationid) => request({ url: `/raffle/winners/${customerId}`, method: 'get', params: { locationid }});
