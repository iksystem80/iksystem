<template>
  <el-config-provider :size="size" :z-index="zIndex">
    <router-view />
  </el-config-provider>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppStore } from '@/store/modules/app';
// import socket from './services/socket';

const appStore = useAppStore();

const { size } = storeToRefs(appStore); const zIndex = ref(3000);

</script>
