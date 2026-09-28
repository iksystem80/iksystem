<template>
    <div class="page-container irfan-settings-machine-index irfan-ui-page">
        <div class="page-header">
            <div>
                <h2>Machine Setup</h2>
                <div class="subtitle">
                    Manage machines, machine types, games and machine history.
                </div>
            </div>
            <el-button v-if="canManageMachines" type="primary" @click="openGenerateDialog">
                Generate Machines
            </el-button>
        </div>
        <el-tabs v-model="activeTab">
            <!-- ================================================== -->
            <!-- MACHINES -->
            <!-- ================================================== -->
            <el-tab-pane label="Machines" name="machines">
                <div class="toolbar">
                    <el-input v-model="machineSearch" placeholder="Search machine..." clearable class="search" />
                    <el-button @click="loadMachines">
                        Refresh
                    </el-button>
                </div>
                <el-table v-loading="loadingMachines" :data="filteredMachines" stripe border>
                    <el-table-column prop="MachineNumber" label="Machine" width="110" />
                    <el-table-column prop="MachineTypeName" label="Machine Type" min-width="150">
                        <template #default="{ row }">
                            {{ row.MachineTypeName || 'Not Assigned' }}
                        </template>
                    </el-table-column>

                    <el-table-column prop="GameName"
                                     label="Game"
                                     min-width="160">
                        <template #default="{ row }">
                            {{ row.GameName || 'Not Assigned' }}
                        </template>
                    </el-table-column>

                    <el-table-column prop="Status"
                                     label="Status"
                                     width="130">
                        <template #default="{ row }">
                            <el-tag :type="statusTag(row.Status)">
                                {{ row.Status || 'Unknown' }}
                            </el-tag>
                        </template>
                    </el-table-column>

                    <el-table-column prop="StatusReason"
                                     label="Reason"
                                     min-width="220">
                        <template #default="{ row }">
                            {{ row.StatusReason || '-' }}
                        </template>
                    </el-table-column>

                    <el-table-column label="Actions"
                                     width="185"
                                     fixed="right">
                        <template #default="{ row }">
                            <el-button v-if="canManageMachines"
                                       link
                                       type="primary"
                                       @click="openEditMachine(row)">
                                Edit
                            </el-button>

                            <el-button link
                                       @click="openHistory(row)">
                                History
                            </el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </el-tab-pane>

            <!-- ================================================== -->
            <!-- MACHINE TYPES -->
            <!-- ================================================== -->

            <el-tab-pane label="Machine Types" name="types">
                <div class="toolbar">
                    <el-button v-if="canManageTypes"
                               type="primary"
                               @click="openTypeDialog()">
                        Add Machine Type
                    </el-button>
                </div>

                <el-table :data="machineTypes" border stripe>
                    <el-table-column prop="TypeName"
                                     label="Machine Type" />

                    <el-table-column label="Status"
                                     width="120">
                        <template #default="{ row }">
                            <el-tag :type="row.IsActive ? 'success' : 'info'">
                                {{ row.IsActive ? 'Active' : 'Inactive' }}
                            </el-tag>
                        </template>
                    </el-table-column>

                    <el-table-column v-if="canManageTypes"
                                     label="Actions"
                                     width="160">
                        <template #default="{ row }">
                            <el-button link
                                       type="primary"
                                       @click="openTypeDialog(row)">
                                Edit
                            </el-button>

                            <el-button link
                                       type="danger"
                                       @click="removeType(row)">
                                Delete
                            </el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </el-tab-pane>

            <!-- ================================================== -->
            <!-- GAMES -->
            <!-- ================================================== -->

            <el-tab-pane label="Games" name="games">
                <div class="toolbar">
                    <el-button v-if="canManageGames"
                               type="primary"
                               @click="openGameDialog()">
                        Add Game
                    </el-button>
                </div>

                <el-table :data="games" border stripe>
                    <el-table-column prop="GameName"
                                     label="Game" />

                    <el-table-column prop="MachineTypeName"
                                     label="Supported Machine Type" />

                    <el-table-column label="Status"
                                     width="120">
                        <template #default="{ row }">
                            <el-tag :type="row.IsActive ? 'success' : 'info'">
                                {{ row.IsActive ? 'Active' : 'Inactive' }}
                            </el-tag>
                        </template>
                    </el-table-column>

                    <el-table-column v-if="canManageGames"
                                     label="Actions"
                                     width="160">
                        <template #default="{ row }">
                            <el-button link
                                       type="primary"
                                       @click="openGameDialog(row)">
                                Edit
                            </el-button>

                            <el-button link
                                       type="danger"
                                       @click="removeGame(row)">
                                Delete
                            </el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </el-tab-pane>
        </el-tabs>

        <!-- ==================================================== -->
        <!-- GENERATE MACHINES -->
        <!-- ==================================================== -->

        <el-dialog v-model="generateVisible"
                   title="Generate Machines"
                   width="500px">
            <el-form label-position="top">
                <el-form-item label="Start Machine Number">
                    <el-input-number v-model="generateForm.startNumber"
                                     :min="1"
                                     style="width: 100%" />
                </el-form-item>

                <el-form-item label="End Machine Number">
                    <el-input-number v-model="generateForm.endNumber"
                                     :min="generateForm.startNumber"
                                     style="width: 100%" />
                </el-form-item>

                <el-form-item label="Machine Type">
                    <el-select v-model="generateForm.machineTypeId"
                               clearable
                               placeholder="Optional"
                               style="width: 100%">
                        <el-option v-for="item in activeMachineTypes"
                                   :key="item.ID"
                                   :label="item.TypeName"
                                   :value="item.ID" />
                    </el-select>
                </el-form-item>

                <el-alert type="info"
                          :closable="false"
                          show-icon>
                    Machines will be created for your currently selected location.
                </el-alert>
            </el-form>

            <template #footer>
                <el-button @click="generateVisible = false">
                    Cancel
                </el-button>

                <el-button type="primary"
                           :loading="saving"
                           @click="submitGenerate">
                    Generate
                </el-button>
            </template>
        </el-dialog>

        <!-- ==================================================== -->
        <!-- EDIT MACHINE -->
        <!-- ==================================================== -->

        <el-dialog v-model="machineVisible"
                   :title="`Machine #${machineForm.MachineNumber || ''}`"
                   width="520px">
            <el-form label-position="top">
                <el-form-item label="Machine Type">
                    <el-select v-model="machineForm.MachineTypeId"
                               clearable
                               style="width: 100%"
                               @change="machineTypeChanged">
                        <el-option v-for="item in activeMachineTypes"
                                   :key="item.ID"
                                   :label="item.TypeName"
                                   :value="item.ID" />
                    </el-select>
                </el-form-item>

                <el-form-item label="Game">
                    <el-select v-model="machineForm.GameId"
                               clearable
                               :disabled="!machineForm.MachineTypeId"
                               style="width: 100%">
                        <el-option v-for="item in compatibleGames"
                                   :key="item.ID"
                                   :label="item.GameName"
                                   :value="item.ID" />
                    </el-select>
                </el-form-item>

                <el-form-item label="Status">
                    <el-select v-model="machineForm.StatusId"
                               style="width: 100%"
                               @change="statusChanged">
                        <el-option v-for="item in statuses"
                                   :key="item.ID"
                                   :label="item.Description"
                                   :value="item.ID" />
                    </el-select>
                </el-form-item>

                <el-form-item v-if="selectedStatusIsNotWorking"
                              label="Reason"
                              required>
                    <el-input v-model="machineForm.StatusReason"
                              type="textarea"
                              :rows="3"
                              maxlength="1000"
                              show-word-limit
                              placeholder="Why is this machine not working?" />
                </el-form-item>
            </el-form>

            <template #footer>
                <el-button @click="machineVisible = false">
                    Cancel
                </el-button>

                <el-button type="primary"
                           :loading="saving"
                           @click="saveMachine">
                    Save
                </el-button>
            </template>
        </el-dialog>

        <!-- ==================================================== -->
        <!-- MACHINE TYPE -->
        <!-- ==================================================== -->

        <el-dialog v-model="typeVisible"
                   :title="typeForm.ID ? 'Edit Machine Type' : 'Add Machine Type'"
                   width="450px">
            <el-form label-position="top">
                <el-form-item label="Type Name">
                    <el-input v-model="typeForm.TypeName" />
                </el-form-item>

                <el-form-item v-if="typeForm.ID" label="Active">
                    <el-switch v-model="typeForm.IsActive" />
                </el-form-item>
            </el-form>

            <template #footer>
                <el-button @click="typeVisible = false">
                    Cancel
                </el-button>

                <el-button type="primary"
                           :loading="saving"
                           @click="saveType">
                    Save
                </el-button>
            </template>
        </el-dialog>

        <!-- ==================================================== -->
        <!-- GAME -->
        <!-- ==================================================== -->

        <el-dialog v-model="gameVisible"
                   :title="gameForm.ID ? 'Edit Game' : 'Add Game'"
                   width="470px">
            <el-form label-position="top">
                <el-form-item label="Game Name">
                    <el-input v-model="gameForm.GameName" />
                </el-form-item>

                <el-form-item label="Machine Type">
                    <el-select v-model="gameForm.MachineTypeId"
                               style="width: 100%">
                        <el-option v-for="item in activeMachineTypes"
                                   :key="item.ID"
                                   :label="item.TypeName"
                                   :value="item.ID" />
                    </el-select>
                </el-form-item>

                <el-form-item v-if="gameForm.ID" label="Active">
                    <el-switch v-model="gameForm.IsActive" />
                </el-form-item>
            </el-form>

            <template #footer>
                <el-button @click="gameVisible = false">
                    Cancel
                </el-button>

                <el-button type="primary"
                           :loading="saving"
                           @click="saveGame">
                    Save
                </el-button>
            </template>
        </el-dialog>

        <!-- ==================================================== -->
        <!-- HISTORY -->
        <!-- ==================================================== -->

        <el-drawer v-model="historyVisible"
                   title="Machine History"
                   size="70%">
            <el-table v-loading="historyLoading"
                      :data="history" style="font-size:12px;"
                      stripe>
                <el-table-column prop="DateCreated"
                                 label="Date"
                                 width="145">
                    <template #default="{ row }">
                        {{ formatDateTime(row.DateCreated) }}
                    </template>
                </el-table-column>

                <el-table-column prop="ActionType"
                                 label="Action"
                                 width="160" />

                <el-table-column prop="OldValue"
                                 label="Old"
                                 width="150">
                    <template #default="{ row }">0
                        {{ row.OldValue || '---' }}
                    </template>
                </el-table-column>

                <el-table-column prop="NewValue"
                                 label="New"
                                 width="150">
                    <template #default="{ row }">
                        {{ row.NewValue || '---' }}
                    </template>
                </el-table-column>

                <el-table-column prop="Reason"
                                 label="Reason" min-width="160" />

                <el-table-column prop="ChangedByName"
                                 label="Changed By"
                                 width="110" />
            </el-table>
        </el-drawer>
    </div>
</template>

<script setup lang="ts">
import {
      computed,
      onMounted,
      reactive,
      ref,
      watch
} from 'vue'

import {
      ElMessage,
      ElMessageBox
} from 'element-plus'

import { useUserStore } from '@/store/modules/user'
import { formatDateTime } from '@/utils/date'

import {
      getMachines,
      generateMachines,
      updateMachine,
      getMachineLogs,
      getMachineStatuses,
      getMachineTypes,
      createMachineType,
      updateMachineType,
      deleteMachineType,
      getGames,
      createGame,
      updateGame,
      deleteGame
} from '@/api/machine'

const userStore = useUserStore()

const activeTab = ref('machines')
const machineSearch = ref('')

const machines = ref<any[]>([])
const machineTypes = ref<any[]>([])
const statuses = ref<any[]>([])
const games = ref<any[]>([])
const history = ref<any[]>([])

const loadingMachines = ref(false)
const historyLoading = ref(false)
const saving = ref(false)

const generateVisible = ref(false)
const machineVisible = ref(false)
const typeVisible = ref(false)
const gameVisible = ref(false)
const historyVisible = ref(false)

const canManageMachines = computed(() =>
      userStore.isOwner ||
      userStore.isAdmin ||
      userStore.hasPermission('machines.update')
)

const canManageTypes = computed(() =>
      userStore.isOwner ||
      userStore.isAdmin ||
      userStore.hasPermission('machinetypes.update')
)

const canManageGames = computed(() =>
      userStore.isOwner ||
      userStore.isAdmin ||
      userStore.hasPermission('games.update')
)

const generateForm = reactive({
      startNumber: 1,
      endNumber: 10,
      machineTypeId: null as number | null
})

const machineForm = reactive<any>({
      ID: null,
      MachineNumber: null,
      MachineTypeId: null,
      GameId: null,
      StatusId: null,
      StatusReason: ''
})

const typeForm = reactive<any>({
      ID: null,
      TypeName: '',
      IsActive: true
})

const gameForm = reactive<any>({
      ID: null,
      GameName: '',
      MachineTypeId: null,
      IsActive: true
})

const activeMachineTypes = computed(() =>
      machineTypes.value.filter(x => x.IsActive)
)

const compatibleGames = computed(() =>
      games.value.filter(
        x =>
          x.IsActive &&
          Number(x.MachineTypeId) ===
            Number(machineForm.MachineTypeId)
      )
)

const selectedStatusIsNotWorking = computed(() => {
      const item = statuses.value.find(
        x => Number(x.ID) === Number(machineForm.StatusId)
      )

      return (
        String(item?.Description || '')
          .trim()
          .toLowerCase() === 'not working'
      )
})

const filteredMachines = computed(() => {
      const text = machineSearch.value
        .trim()
        .toLowerCase()

      if (!text) return machines.value

      return machines.value.filter(item =>
        [
          item.MachineNumber,
          item.MachineTypeName,
          item.GameName,
          item.Status,
          item.StatusReason
        ]
          .join(' ')
          .toLowerCase()
          .includes(text)
      )
})

function statusTag(status: string) {
      switch (String(status || '').toLowerCase()) {
        case 'working':
        case 'active':
          return 'success'

        case 'not working':
          return 'danger'

        case 'inactive':
          return 'info'

        default:
          return 'warning'
      }
}

async function loadMachines() {
      if (!userStore.locationId) return

      loadingMachines.value = true

      try {
        const result = await getMachines(
          userStore.locationId
        )

        machines.value = result.data || []
      } finally {
        loadingMachines.value = false
      }
}

async function loadReferenceData() {
    try {
        const results = await Promise.allSettled([
            getMachineTypes(),
            getMachineStatuses(),
            getGames()
        ])

        const [typesResult, statusResult, gamesResult] = results

        // Machine Types
        if (typesResult.status === 'fulfilled') {
            machineTypes.value = typesResult.value?.data || []
        } else {
            machineTypes.value = []
            console.error(
                'Failed loading machine types:',
                typesResult.reason
            )
        }

        // Machine Statuses
        if (statusResult.status === 'fulfilled') {
            statuses.value = statusResult.value?.data || []
        } else {
            statuses.value = []
            console.error(
                'Failed loading machine statuses:',
                statusResult.reason
            )
        }

        // Games
        if (gamesResult.status === 'fulfilled') {
            games.value = gamesResult.value?.data || []
        } else {
            games.value = []
            console.error(
                'Failed loading games:',
                gamesResult.reason
            )
        }
    } catch (error) {
        console.error(
            'Error loading machine setup reference data:',
            error
        )
    }
}

function openGenerateDialog() {
      generateForm.startNumber = 1
      generateForm.endNumber = 10
      generateForm.machineTypeId = null

      generateVisible.value = true
}

async function submitGenerate() {
      if (!userStore.locationId) {
        return ElMessage.error(
          'Please select a location first.'
        )
      }

      saving.value = true

      try {
        const result = await generateMachines({
          locationId: Number(userStore.locationId),
          startNumber: generateForm.startNumber,
          endNumber: generateForm.endNumber,
          machineTypeId: generateForm.machineTypeId
        })

        ElMessage.success(
          result.message || 'Machines generated.'
        )

        generateVisible.value = false

        await loadMachines()
      } finally {
        saving.value = false
      }
}

function openEditMachine(row: any) {
      Object.assign(machineForm, {
        ID: row.ID,
        MachineNumber: row.MachineNumber,
        MachineTypeId: row.MachineTypeId,
        GameId: row.GameId,
        StatusId: row.StatusId,
        StatusReason: row.StatusReason || ''
      })

      machineVisible.value = true
}

function machineTypeChanged() {
      const game = games.value.find(
        x =>
          Number(x.ID) === Number(machineForm.GameId)
      )

      if (
        game &&
        Number(game.MachineTypeId) !==
          Number(machineForm.MachineTypeId)
      ) {
        machineForm.GameId = null
      }
}

function statusChanged() {
      if (!selectedStatusIsNotWorking.value) {
        machineForm.StatusReason = ''
      }
}

async function saveMachine() {
      if (
        selectedStatusIsNotWorking.value &&
        !String(machineForm.StatusReason || '').trim()
      ) {
        return ElMessage.error(
          'Please enter the reason why the machine is not working.'
        )
      }

      saving.value = true

      try {
        await updateMachine(
          machineForm.ID,
          {
            machineTypeId: machineForm.MachineTypeId,
            gameId: machineForm.GameId,
            statusId: machineForm.StatusId,
            statusReason: machineForm.StatusReason
          }
        )

        ElMessage.success(
          'Machine updated successfully.'
        )

        machineVisible.value = false

        await loadMachines()
      } finally {
        saving.value = false
      }
}

async function openHistory(row: any) {
      historyVisible.value = true
      historyLoading.value = true

      try {
        const result = await getMachineLogs(row.ID)
        history.value = result.data || []
      } finally {
        historyLoading.value = false
      }
}

function openTypeDialog(row?: any) {
      Object.assign(typeForm, {
        ID: row?.ID || null,
        TypeName: row?.TypeName || '',
        IsActive: row?.IsActive ?? true
      })

      typeVisible.value = true
}

async function saveType() {
      if (!typeForm.TypeName.trim()) {
        return ElMessage.error(
          'Machine type name is required.'
        )
      }

      saving.value = true

      try {
        if (typeForm.ID) {
          await updateMachineType(
            typeForm.ID,
            {
              typeName: typeForm.TypeName,
              isActive: typeForm.IsActive
            }
          )
        } else {
          await createMachineType({
            typeName: typeForm.TypeName
          })
        }

        ElMessage.success('Machine type saved.')

        typeVisible.value = false

        await loadReferenceData()
      } finally {
        saving.value = false
      }
}

async function removeType(row: any) {
      await ElMessageBox.confirm(
        `Delete machine type "${row.TypeName}"?`,
        'Confirm',
        { type: 'warning' }
      )

      await deleteMachineType(row.ID)

      ElMessage.success('Machine type deleted.')

      await loadReferenceData()
}

function openGameDialog(row?: any) {
      Object.assign(gameForm, {
        ID: row?.ID || null,
        GameName: row?.GameName || '',
        MachineTypeId: row?.MachineTypeId || null,
        IsActive: row?.IsActive ?? true
      })

      gameVisible.value = true
}

async function saveGame() {
      if (
        !gameForm.GameName.trim() ||
        !gameForm.MachineTypeId
      ) {
        return ElMessage.error(
          'Game name and machine type are required.'
        )
      }

      saving.value = true

      try {
        const payload = {
          gameName: gameForm.GameName,
          machineTypeId: gameForm.MachineTypeId,
          isActive: gameForm.IsActive
        }

        if (gameForm.ID) {
          await updateGame(
            gameForm.ID,
            payload
          )
        } else {
          await createGame(payload)
        }

        ElMessage.success('Game saved.')

        gameVisible.value = false

        await loadReferenceData()
      } finally {
        saving.value = false
      }
}

async function removeGame(row: any) {
      await ElMessageBox.confirm(
        `Delete game "${row.GameName}"?`,
        'Confirm',
        { type: 'warning' }
      )

      await deleteGame(row.ID)

      ElMessage.success('Game deleted.')

      await loadReferenceData()
}

watch(
      () => userStore.locationId,
      async newLocation => {
        if (newLocation) {
          await loadMachines()
        }
      }
)

onMounted(async () => {
      await loadReferenceData()
      await loadMachines()
})
</script>

