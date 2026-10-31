<template>
  <div class="app-container machine-setup-page">
    <div class="page-header">
      <div>
        <h2 class="page-title">Machine Setup</h2>
        <p>
          Manage machines, machine types, games and machine history.
        </p>
      </div>
      <div class="machine-setup-header-actions">
        <el-dropdown trigger="click" @command="downloadNfcTags">
          <el-button :disabled="loadingMachines || !nfcTagMachines.length" aria-label="Download NFC Tags">
            <el-icon><Download /></el-icon>
            <span class="machine-header-action-label">Download NFC Tags</span>
            <el-icon class="el-icon--right machine-header-dropdown-arrow"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="csv">Download CSV</el-dropdown-item>
              <el-dropdown-item command="json">Download JSON</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button v-if="canManageMachines" type="primary" @click="openGenerateDialog" aria-label="Generate Machines">
          <el-icon><Plus /></el-icon>
          <span class="machine-header-action-label">Generate Machines</span>
        </el-button>
      </div>
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
        <el-card shadow="never" class="table-card machine-setup-table-card">
          <el-table v-loading="loadingMachines" :data="filteredMachines">
            <el-table-column prop="MachineNumber" label="Machine" width="80">
              <template #default="{ row }">
                <span class="machine-setup-number-badge">
                  {{ row.MachineNumber }}
                </span>

              </template>
            </el-table-column>
            <el-table-column prop="MachineTypeName" label="Machine Type" min-width="110">
              <template #default="{ row }">
                {{ row.MachineTypeName || 'Not Assigned' }}
              </template>
            </el-table-column>

            <el-table-column prop="GameName"
                             label="Game"
                             min-width="220">
              <template #default="{ row }">
                {{ row.GameName || 'Not Assigned' }}
              </template>
            </el-table-column>

            <el-table-column prop="Status"
                             label="Status"
                             width="100">
              <template #default="{ row }">
                <el-tag :type="statusTag(row.Status)">
                  {{ row.Status || 'Unknown' }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column prop="StatusReason"
                             label="Reason"
                             min-width="200">
              <template #default="{ row }">
                {{ row.StatusReason || '-' }}
              </template>
            </el-table-column>

            <el-table-column label="Actions" width="70" fixed="right" align="center">
              <template #default="{ row }">
                <div class="machine-action-buttons">
                  <el-tooltip v-if="canManageMachines" content="Edit machine" placement="top">
                    <el-button link class="action-icon-btn" type="primary" @click="openEditMachine(row)">
                      <el-icon><Edit /></el-icon>
                    </el-button>
                  </el-tooltip>
                  <el-tooltip content="Machine activity history" placement="top">
                    <el-button link class="action-icon-btn" @click="openHistory(row)">
                      <el-icon><Clock /></el-icon>
                    </el-button>
                  </el-tooltip>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
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

        <el-card shadow="never" class="table-card machine-setup-table-card">
          <el-table :data="machineTypes">
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
                             width="110" align="center">
              <template #default="{ row }">
                <div class="machine-action-buttons align-right">
                  <el-tooltip content="Edit machine type" placement="top">
                    <el-button link class="action-icon-btn" type="primary" @click="openTypeDialog(row)">
                      <LcPencil :size="18" />
                    </el-button>
                  </el-tooltip>
                  <el-tooltip content="Delete machine type" placement="top">
                    <el-button link class="action-icon-btn" type="danger" @click="removeType(row)">
                      <LcTrash :size="18" />
                    </el-button>
                  </el-tooltip>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
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

        <el-card shadow="never" class="table-card machine-setup-table-card">
          <el-table :data="games">
            <el-table-column prop="GameName"
                             label="Game" min-width="120"/>

            <el-table-column prop="MachineTypeName"
                             label="Machine Type" min-width="110"/>

            <el-table-column label="Status"
                             min-width="80">
              <template #default="{ row }">
                <el-tag :type="row.IsActive ? 'success' : 'info'">
                  {{ row.IsActive ? 'Active' : 'Inactive' }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column v-if="canManageGames"
                             label="Actions"
                             width="110" align="center">
              <template #default="{ row }">
                <div class="machine-action-buttons align-right">
                  <el-tooltip content="Edit game" placement="top">
                    <el-button link class="action-icon-btn" type="primary" @click="openGameDialog(row)">
                      <LcPencil :size="18" />
                    </el-button>
                  </el-tooltip>
                  <el-tooltip content="Delete game" placement="top">
                    <el-button link class="action-icon-btn" type="danger" @click="removeGame(row)">
                      <LcTrash :size="18" />
                    </el-button>
                  </el-tooltip>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- ================================================== -->
      <!-- INITIAL MACHINE READING -->
      <!-- ================================================== -->
      <el-tab-pane label="Machine Reading" name="initial-readings">
        <div class="toolbar">
          <el-input v-model="initialReadingSearch"
                    placeholder="Search machine..."
                    clearable
                    class="search" />

          <el-button :loading="loadingInitialReadings"
                     @click="loadInitialReadings">
            Refresh
          </el-button>
        </div>

        <el-alert type="info"
                  :closable="false"
                  show-icon
                  style="margin-bottom: 16px">
          Fields show the latest reading. Use Replace when changing a board or machine: previous records and reports are preserved under the archived Machine ID.
        </el-alert>

        <el-card shadow="never" class="table-card machine-setup-table-card">
          <el-table v-loading="loadingInitialReadings"
                    :data="filteredInitialReadingRows"
                    >
            <el-table-column prop="MachineNumber"
                             label="Machine"
                             width="105">
              <template #default="{ row }">
                <span class="machine-setup-number-badge">
                  {{ row.MachineNumber }}
                </span>

              </template>
            </el-table-column>

            <el-table-column label="Previous IN" min-width="145">
              <template #default="{ row }">
                <el-input-number v-model="row.PreviousIn"
                                 :min="0"
                                 :controls="false"
                                 :disabled="isInactiveMachine(row) || row.IsSessionReading"
                                 style="width: 100%" />
              </template>
            </el-table-column>

            <el-table-column label="Previous OUT" min-width="145">
              <template #default="{ row }">
                <el-input-number v-model="row.PreviousOut"
                                 :min="0"
                                 :controls="false"
                                 :disabled="isInactiveMachine(row) || row.IsSessionReading"
                                 style="width: 100%" />
              </template>
            </el-table-column>

            <el-table-column label="Current IN" min-width="145">
              <template #default="{ row }">
                <el-input-number v-model="row.CurrentIn"
                                 :min="0"
                                 :controls="false"
                                 :disabled="isInactiveMachine(row) || row.IsSessionReading"
                                 style="width: 100%" />
              </template>
            </el-table-column>

            <el-table-column label="Current OUT" min-width="145">
              <template #default="{ row }">
                <el-input-number v-model="row.CurrentOut"
                                 :min="0"
                                 :controls="false"
                                 :disabled="isInactiveMachine(row) || row.IsSessionReading"
                                 style="width: 100%" />
              </template>
            </el-table-column>

            <el-table-column label="Status" width="115">
              <template #default="{ row }">
                <el-tag :type="statusTag(row.Status)">
                  {{ row.Status || 'Unknown' }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column label="Actions" width="194" align="center">
              <template #default="{ row }">
                <div class="machine-action-buttons align-right">
                  <el-button v-if="row.ReplacedMachineId" link type="info" @click="openArchivedReadingHistory(row)" title="Archived reading history">
                    <LcFolderBookmark :size="18" />
                  </el-button>
                  <el-button link @click="openReadingHistory(row)" title="View reading history">
                    <LcHistory :size="18" />
                  </el-button>
                  <el-button link type="primary" title="Save initial reading"
                             :loading="savingInitialMachineId === row.ID"
                             :disabled="isInactiveMachine(row) || row.IsSessionReading"
                             @click="saveInitialReading(row)">
                    <LcSaveCheck :size="18" />
                  </el-button>
                  <el-button link type="warning" title="Reset"
                             :disabled="isInactiveMachine(row)"
                             @click="replaceMachine(row)">
                    <LcRefreshCcw :size="18" />
                  </el-button>
                  <!--<el-button link type="danger" title="Deactivate machine"
                             :disabled="isInactiveMachine(row)"
                             @click="deactivateInitialMachine(row)">
                    <LcTrash :size="18"/>
                  </el-button>-->
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
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

    <el-dialog v-model="readingHistoryVisible"
               :title="`Reading History · Machine #${readingHistoryMachine}`"
               width="min(1100px, 96%)"
               destroy-on-close>
      <el-table v-loading="readingHistoryLoading" :data="readingHistoryRows"  max-height="62vh" empty-text="No readings recorded">
        <el-table-column label="Date / Time" min-width="175">
          <template #default="{ row }">
            {{ formatDateTime(row.readingAt) }}
          </template>
        </el-table-column>
        <el-table-column label="Session" min-width="125">
          <template #default="{ row }">
            {{ row.sessionId == null ? 'Initial' : `#${row.sessionNumber ?? row.sessionId}` }}
          </template>
        </el-table-column>
        <el-table-column prop="previousIn" label="Previous IN" min-width="120" />
        <el-table-column prop="previousOut" label="Previous OUT" min-width="120" />
        <el-table-column prop="currentIn" label="Current IN" min-width="120" />
        <el-table-column prop="currentOut" label="Current OUT" min-width="120" />
      </el-table>
    </el-dialog>

    <!-- ==================================================== -->
    <!-- HISTORY -->
    <!-- ==================================================== -->

    <el-drawer v-model="historyVisible"
               title="Machine History"
               size="70%">
      <el-card shadow="never" class="table-card machine-setup-table-card">
        <el-table v-loading="historyLoading"
                  :data="history"
                  style="font-size:12px;">
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
            <template #default="{ row }">
              0
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
      </el-card>
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
  } from 'vue';

  import { ElMessage, ElMessageBox } from 'element-plus';
  import { ArrowDown, Download, Plus } from '@element-plus/icons-vue';
  import {
    FolderBookmark as LcFolderBookmark, History as LcHistory, SaveCheck as LcSaveCheck, RefreshCcw as LcRefreshCcw,
    Trash as LcTrash, Pencil as LcPencil
  } from '@lucide/vue'
  import { useUserStore } from '@/store/modules/user';
  import { formatDateTime } from '@/utils/date';
  import request from '@/utils/request';

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
  } from '@/api/machine';

  import {
    getInitialMachineReadings,
    saveInitialMachineReading,
    deactivateMachine
  } from '@/api/machineinitialreading';

  const userStore = useUserStore();

  const activeTab = ref('machines');
  const machineSearch = ref('');
  const initialReadingSearch = ref('');

  const machines = ref<any[]>([]);

  // One physical NFC tag per active machine, in machine-number order.
  const nfcTagMachines = computed(() => machines.value
    .filter(row => !row.IsArchived && !isInactiveMachine(row))
    .filter(row => String(row.MachineNumber ?? '').trim() !== '')
    .sort((a, b) => Number(a.MachineNumber) - Number(b.MachineNumber)));

  function downloadNfcTags(format: string) {
    const locationId = Number(userStore.locationId);
    if (!Number.isSafeInteger(locationId) || locationId <= 0 || !nfcTagMachines.value.length) {
      ElMessage.warning('Select a location with active machines first.');
      return;
    }

    const urls = nfcTagMachines.value.map(row =>
      `https://secure.iklogy.com/nfc/${locationId}/${encodeURIComponent(String(row.MachineNumber))}`
    );

    // CSV keeps its existing format. JSON is a plain array of URLs,
    // matching the user's NFC import file without an "items" wrapper.
    const isCsv = format === 'csv';
    const contents = isCsv
      ? 'content\r\n' + urls.join('\r\n') + '\r\n'
      : JSON.stringify(urls, null, 2);
    const blob = new Blob([contents], { type: isCsv ? 'text/csv;charset=utf-8' : 'application/json;charset=utf-8' });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = `nfc-tags-location-${locationId}.${isCsv ? 'csv' : 'json'}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    ElMessage.success(`Downloaded ${urls.length} NFC tag URLs.`);
  }
  const machineTypes = ref<any[]>([]);
  const statuses = ref<any[]>([]);
  const games = ref<any[]>([]);
  const history = ref<any[]>([]);
  const initialReadingRows = ref<any[]>([]);

  const loadingMachines = ref(false);
  const historyLoading = ref(false);
  const saving = ref(false);
  const loadingInitialReadings = ref(false);
  const savingInitialMachineId = ref<number | null>(null);

  const generateVisible = ref(false);
  const machineVisible = ref(false);
  const typeVisible = ref(false);
  const gameVisible = ref(false);
  const historyVisible = ref(false);
  const readingHistoryVisible = ref(false);
  const readingHistoryLoading = ref(false);
  const readingHistoryRows = ref<any[]>([]);
  const readingHistoryMachine = ref<string | number>('');

  function openArchivedReadingHistory(row: any) {
    if (!row.ReplacedMachineId) return;
    openReadingHistory({ ID: row.ReplacedMachineId, MachineNumber: row.MachineNumber });
  }

  async function openReadingHistory(row: any) {
    readingHistoryVisible.value = true;
    readingHistoryMachine.value = row.MachineNumber;
    readingHistoryRows.value = [];
    readingHistoryLoading.value = true;
    try {
      const result: any = await request({
        url: `/machine/reading-history/${row.ID}`,
        method: 'get',
        params: { locationid: userStore.locationId }
      });
      readingHistoryRows.value = result.data || [];
    } catch (error) {
      ElMessage.error('Unable to load machine reading history.');
    } finally {
      readingHistoryLoading.value = false;
    }
  }


  const canManageMachines = computed(() =>
    userStore.isOwner ||
    userStore.isAdmin ||
    userStore.hasPermission('machines.update')
  );

  const canManageTypes = computed(() =>
    userStore.isOwner ||
    userStore.isAdmin ||
    userStore.hasPermission('machinetypes.update')
  );

  const canManageGames = computed(() =>
    userStore.isOwner ||
    userStore.isAdmin ||
    userStore.hasPermission('games.update')
  );

  const generateForm = reactive({
    startNumber: 1,
    endNumber: 10,
    machineTypeId: null as number | null
  });

  const machineForm = reactive<any>({
    ID: null,
    MachineNumber: null,
    MachineTypeId: null,
    GameId: null,
    StatusId: null,
    StatusReason: ''
  });

  const typeForm = reactive<any>({
    ID: null,
    TypeName: '',
    IsActive: true
  });

  const gameForm = reactive<any>({
    ID: null,
    GameName: '',
    MachineTypeId: null,
    IsActive: true
  });

  const activeMachineTypes = computed(() =>
    machineTypes.value.filter(x => x.IsActive)
  );

  const compatibleGames = computed(() =>
    games.value.filter(
      x =>
        x.IsActive &&
        Number(x.MachineTypeId) ===
        Number(machineForm.MachineTypeId)
    )
  );

  const selectedStatusIsNotWorking = computed(() => {
    const item = statuses.value.find(
      x => Number(x.ID) === Number(machineForm.StatusId)
    );

    return (
      String(item?.Description || '')
        .trim()
        .toLowerCase() === 'not working'
    );
  });

  const filteredMachines = computed(() => {
    const text = machineSearch.value
      .trim()
      .toLowerCase();

    const visible = machines.value.filter(item => !item.IsArchived);
    if (!text) return visible;

    return visible.filter(item =>
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
    );
  });


  const filteredInitialReadingRows = computed(() => {
    const text = initialReadingSearch.value.trim().toLowerCase();

    const visible = initialReadingRows.value.filter(row => !row.IsArchived);
    if (!text) return visible;

    return visible.filter(row =>
      [
        row.MachineNumber,
        row.Status
      ]
        .join(' ')
        .toLowerCase()
        .includes(text)
    );
  });

  function isInactiveMachine(row: any) {
    return String(row?.Status || '')
      .trim()
      .toLowerCase() === 'inactive';
  }

  function normalizeInitialReadingRow(row: any) {
    return {
      ...row,
      PreviousIn: row.PreviousIn == null ? 0 : Number(row.PreviousIn),
      PreviousOut: row.PreviousOut == null ? 0 : Number(row.PreviousOut),
      CurrentIn: row.CurrentIn == null ? 0 : Number(row.CurrentIn),
      CurrentOut: row.CurrentOut == null ? 0 : Number(row.CurrentOut)
    };
  }

  async function loadInitialReadings() {
    if (!userStore.locationId) {
      initialReadingRows.value = [];
      return;
    }

    loadingInitialReadings.value = true;

    try {
      const result = await getInitialMachineReadings(
        userStore.locationId
      );

      initialReadingRows.value =
        (result.data || []).map(normalizeInitialReadingRow);
    } finally {
      loadingInitialReadings.value = false;
    }
  }

  async function saveInitialReading(row: any) {
    if (!userStore.locationId || !row?.ID) return;

    const values = [
      row.PreviousIn,
      row.PreviousOut,
      row.CurrentIn,
      row.CurrentOut
    ];

    if (
      values.some(
        value =>
          value === null ||
          value === undefined ||
          !Number.isFinite(Number(value)) ||
          Number(value) < 0
      )
    ) {
      return ElMessage.error(
        'All four readings must be valid non-negative numbers.'
      );
    }

    savingInitialMachineId.value = Number(row.ID);

    try {
      await saveInitialMachineReading(
        row.ID,
        {
          locationid: Number(userStore.locationId),
          previousIn: Number(row.PreviousIn),
          previousOut: Number(row.PreviousOut),
          currentIn: Number(row.CurrentIn),
          currentOut: Number(row.CurrentOut)
        }
      );

      ElMessage.success(
        `Initial reading saved for Machine #${row.MachineNumber}.`
      );

      await loadInitialReadings();
    } finally {
      savingInitialMachineId.value = null;
    }
  }

  async function replaceMachine(row: any) {
    if (!row?.ID || !userStore.locationId) return;
    const typeResult: any = await ElMessageBox.prompt(
      `Choose BOARD or MACHINE for Machine #${row.MachineNumber}. The old machine and every reading will be archived, and a new machine ID will be created.`,
      'Replace Machine / Board',
      {
        confirmButtonText: 'Continue', inputPlaceholder: 'BOARD or MACHINE',
        inputValidator: (value: string) => ['BOARD', 'MACHINE'].includes(String(value).trim().toUpperCase()) || 'Enter BOARD or MACHINE'
      }
    );
    const reasonResult: any = await ElMessageBox.prompt(
      'Enter the reason for replacement. Existing readings and completed reports will remain unchanged.',
      'Confirm Replacement',
      {
        confirmButtonText: 'Replace', inputPlaceholder: 'Reason for replacement',
        inputValidator: (value: string) => (String(value).trim().length > 0 && String(value).trim().length <= 1000) || 'A reason (max 1000 characters) is required'
      }
    );
    await request({
      url: `/machine/replace/${row.ID}`,
      method: 'post',
      data: {
        locationid: Number(userStore.locationId),
        replacementType: String(typeResult.value).trim().toUpperCase(),
        reason: String(reasonResult.value).trim()
      }
    });
    ElMessage.success(`Machine #${row.MachineNumber} replaced. Enter its new initial readings.`);
    await Promise.all([loadMachines(), loadInitialReadings()]);
  }

  async function deactivateInitialMachine(row: any) {
    if (!row?.ID || !userStore.locationId) return;

    await ElMessageBox.confirm(
      `Delete Machine #${row.MachineNumber}? The machine will remain in the database and its StatusId will be changed to Inactive.`,
      'Deactivate Machine',
      {
        type: 'warning',
        confirmButtonText: 'Delete'
      }
    );

    await deactivateMachine(
      row.ID,
      Number(userStore.locationId)
    );

    ElMessage.success(
      `Machine #${row.MachineNumber} is now inactive.`
    );

    await Promise.all([
      loadMachines(),
      loadInitialReadings()
    ]);
  }

  function statusTag(status: string) {
    switch (String(status || '').toLowerCase()) {
      case 'working':
      case 'active':
        return 'success';

      case 'not working':
        return 'danger';

      case 'inactive':
        return 'info';

      default:
        return 'warning';
    }
  }

  async function loadMachines() {
    if (!userStore.locationId) return;

    loadingMachines.value = true;

    try {
      const result = await getMachines(
        userStore.locationId
      );

      machines.value = result.data || [];
    } finally {
      loadingMachines.value = false;
    }
  }

  async function loadReferenceData() {
    try {
      const results = await Promise.allSettled([
        getMachineTypes(),
        getMachineStatuses(),
        getGames()
      ]);

      const [typesResult, statusResult, gamesResult] = results;

      // Machine Types
      if (typesResult.status === 'fulfilled') {
        machineTypes.value = typesResult.value?.data || [];
      } else {
        machineTypes.value = [];
        console.error(
          'Failed loading machine types:',
          typesResult.reason
        );
      }

      // Machine Statuses
      if (statusResult.status === 'fulfilled') {
        statuses.value = statusResult.value?.data || [];
      } else {
        statuses.value = [];
        console.error(
          'Failed loading machine statuses:',
          statusResult.reason
        );
      }

      // Games
      if (gamesResult.status === 'fulfilled') {
        games.value = gamesResult.value?.data || [];
      } else {
        games.value = [];
        console.error(
          'Failed loading games:',
          gamesResult.reason
        );
      }
    } catch (error) {
      console.error(
        'Error loading machine setup reference data:',
        error
      );
    }
  }

  function openGenerateDialog() {
    generateForm.startNumber = 1;
    generateForm.endNumber = 10;
    generateForm.machineTypeId = null;

    generateVisible.value = true;
  }

  async function submitGenerate() {
    if (!userStore.locationId) {
      return ElMessage.error(
        'Please select a location first.'
      );
    }

    saving.value = true;

    try {
      const result = await generateMachines({
        locationid: Number(userStore.locationId),
        startNumber: generateForm.startNumber,
        endNumber: generateForm.endNumber,
        machineTypeId: generateForm.machineTypeId
      });

      ElMessage.success(
        result.message || 'Machines generated.'
      );

      generateVisible.value = false;

      await loadMachines();
    } finally {
      saving.value = false;
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
    });

    machineVisible.value = true;
  }

  function machineTypeChanged() {
    const game = games.value.find(
      x =>
        Number(x.ID) === Number(machineForm.GameId)
    );

    if (
      game &&
      Number(game.MachineTypeId) !==
      Number(machineForm.MachineTypeId)
    ) {
      machineForm.GameId = null;
    }
  }

  function statusChanged() {
    if (!selectedStatusIsNotWorking.value) {
      machineForm.StatusReason = '';
    }
  }

  async function saveMachine() {
    if (
      selectedStatusIsNotWorking.value &&
      !String(machineForm.StatusReason || '').trim()
    ) {
      return ElMessage.error(
        'Please enter the reason why the machine is not working.'
      );
    }

    saving.value = true;

    try {
      await updateMachine(
        machineForm.ID,
        {
          machineTypeId: machineForm.MachineTypeId,
          gameId: machineForm.GameId,
          statusId: machineForm.StatusId,
          statusReason: machineForm.StatusReason
        }
      );

      ElMessage.success(
        'Machine updated successfully.'
      );

      machineVisible.value = false;

      await loadMachines();
    } finally {
      saving.value = false;
    }
  }

  async function openHistory(row: any) {
    historyVisible.value = true;
    historyLoading.value = true;

    try {
      const result = await getMachineLogs(row.ID);
      history.value = result.data || [];
    } finally {
      historyLoading.value = false;
    }
  }

  function openTypeDialog(row?: any) {
    Object.assign(typeForm, {
      ID: row?.ID || null,
      TypeName: row?.TypeName || '',
      IsActive: row?.IsActive ?? true
    });

    typeVisible.value = true;
  }

  async function saveType() {
    if (!typeForm.TypeName.trim()) {
      return ElMessage.error(
        'Machine type name is required.'
      );
    }

    saving.value = true;

    try {
      if (typeForm.ID) {
        await updateMachineType(
          typeForm.ID,
          {
            typeName: typeForm.TypeName,
            isActive: typeForm.IsActive
          }
        );
      } else {
        await createMachineType({
          typeName: typeForm.TypeName
        });
      }

      ElMessage.success('Machine type saved.');

      typeVisible.value = false;

      await loadReferenceData();
    } finally {
      saving.value = false;
    }
  }

  async function removeType(row: any) {
    await ElMessageBox.confirm(
      `Delete machine type "${row.TypeName}"?`,
      'Confirm',
      { type: 'warning' }
    );

    await deleteMachineType(row.ID);

    ElMessage.success('Machine type deleted.');

    await loadReferenceData();
  }

  function openGameDialog(row?: any) {
    Object.assign(gameForm, {
      ID: row?.ID || null,
      GameName: row?.GameName || '',
      MachineTypeId: row?.MachineTypeId || null,
      IsActive: row?.IsActive ?? true
    });

    gameVisible.value = true;
  }

  async function saveGame() {
    if (
      !gameForm.GameName.trim() ||
      !gameForm.MachineTypeId
    ) {
      return ElMessage.error(
        'Game name and machine type are required.'
      );
    }

    saving.value = true;

    try {
      const payload = {
        gameName: gameForm.GameName,
        machineTypeId: gameForm.MachineTypeId,
        isActive: gameForm.IsActive
      };

      if (gameForm.ID) {
        await updateGame(
          gameForm.ID,
          payload
        );
      } else {
        await createGame(payload);
      }

      ElMessage.success('Game saved.');

      gameVisible.value = false;

      await loadReferenceData();
    } finally {
      saving.value = false;
    }
  }

  async function removeGame(row: any) {
    await ElMessageBox.confirm(
      `Delete game "${row.GameName}"?`,
      'Confirm',
      { type: 'warning' }
    );

    await deleteGame(row.ID);

    ElMessage.success('Game deleted.');

    await loadReferenceData();
  }

  watch(
    () => userStore.locationId,
    async newLocation => {
      if (newLocation) {
        await loadMachines();

        if (activeTab.value === 'initial-readings') {
          await loadInitialReadings();
        }
      } else {
        machines.value = [];
        initialReadingRows.value = [];
      }
    }
  );

  watch(activeTab, async tab => {
    if (tab === 'initial-readings') {
      await loadInitialReadings();
    }
  });

  onMounted(async () => {
    await loadReferenceData();
    await loadMachines();
  });
</script>


<style scoped>
  .machine-setup-header-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 10px;
  }

  .machine-setup-header-actions :deep(.el-button) {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  @media (max-width: 767px) {
    .machine-setup-header-actions {
      justify-content: flex-end;
      flex-wrap: nowrap;
      gap: 8px;
    }

    .machine-header-action-label,
    .machine-header-dropdown-arrow {
      display: none;
    }

    .machine-setup-header-actions :deep(.el-button) {
      width: 36px;
      min-width: 36px;
      height: 36px;
      padding: 0;
      justify-content: center;
    }
  }

  .machine-action-buttons {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    white-space: nowrap;
  }

    .machine-action-buttons.align-right {
      justify-content: flex-end;
    }

    .machine-action-buttons .el-button + .el-button {
      margin-left: 0;
    }

    .machine-action-buttons .action-icon-btn {
      padding: 5px;
      min-width: 26px;
      height: 28px;
      border-radius: 4px;
      font-size: 17px;
    }
</style>
