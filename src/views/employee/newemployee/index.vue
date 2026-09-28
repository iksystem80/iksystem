<template>
    <div class="app-container irfan-ui-page">
        <div style="margin-top: 10px">
            <el-form ref="employeeFormRef" :model="employeeForm" :rules="formRules">
                <!-- Username -->
                <el-form-item label="Username" prop="username">
                    <el-input v-model="employeeForm.username" placeholder="Enter username" />
                </el-form-item>
                <!-- Password -->
                <el-form-item label="Password" prop="password">
                    <el-input v-model="employeeForm.password" type="password" show-password placeholder="Enter password" />
                </el-form-item>
                <!-- Full Name -->
                <el-form-item label="Full Name" prop="name">
                    <el-input v-model="employeeForm.name" placeholder="Enter full name" />
                </el-form-item>
                <!-- Form Actions -->
                <el-form-item>
                    <el-button type="primary" :loading="loading" @click="submitForm">
                        Submit
                    </el-button>
                    <el-button @click="resetForm">
                        Reset
                    </el-button>
                </el-form-item>
            </el-form>
        </div>
    </div>
</template>

<script setup>
    import { reactive, ref } from 'vue'
    import { ElMessage } from 'element-plus'
    import { useUserStore } from '@/store/modules/user'
    import { saveemployee } from '@/api/employee'

    const emit = defineEmits(['close'])

    // function submitAndClose() {
    //     // 1. Your API or logic goes here

    //     // 2. Notify the parent
    //     emit('close')
    // }

    // function cancel() {
    //     emit('close')
    // }
    /**
     * User store
     */
    const userStore = useUserStore()

    /**
     * Form reference
     */
    const employeeFormRef = ref(null)

    /**
     * Loading state
     */
    const loading = ref(false)

    /**
     * Default form
     */
    const defaultForm = {
        username: '',
        password: '',
        name: '',
        locationid: 0,
        datecreated: '',
        isactive: false
    }

    /**
     * Employee form
     */
    const employeeForm = reactive({
        ...defaultForm
    })

    /**
     * Form validation rules
     */
    const formRules = {
        username: [
            {
                required: true,
                message: 'Username is required',
                trigger: 'blur'
            },
            {
                min: 2,
                max: 50,
                message: 'Username should be 2 to 50 characters',
                trigger: 'blur'
            }
        ],

        password: [
            {
                required: true,
                message: 'Password is required',
                trigger: 'blur'
            },
            {
                min: 6,
                max: 50,
                message: 'Password should be 6 to 50 characters',
                trigger: 'blur'
            }
        ],

        name: [
            {
                required: true,
                message: 'Full name is required',
                trigger: 'blur'
            },
            {
                min: 2,
                max: 100,
                message: 'Name should be 2 to 100 characters',
                trigger: 'blur'
            }
        ]
    }

    /**
     * Submit employee
     */
    async function submitForm() {
        if (!employeeFormRef.value) {
            return
        }

        try {
            // Validate form
            await employeeFormRef.value.validate()

            loading.value = true

            // Get location ID from Pinia
            employeeForm.locationid = userStore.locationId

            console.log('Employee:', employeeForm)

            // Save employee
            const response = await saveemployee(employeeForm)

            if (!response) {
                throw new Error('Save employee failed')
            }

            console.log('Server response:', response)

            ElMessage({message: 'New employee has been added successfully.',type: 'success'})

            // Reset form
            resetForm()

            emit('close')
        } catch (error) {
            console.error('Error while saving employee:', error)

            ElMessage({message: error.message || 'Error while saving employee.',type: 'error'})
        } finally {
            loading.value = false
        }
    }

    /**
     * Reset form
     */
    function resetForm() {
        employeeFormRef.value?.resetFields()
        Object.assign(employeeForm, defaultForm)
    }
</script>


