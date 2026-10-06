import { useUserStore } from '@/store/modules/user';

export default function checkPermission(value) {
  const required = Array.isArray(value) ? value : [value];

  if (!required.length) return false;

  const userStore = useUserStore();

  if (userStore.roleName === 'Owner') return true;

  const permissions = userStore.permissions || [];
  const roles = (userStore.roles || []).map(role => String(role).toLowerCase());

  return required.some(item => {
    const key = String(item);
    return permissions.includes(key) || roles.includes(key.toLowerCase());
  });
}

export function checkRole(value) {
  const required = Array.isArray(value) ? value : [value];
  const userStore = useUserStore();
  const roles = (userStore.roles || []).map(role => String(role).toLowerCase());
  return required.some(role => roles.includes(String(role).toLowerCase()));
}
