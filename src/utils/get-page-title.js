import defaultSettings from '@/settings';

const title = defaultSettings.title || 'IK - Business Made Simple';

export default function getPageTitle(pageTitle) {
  if (pageTitle) {
    return `${pageTitle} - ${title}`;
  }
  return `${title}`;
}
