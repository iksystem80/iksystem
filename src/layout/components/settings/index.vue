<template>
  <div class="drawer-container">
    <div>
      <h3 class="drawer-title">系统设置</h3>

      <div class="drawer-item">
        <span>Theme</span>
        <el-select v-model="theme" size="small" style="width: 110px; float: right;">
          <el-option label="Light" value="light" />
          <el-option label="Dark" value="dark" />
          <el-option label="Blue" value="blue" />
          <el-option label="Orange" value="orange" />
        </el-select>
      </div>

      <div class="drawer-item">
        <span>开启 Tags-View</span>
        <el-switch v-model="tagsView" class="drawer-switch" />
      </div>

      <div class="drawer-item">
        <span>固定 Header</span>
        <el-switch v-model="fixedHeader" class="drawer-switch" />
      </div>

      <div class="drawer-item">
        <span>侧边栏 Logo</span>
        <el-switch v-model="sidebarLogo" class="drawer-switch" />
      </div>

      <div class="drawer-item">
        <span>侧边栏子目录气泡显示</span>
        <el-switch v-model="secondMenuPopup" class="drawer-switch" />
      </div>

    </div>
  </div>
</template>

<script>
// import ThemePicker from '@/components/ThemePicker';
import { defineComponent } from 'vue';
import store from '@/store';

export default defineComponent({
  components: {
    // ThemePicker
  },
  data() {
    return {};
  },
  computed: {
    theme: {
      get() {
        return store.settings().theme;
      },
      set(val) {
        store.settings().changeSetting({
          key: 'theme',
          value: val
        });
      }
    },
    fixedHeader: {
      get() {
        return store.settings().fixedHeader;
      },
      set(val) {
        store.settings().changeSetting({
          key: 'fixedHeader',
          value: val
        });
      }
    },
    tagsView: {
      get() {
        return store.settings().tagsView;
      },
      set(val) {
        store.settings().changeSetting({
          key: 'tagsView',
          value: val
        });
      }
    },
    sidebarLogo: {
      get() {
        return store.settings().sidebarLogo;
      },
      set(val) {
        store.settings().changeSetting({
          key: 'sidebarLogo',
          value: val
        });
      }
    },
    secondMenuPopup: {
      get() {
        return store.settings().secondMenuPopup;
      },
      set(val) {
        store.settings().changeSetting({
          key: 'secondMenuPopup',
          value: val
        });
      }
    }
  }
});
</script>


