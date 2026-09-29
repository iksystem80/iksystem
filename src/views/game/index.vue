<template>
    <div class="app-container">
        <el-button type="primary" @click="dialogFormVisible = true" style="float: right;margin-bottom:5px;">
            <el-icon><Plus /></el-icon>
        </el-button>
        <DragSelect v-model="selectedMachine" placeholder="Select machine types">
            <el-option v-for="type in machinetypesData" :key="type.id" :label="type.machinetypename" :value="type.id" />
        </DragSelect>
        <el-dialog v-model="dialogFormVisible" title="New Game" class="eldialog-class" @close="handleClose">
            <div style="margin-top: 10px">
                <el-form ref="gameFormRef" :model="gameForm" :rules="formRules">
                    <el-form-item label="Gamename" prop="gamename">
                        <el-input v-model="gameForm.gamename" placeholder="Enter game name" />
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
        <el-table v-loading="loading" :data="gamesData" border style="width: 100%; margin-top: 20px">
            <!-- Full Name -->
            <el-table-column prop="gamename" label="Game Name" min-width="180" />
            <el-table-column prop="machinetype" label="Machine Type" min-width="180" />
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
        <el-empty v-if="!loading && !gamesData" description="No games found" />
    </div>
</template>

<script setup>

    import { onMounted, ref, computed, reactive } from 'vue'
    import { useUserStore } from '@/store/modules/user'
    import { useAppStore } from '@/store/modules/app'
    import { getmachinetype, savegame, getgames } from '@/api/machine'
    import DragSelect from '@/components/DragSelect/index.vue'

    const appStore = useAppStore()
    const userStore = useUserStore()
    const device = computed(() => appStore.device)
    const dialogFormVisible = ref(false)

    const selectedMachine = ref([])
    const games = ref([
  {
    id: 1,
    name: 'Game 1'
  },
  {
    id: 2,
    name: 'Game 2'
  },
  {
    id: 3,
    name: 'Game 3'
  },
  {
    id: 4,
    name: 'Game 4'
  }
])

    const gamesData = ref([])

    const gameFormRef = ref(null)
    const defaultForm = {
        gamename: ''
    }

    const gameForm = reactive({
        ...defaultForm
    })

    const formRules = {
        gamename: [
            {
                required: true,
                message: 'Game name is required',
                trigger: 'blur'
            },
            {
                min: 2,
                max: 50,
                message: 'Game name should be 2 to 50 characters',
                trigger: 'blur'
            }
        ]
    }

const loading = ref(false)

const machinetypesData = ref([])

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


    /**
     * Load employees from API
     */
    async function loadGames() {
        loading.value = true

        try {
            const locationid = userStore.locationId

            const response = await getgames()
            gamesData.value = response.data

            console.log(gamesData.value)

        } catch (error) {
            ElMessage.error(error?.message || 'Failed to load customers')
            gamesData.value = null
        } finally {
            loading.value = false
        }
    }

    async function submitForm() {
        if (!gameFormRef.value) {
            return
        }

        try {
            // Validate form
            await gameFormRef.value.validate()

            loading.value = true

            console.log('Game:', gameForm)

            // Save employee
            const response = await savegame(gameForm)

            if (!response) {
                throw new Error('Save game failed')
            }

            console.log('Server response:', response)

            ElMessage({ message: 'New game has been added successfully.', type: 'success' })

            // Reset form
            resetForm()
            loadGames()
            
        } catch (error) {
            console.error('Error while saving game:', error)

            ElMessage({ message: error.message || 'Error while saving game.', type: 'error' })
        } finally {
            loading.value = false
        }
    }

    /**
 * Load employees when component is mounted
 */
onMounted(() => {
        loadGames()
        loadmachinetypes()
    })

    /**
 * Reset form
 */
    function resetForm() {
        gameFormRef.value?.resetFields()
        Object.assign(gameForm, defaultForm)
    }
    
    async function handleClose(){
    }

    function handleEdit(row) {
        console.log('Edit employee:', row)

        loadGames()
    }

    /**
     * Delete employee
     */
    async function handleDelete(row) {
        console.log(row)
        console.log(row.name)

        const response = await deletegame(row.id)

        console.log(response)

        ElMessage.success('game deleted successfully')

        loadGames()
    }
</script>

