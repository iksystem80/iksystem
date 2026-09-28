import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCheckinStore = defineStore('checkin', () => {
    const refreshKey = ref(0)

    function notifyNewCheckin() {
        refreshKey.value++
    }

    return {
        refreshKey,
        notifyNewCheckin,
    }
})