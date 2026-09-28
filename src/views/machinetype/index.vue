<template>
    <div class="app-container irfan-ui-page">
        <el-button type="primary" @click="dialogFormVisible = true" style="float: right;margin-bottom:5px;">
            <el-icon><Plus /></el-icon>
        </el-button>
        <el-dialog v-model="dialogFormVisible" title="New machine Type" class="eldialog-class" @close="handleClose">
            <div style="margin-top: 10px">
                <el-form ref="machinetypeFormRef" :model="machinetypeForm" :rules="formRules">
                    <el-form-item label="machinetypename" prop="machinetypename">
                        <el-input v-model="machinetypeForm.machinetypename" placeholder="Enter machine type name" />
                    </el-form-item>
                    <!-- Form Actions -->
                    <el-form-item>
                        <el-button type="primary" :loading="loading" @click="submitForm">
                            Submit
                        </el-button>
                    </el-form-item>
                </el-form>
            </div>
        </el-dialog>
        <!-- Employee Table -->
        <el-table v-loading="loading" :data="machinetypesData" border style="width: 100%; margin-top: 20px">
            <!-- Full Name -->
            <el-table-column prop="machinetypename" label="Machine Type" width="180" />
            <el-table-column prop="games" label="Available Games" min-width="180" />
            <!-- Operations -->
            <el-table-column fixed="right" label="Operations" width="180" align="center">
                <template #default="{ row }">
                    <el-button link type="primary" @click="handleEdit(row)">
                        <el-icon><Edit /></el-icon>
                    </el-button>
                    <el-button link type="danger" @click="handleDelete(row)">
                        <el-icon><Delete /></el-icon>
                    </el-button>
                </template>
            </el-table-column>
        </el-table>

        <!-- Empty State -->
        <el-empty v-if="!loading && !machinetypesData" description="No machinetypes found" />
    </div>
</template>

<script setup>

    import { onMounted, ref, computed, reactive } from 'vue'
    import { useUserStore } from '@/store/modules/user'
    import { useAppStore } from '@/store/modules/app'
    import { savemachinetype, getmachinetype } from '@/api/machine'

    const appStore = useAppStore()
    const userStore = useUserStore()
    const device = computed(() => appStore.device)
    const dialogFormVisible = ref(false)


    const machinetypesData = ref([])

    const machinetypeFormRef = ref(null)
    const defaultForm = {
        machinetypename: ''
    }

    const machinetypeForm = reactive({
        ...defaultForm
    })

    const formRules = {
        machinetypename: [
            {
                required: true,
                message: 'machine type is required',
                trigger: 'blur'
            },
            {
                min: 2,
                max: 50,
                message: 'machine type should be 2 to 50 characters',
                trigger: 'blur'
            }
        ]
    }

    const loading = ref(false)
    /**
     * Load employees from API
     */
    async function loadmachinetypes() {
        loading.value = true

        try {
            const locationid = userStore.locationId

            const response = await getmachinetype()
            machinetypesData.value = response.data

            console.log(machinetypesData.value)

        } catch (error) {
            ElMessage.error(error?.message || 'Failed to load machine types')
            machinetypesData.value = null
        } finally {
            loading.value = false
        }
    }

    async function submitForm() {
        if (!machinetypeFormRef.value) {
            return
        }

        try {
            // Validate form
            await machinetypeFormRef.value.validate()

            loading.value = true

            console.log('machinetype:', machinetypeForm)

            // Save employee
            const response = await savemachinetype(machinetypeForm)

            if (!response) {
                throw new Error('Save machinetype failed')
            }

            console.log('Server response:', response)

            ElMessage({ message: 'New machine type has been added successfully.', type: 'success' })

            // Reset form
            resetForm()

            loadmachinetypes()

        } catch (error) {
            console.error('Error while saving machinetype:', error)

            ElMessage({ message: error.message || 'Error while saving machinetype.', type: 'error' })
        } finally {
            loading.value = false
        }
    }

    /**
 * Load employees when component is mounted
 */
onMounted(() => {
        loadmachinetypes()
    })

    /**
 * Reset form
 */
    function resetForm() {
        machinetypeFormRef.value?.resetFields()
        Object.assign(machinetypeForm, defaultForm)
    }

    async function handleClose(){
    }

    function handleEdit(row) {
        console.log('Edit employee:', row)

        loadmachinetypes()
    }

    /**
     * Delete employee
     */
    async function handleDelete(row) {
        console.log(row)
        console.log(row.name)

        const response = await deletemachinetype(row.id)

        console.log(response)

        ElMessage.success('machine type deleted successfully')

        loadmachinetypes()
    }
</script>

