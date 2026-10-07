import request from '@/utils/request';

const root = '/ticketout';

export const getTicketOutState = () => request({ url: `${root}/state`, method: 'get' });
export const getTicketOutMachine = machinenumber => request({ url: `${root}/machine`, method: 'get', params: { machinenumber }});
export const saveTicketOut = data => request({ url: `${root}/save`, method: 'post', data });
export const getRecentTicketOuts = () => request({ url: `${root}/recent`, method: 'get' });
