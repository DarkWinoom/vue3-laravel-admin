import { addAPIProvider, addIcon } from '@iconify/vue';
import managementIcons from '@/assets/icons/management.json';

/** Setup the iconify offline */
export function setupIconifyOffline() {
  managementIcons.forEach(collection => {
    Object.entries(collection.icons).forEach(([name, icon]) => {
      if (icon)
        addIcon(collection.prefix + ':' + name, { width: collection.width, height: collection.height, ...icon });
    });
  });
  const { VITE_ICONIFY_URL } = import.meta.env;

  if (VITE_ICONIFY_URL) {
    addAPIProvider('', { resources: [VITE_ICONIFY_URL] });
  }
}
