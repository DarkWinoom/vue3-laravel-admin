import { addIcon } from '@iconify/vue/offline';
import managementIcons from '@/assets/icons/management.json';

export const localIconNames = managementIcons.flatMap(collection =>
  Object.keys(collection.icons).map(name => collection.prefix + ':' + name)
);

/** Setup the iconify offline */
export function setupIconifyOffline() {
  managementIcons.forEach(collection => {
    Object.entries(collection.icons).forEach(([name, icon]) => {
      if (icon)
        addIcon(collection.prefix + ':' + name, { width: collection.width, height: collection.height, ...icon });
    });
  });
}
