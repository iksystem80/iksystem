import { defineStore, acceptHMRUpdate } from 'pinia';
import { ref } from 'vue';
import defaultSettings from '@/settings';
import {
  applyTheme,
  getStoredTheme,
  type AppTheme
} from '@/utils/theme';

const {
  showSettings,
  tagsView,
  fixedHeader,
  sidebarLogo,
  secondMenuPopup
} = defaultSettings;

export interface ISettingsState {
    theme: AppTheme
    showSettings: boolean
    tagsView: boolean
    fixedHeader: boolean
    sidebarLogo: boolean
    secondMenuPopup: boolean
}

export const useSettingsStore = defineStore('settings', () => {
  const theme = ref<AppTheme>(getStoredTheme());
  const showSettingsRef = ref<boolean>(showSettings);
  const tagsViewRef = ref<boolean>(tagsView);
  const fixedHeaderRef = ref<boolean>(fixedHeader);
  const sidebarLogoRef = ref<boolean>(sidebarLogo);
  const secondMenuPopupRef = ref<boolean>(secondMenuPopup);

  // Keep the DOM in sync when the store is first created.
  applyTheme(theme.value, false);

  function changeSetting<K extends keyof ISettingsState>({
    key,
    value
  }: {
        key: K
        value: ISettingsState[K]
    }) {
    switch (key) {
      case 'theme':
        theme.value = value as AppTheme;
        applyTheme(theme.value);
        break;

      case 'showSettings':
        showSettingsRef.value = value as boolean;
        break;

      case 'tagsView':
        tagsViewRef.value = value as boolean;
        break;

      case 'fixedHeader':
        fixedHeaderRef.value = value as boolean;
        break;

      case 'sidebarLogo':
        sidebarLogoRef.value = value as boolean;
        break;

      case 'secondMenuPopup':
        secondMenuPopupRef.value = value as boolean;
        break;
    }
  }

  return {
    theme,
    showSettings: showSettingsRef,
    tagsView: tagsViewRef,
    fixedHeader: fixedHeaderRef,
    sidebarLogo: sidebarLogoRef,
    secondMenuPopup: secondMenuPopupRef,
    changeSetting
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(
    acceptHMRUpdate(useSettingsStore, import.meta.hot)
  );
}
