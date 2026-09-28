import { defineComponent } from 'vue'
import { useAppStore } from '@/store/modules/app'

/**
 * Fix iOS menu mouseleave issue.
 *
 * Element Plus submenu can trigger mouseleave unexpectedly
 * on iOS/mobile devices.
 *
 * https://github.com/PanJiaChen/vue-element-admin/issues/1135
 */
export default defineComponent({
    computed: {
        device() {
            return useAppStore().device
        }
    },

    mounted() {
        this.fixBugIniOS()
    },

    methods: {
        fixBugIniOS() {
            const subMenu = this.$refs.subMenu

            if (!subMenu) {
                return
            }

            const originalHandleMouseleave =
                subMenu.handleMouseleave

            if (typeof originalHandleMouseleave !== 'function') {
                return
            }

            subMenu.handleMouseleave = (event) => {
                // Prevent Element Plus submenu mouseleave
                // handling on mobile/iOS devices.
                if (this.device === 'mobile') {
                    return
                }

                originalHandleMouseleave.call(subMenu, event)
            }
        }
    }
})
