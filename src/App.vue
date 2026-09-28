<template>
  <el-config-provider :size="size" :z-index="zIndex">
    <router-view />
  </el-config-provider>
</template>

<script setup lang="ts">
    import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
    import { storeToRefs } from 'pinia'
    import en from 'element-plus/dist/locale/en.mjs'
    import { useAppStore } from '@/store/modules/app'
    import { useUserStore } from '@/store/modules/user'
    //import socket from './services/socket';
    import { ElMessage, ElNotification } from 'element-plus'

    const appStore = useAppStore()
    const userStore = useUserStore()

    const { size } = storeToRefs(appStore)

    const locale = ref(en)
    const zIndex = ref(3000)

    const locationid = userStore.locationId

    // watch(
    //     () => userStore.locationId,
    //     (locationId) => {
    //         if (!locationId) {
    //             return
    //         }

    //         console.log('Joining location:', locationId)

    //         socket.emit('join-location', locationId)
    //         initializeSocketListeners()
    //     },
    //     {
    //         immediate: true,
    //     }
    // )

    // onMounted(() => {
    //     if (locationid) {
    //         console.log('Joining location:', locationid);
    //         socket.emit('join-location', locationid);

    //         // socket.on('customer-checkin', notifyCheckin)
    //     }
    // });

    //onBeforeUnmount(() => {
        // socket.disconnect();
    //});

    //function notifyCheckin(data) {
    //    if (Number(data.locationId) === Number(userStore.locationId)) {
    //        console.log('Refreshing check-in list...: ' + data)
    //        ElNotification({
    //            title: `${data.firstname} ${data.lastname}`,
    //            message: `checked-in at ${new Date().toLocaleTimeString()}`,
    //            duration: 5000,
    //            type: 'success',
    //            progress: true,
    //            pauseOnHover: false,
    //        })
            
    //    }
    //}

</script>

<style lang="scss">
html,
body,
#app {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}
</style>
