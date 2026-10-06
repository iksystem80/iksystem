import { defineStore, acceptHMRUpdate } from 'pinia';
import { ref } from 'vue';

export const useErrorLogStore = defineStore('errorLog', () => {
  const logs = ref<unknown[]>([]);

  function addErrorLog(log: unknown) {
    logs.value.push(log);
  }

  function clearErrorLog() {
    logs.value.splice(0);
  }

  return {
    logs,
    addErrorLog,
    clearErrorLog
  };
});
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useErrorLogStore, import.meta.hot));
}
