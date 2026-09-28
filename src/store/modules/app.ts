import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref } from 'vue'
import Cookies from 'js-cookie'

type Device = 'desktop' | 'mobile'
type Size = 'large' | 'default' | 'small'

interface SidebarState {
    opened: boolean
    withoutAnimation: boolean
}

export const useAppStore = defineStore('app', () => {
    const sidebar = ref<SidebarState>({
        opened: getSidebarStatus(),
        withoutAnimation: false
    })

    const device = ref<Device>('desktop')

    const size = ref<Size>(getSize())

    /**
     * Get sidebar state from cookie.
     */
    function getSidebarStatus(): boolean {
        const status = Cookies.get('sidebarStatus')

        if (status === undefined) {
            return true
        }

        return status === '1'
    }

    /**
     * Get UI size from cookie.
     */
    function getSize(): Size {
        const savedSize = Cookies.get('size')

        if (savedSize === 'large' || savedSize === 'default' || savedSize === 'small') {
            return savedSize
        }

        return 'default'
    }

    /**
     * Toggle sidebar open/close.
     */
    function toggleSidebar() {
        sidebar.value.opened = !sidebar.value.opened
        sidebar.value.withoutAnimation = false

        Cookies.set('sidebarStatus', sidebar.value.opened ? '1' : '0')
    }

    /**
     * Close sidebar.
     */
    function closeSidebar(withoutAnimation: boolean) {
        Cookies.set('sidebarStatus', '0')

        sidebar.value.opened = false
        sidebar.value.withoutAnimation = withoutAnimation
    }

    /**
     * Change device type.
     */
    function toggleDevice(newDevice: Device) {
        device.value = newDevice
    }

    /**
     * Change Element Plus component size.
     */
    function setSize(newSize: Size) {
        size.value = newSize
        Cookies.set('size', newSize)
    }

    return {sidebar, device, size, toggleSidebar, closeSidebar, toggleDevice, setSize }
})

/**
 * Hot Module Replacement
 */
if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useAppStore, import.meta.hot))
}
