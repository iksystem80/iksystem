import {
  onBeforeMount,
  onBeforeUnmount,
  onMounted,
  watch
} from 'vue';
import { useRoute } from 'vue-router';
import { useAppStore } from '@/store/modules/app';

const WIDTH = 992;

export function useResizeHandler() {
  const appStore = useAppStore();
  const route = useRoute();

  /**
     * Determine whether the current viewport is mobile.
     */
  function isMobile(): boolean {
    const rect = document.body.getBoundingClientRect();

    return rect.width - 1 < WIDTH;
  }

  /**
     * Handle window resize.
     */
  function resizeHandler() {
    if (document.hidden) {
      return;
    }

    const mobile = isMobile();

    appStore.toggleDevice(
      mobile ? 'mobile' : 'desktop'
    );

    if (mobile) {
      appStore.closeSidebar(true);
    }
  }

  /**
     * Close sidebar when route changes on mobile.
     */
  watch(
    () => route.fullPath,
    () => {
      if (
        appStore.device === 'mobile' &&
                appStore.sidebar.opened
      ) {
        appStore.closeSidebar(false);
      }
    }
  );

  /**
     * Register resize listener.
     */
  onBeforeMount(() => {
    window.addEventListener(
      'resize',
      resizeHandler
    );
  });

  /**
     * Initialize device state.
     */
  onMounted(() => {
    const mobile = isMobile();

    if (mobile) {
      appStore.toggleDevice('mobile');
      appStore.closeSidebar(true);
    }
  });

  /**
     * Remove resize listener.
     */
  onBeforeUnmount(() => {
    window.removeEventListener(
      'resize',
      resizeHandler
    );
  });

  return {
    isMobile,
    resizeHandler
  };
}
