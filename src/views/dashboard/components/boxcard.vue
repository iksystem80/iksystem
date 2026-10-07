<template>
  <el-card class="box-card-component" style="margin-left: 8px;" >
    <template #header>
      <div class="box-card-header">
        <img src="https://wpimg.wallstcn.com/e7d23d71-cf19-4b90-a1cc-f56af8c0903d.png" >
      </div>
    </template>

    <div style="position: relative;">
      <pan-thumb
        :image="avatar"
        class="panThumb"
      />

      <mallki
        class-name="mallki-text"
        text="vue-element-admin"
      />

      <div
        style="padding-top: 35px;"
        class="progress-item"
      >
        <span>Vue</span>
        <el-progress :percentage="70" />
      </div>

      <div class="progress-item">
        <span>JavaScript</span>
        <el-progress :percentage="18" />
      </div>

      <div class="progress-item">
        <span>Css</span>
        <el-progress :percentage="12" />
      </div>

      <div class="progress-item">
        <span>ESLint</span>
        <el-progress
          :percentage="100"
          status="success"
        />
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';

import PanThumb from '@/components/panthumb';
import Mallki from '@/components/TextHoverEffect/mallki';
import { useUserStore } from '@/store/modules/user';

defineOptions({
  name: 'BoxCard'
});

const userStore = useUserStore();

const { avatar } = storeToRefs(userStore);
</script>
