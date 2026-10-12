import { defineStore } from 'pinia';
import { reactive } from 'vue';

export const useRefreshStore = defineStore('refresh', () => {
  const keys = reactive<Record<string, number>>({});
  const lastEvent = reactive<Record<string, any>>({});

  function notify(targets: string | string[], event: any = {}) {
    const list = Array.isArray(targets) ? targets : [targets];

    [...new Set(list.map(value => String(value || '').trim()).filter(Boolean))]
      .forEach(target => {
        keys[target] = (keys[target] || 0) + 1;
        lastEvent[target] = event;
      });
  }

  function key(target: string) {
    return keys[target] || 0;
  }

  return {
    keys,
    lastEvent,
    notify,
    key
  };
});
