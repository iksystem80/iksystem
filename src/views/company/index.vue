<template>
    <div class="app-container">
        <!-- Header -->
        <div class="page-header">
            <div>
                <h2>Companies</h2>
                <p>
                    Manage companies, locations and company owners.
                </p>
            </div>
            <el-button type="primary" @click="openCreateDialog">
                Add Company
            </el-button>
        </div>
        <!-- Company Table -->
        <el-card shadow="never">
            <el-table v-loading="loading" :data="companies" style="width: 100%">
                <el-table-column prop="name" label="Company" min-width="220" />
                <el-table-column prop="code" label="Code" width="140">
                    <template #default="{ row }">
                        {{ row.code || '-' }}
                    </template>
                </el-table-column>

                <el-table-column prop="locationCount"
                                 label="Locations"
                                 width="120"
                                 align="center" />

                <el-table-column prop="userCount"
                                 label="Users"
                                 width="100"
                                 align="center" />

                <el-table-column label="Status"
                                 width="120"
                                 align="center">
                    <template #default="{ row }">

                        <el-tag :type="
                                row.isActive
                                    ? 'success'
                                    : 'danger'
                            ">
                            {{
                                row.isActive
                                    ? 'Active'
                                    : 'Inactive'
                            }}
                        </el-tag>

                    </template>
                </el-table-column>

                <el-table-column label="Actions"
                                 width="260"
                                 fixed="right">
                    <template #default="{ row }">

                        <el-button link
                                   type="primary"
                                   @click="openCompany(row)">
                            Manage
                        </el-button>

                        <el-button link
                                   type="primary"
                                   @click="editCompany(row)">
                            Edit
                        </el-button>

                        <el-button link
                                   :type="
                                row.isActive
                                    ? 'danger'
                                    : 'success'
                            "
                                   @click="toggleCompanyStatus(row)">
                            {{
                                row.isActive
                                    ? 'Deactivate'
                                    : 'Activate'
                            }}
                        </el-button>

                    </template>
                </el-table-column>

            </el-table>

        </el-card>

        <!-- ================================================= -->
        <!-- CREATE COMPANY DIALOG -->
        <!-- ================================================= -->

        <el-dialog v-model="createDialogVisible"
                   title="Create Company"
                   width="650px"
                   :close-on-click-modal="false">
            <el-form ref="createFormRef"
                     :model="createForm"
                     :rules="createRules"
                     label-position="top">

                <div class="form-section">
                    Company Information
                </div>

                <el-row :gutter="16">

                    <el-col :span="16">

                        <el-form-item label="Company Name"
                                      prop="companyName">
                            <el-input v-model="createForm.companyName" />
                        </el-form-item>

                    </el-col>

                    <el-col :span="8">

                        <el-form-item label="Company Code">
                            <el-input v-model="createForm.companyCode" />
                        </el-form-item>

                    </el-col>

                </el-row>

                <div class="form-section">
                    First Location
                </div>

                <el-form-item label="Location Name"
                              prop="locationName">
                    <el-input v-model="createForm.locationName" />
                </el-form-item>

                <div class="form-section">
                    Owner Account
                </div>

                <el-row :gutter="16">

                    <el-col :span="12">

                        <el-form-item label="Owner Name"
                                      prop="ownerName">
                            <el-input v-model="createForm.ownerName" />
                        </el-form-item>

                    </el-col>

                    <el-col :span="12">

                        <el-form-item label="Username"
                                      prop="ownerUsername">
                            <el-input v-model="createForm.ownerUsername" />
                        </el-form-item>

                    </el-col>

                </el-row>

                <el-row :gutter="16">

                    <el-col :span="12">

                        <el-form-item label="Password"
                                      prop="ownerPassword">
                            <el-input v-model="createForm.ownerPassword"
                                      type="password"
                                      show-password />
                        </el-form-item>

                    </el-col>

                    <el-col :span="12">

                        <el-form-item label="Email">
                            <el-input v-model="createForm.ownerEmail" />
                        </el-form-item>

                    </el-col>

                </el-row>

                <el-form-item label="Phone">
                    <el-input v-model="createForm.ownerPhone" />
                </el-form-item>

            </el-form>

            <template #footer>

                <el-button @click="createDialogVisible = false">
                    Cancel
                </el-button>

                <el-button type="primary"
                           :loading="saving"
                           @click="saveCompany">
                    Create Company
                </el-button>

            </template>
        </el-dialog>

        <!-- ================================================= -->
        <!-- EDIT COMPANY DIALOG -->
        <!-- ================================================= -->

        <el-dialog v-model="editDialogVisible"
                   title="Edit Company"
                   width="500px">

            <el-form label-position="top">

                <el-form-item label="Company Name">
                    <el-input v-model="editForm.name" />
                </el-form-item>

                <el-form-item label="Company Code">
                    <el-input v-model="editForm.code" />
                </el-form-item>

                <el-form-item label="Active">

                    <el-switch v-model="editForm.isActive" />

                </el-form-item>

            </el-form>

            <template #footer>

                <el-button @click="editDialogVisible = false">
                    Cancel
                </el-button>

                <el-button type="primary"
                           :loading="saving"
                           @click="saveCompanyUpdate">
                    Save
                </el-button>

            </template>

        </el-dialog>

    </div>
</template>

<script setup>
import {
    ref,
    reactive,
    onMounted
} from 'vue'

import {
    useRouter
} from 'vue-router'

import {
    ElMessage,
    ElMessageBox
} from 'element-plus'

import {
    getCompanies,
    createCompany,
    updateCompany,
    updateCompanyStatus
} from '@/api/company'

const router =
    useRouter()

const companies =
    ref([])

const loading =
    ref(false)

const saving =
    ref(false)

const createDialogVisible =
    ref(false)

const editDialogVisible =
    ref(false)

const createFormRef =
    ref()

const createForm =
    reactive({
        companyName: '',
        companyCode: '',
        locationName: '',

        ownerName: '',
        ownerUsername: '',
        ownerPassword: '',
        ownerEmail: '',
        ownerPhone: ''
    })

const editForm =
    reactive({
        id: null,
        name: '',
        code: '',
        isActive: true
    })

const createRules = {
    companyName: [
        {
            required: true,
            message:
                'Company name is required.',
            trigger: 'blur'
        }
    ],

    locationName: [
        {
            required: true,
            message:
                'Location name is required.',
            trigger: 'blur'
        }
    ],

    ownerName: [
        {
            required: true,
            message:
                'Owner name is required.',
            trigger: 'blur'
        }
    ],

    ownerUsername: [
        {
            required: true,
            message:
                'Username is required.',
            trigger: 'blur'
        }
    ],

    ownerPassword: [
        {
            required: true,
            message:
                'Password is required.',
            trigger: 'blur'
        }
    ]
}

async function loadCompanies() {
    loading.value =
        true

    try {
        const response =
            await getCompanies()

        companies.value =
            response.data || []

    } catch (error) {
        console.error(error)

        ElMessage.error(
            'Unable to load companies.'
        )

    } finally {
        loading.value =
            false
    }
}

function resetCreateForm() {
    Object.assign(
        createForm,
        {
            companyName: '',
            companyCode: '',
            locationName: '',

            ownerName: '',
            ownerUsername: '',
            ownerPassword: '',
            ownerEmail: '',
            ownerPhone: ''
        }
    )
}

function openCreateDialog() {
    resetCreateForm()

    createDialogVisible.value =
        true
}

async function saveCompany() {

    if (!createFormRef.value) {
        return
    }

    await createFormRef.value.validate(
        async valid => {

            if (!valid) {
                return
            }

            saving.value =
                true

            try {
                await createCompany({
                    ...createForm
                })

                ElMessage.success(
                    'Company created successfully.'
                )

                createDialogVisible.value =
                    false

                await loadCompanies()

            } catch (error) {
                console.error(error)

                ElMessage.error(
                    error?.response?.data?.message ||
                    'Unable to create company.'
                )

            } finally {
                saving.value =
                    false
            }
        }
    )
}

function openCompany(row) {
    router.push({
        name: 'CompanyDetail',

        params: {
            companyId:
                row.id
        }
    })
}

function editCompany(row) {
    Object.assign(
        editForm,
        {
            id:
                row.id,

            name:
                row.name,

            code:
                row.code || '',

            isActive:
                row.isActive
        }
    )

    editDialogVisible.value =
        true
}

async function saveCompanyUpdate() {
    saving.value =
        true

    try {
        await updateCompany(
            editForm.id,
            {
                name:
                    editForm.name,

                code:
                    editForm.code,

                isActive:
                    editForm.isActive
            }
        )

        ElMessage.success(
            'Company updated successfully.'
        )

        editDialogVisible.value =
            false

        await loadCompanies()

    } catch (error) {
        console.error(error)

        ElMessage.error(
            'Unable to update company.'
        )

    } finally {
        saving.value =
            false
    }
}

async function toggleCompanyStatus(row) {
    try {
        const newStatus =
            !row.isActive

        await ElMessageBox.confirm(
            newStatus
                ? 'Activate this company?'
                : 'Deactivate this company?',
            'Confirm',
            {
                type: 'warning'
            }
        )

        await updateCompanyStatus(
            row.id,
            newStatus
        )

        ElMessage.success(
            'Company status updated.'
        )

        await loadCompanies()

    } catch (error) {
        if (
            error !== 'cancel' &&
            error !== 'close'
        ) {
            console.error(error)
        }
    }
}

onMounted(
    loadCompanies
)
</script>

