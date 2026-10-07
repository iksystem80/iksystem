<template>
  <OwnerTransactions v-if="isOwner" />
  <AdminTransactions v-else-if="isAdmin" />
  <el-alert v-else type="error" title="Owner/Admin access required" show-icon :closable="false" />
</template>
<script setup>
import { computed } from 'vue';
import { useUserStore } from '@/store/modules/user';
import OwnerTransactions from './ownertransactions.vue';
import AdminTransactions from './admintransactions.vue';
const store = useUserStore();
const role = computed(() => String(store.roleName || '').trim().toLowerCase());
const isOwner = computed(() => ['owner', 'system admin'].includes(role.value));
const isAdmin = computed(() => role.value === 'admin');
</script>
