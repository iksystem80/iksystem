<template>
  <div class="app-container bonus-editor irfan-ui-page">
    <!-- ==================================================== -->
    <!-- PAGE HEADER -->
    <!-- ==================================================== -->
    <div class="page-header">
      <div class="header-left">
        <el-button circle size="large" :icon="ArrowLeft" class="back-button" @click="router.back()" />
        <div>
          <h2>
            {{ isEdit ? 'Edit Bonus' : 'Create Bonus' }}
          </h2>
          <span>
            Configure payouts and bonus availability.
          </span>
        </div>
      </div>
    </div>
    <!-- ==================================================== -->
    <!-- LOADING -->
    <!-- ==================================================== -->
    <el-skeleton v-if="loading" :rows="10" animated />
    <!-- ==================================================== -->
    <!-- FORM -->
    <!-- ==================================================== -->
    <el-form v-else ref="formRef" :model="form" :rules="rules" label-position="top">
      <!-- ================================================== -->
      <!-- BONUS INFORMATION -->
      <!-- ================================================== -->
      <el-card shadow="never" class="section-card bonus-info-card">
        <div class="bonus-info-grid">
          <!-- BONUS NAME -->
          <div class="bonus-name-field">
            <el-form-item label="Bonus Name" prop="name">
              <el-input v-model="form.name" size="large" maxlength="200" show-word-limit placeholder="Enter bonus name" />
            </el-form-item>
          </div>
          <!-- STATUS -->
          <div class="bonus-status-field">
            <div class="status-label">
              Status
            </div>
            <div class="status-control">
              <div>
                <div class="status-value">
                  {{ form.isActive ? 'Active' : 'Inactive' }}
                </div>
                <div class="small-text">
                  Enable or disable this bonus.
                </div>
              </div>
              <el-switch v-model="form.isActive" size="large" />
            </div>
          </div>
        </div>
      </el-card>
      <!-- ================================================== -->
      <!-- PAYOUTS + SCHEDULE -->
      <!-- ================================================== -->
      <el-row :gutter="20">
        <!-- ================================================= -->
        <!-- PAYOUTS -->
        <!-- ================================================= -->
        <el-col :xs="24" :lg="11">
          <el-card shadow="never" class="section-card">
            <template #header>
              <div class="section-header">
                <div class="section-title-wrap">
                  <div class="section-title-icon payout-title-icon">
                    <el-icon>
                      <Money />
                    </el-icon>
                  </div>
                  <div>
                    <strong>
                      Payouts
                    </strong>
                    <div class="small-text">
                      Define each winning condition and customer payout.
                    </div>
                  </div>
                </div>
                <el-button type="primary" plain size="small" :icon="Plus" @click="addPayout">
                  Add Payout
                </el-button>
              </div>

            </template>

            <el-empty v-if="form.payouts.length === 0"
                      description="No payouts added." />

            <!-- MOBILE TABLE LABELS -->

            <div v-if="form.payouts.length > 0"
                 class="mobile-payout-header">

              <span>
                DESCRIPTION
              </span>

              <span>
                PAY TO CUSTOMER
              </span>

            </div>

            <!-- PAYOUT ROW -->

            <div v-for="(payout, index) in form.payouts"
                 :key="index"
                 class="payout-row">

              <el-input v-model="payout.description"
                        maxlength="300"
                        placeholder="Description"
                        class="payout-description" />

              <el-input-number v-model="payout.amount"
                               :min="0"
                               :precision="2"
                               :controls="false"
                               class="amount-input" />

              <el-button text
                         circle
                         type="danger"
                         :icon="Delete"
                         class="payout-delete"
                         @click="removePayout(index)" />

            </div>

            <el-button type="primary"
                       plain
                       :icon="Plus"
                       class="full-button"
                       @click="addPayout">
              Add Payout
            </el-button>

          </el-card>

        </el-col>

        <!-- ================================================= -->
        <!-- SCHEDULE -->
        <!-- ================================================= -->

        <el-col :xs="24"
                :lg="13">

          <el-card shadow="never"
                   class="section-card">

            <template #header>

              <div class="section-header">

                <div class="section-title-wrap">

                  <div class="section-title-icon schedule-title-icon">
                    <el-icon>
                      <Calendar />
                    </el-icon>
                  </div>

                  <div>

                    <strong>
                      Schedule
                    </strong>

                    <div class="small-text">
                      Configure when this bonus is available.
                    </div>

                  </div>

                </div>

                <el-button type="primary"
                           plain
                           size="small"
                           :icon="Plus"
                           @click="addBlock">
                  Add Block
                </el-button>

              </div>

            </template>

            <el-empty v-if="form.scheduleBlocks.length === 0"
                      description="No schedule blocks added." />

            <!-- ================================================= -->
            <!-- EACH SCHEDULE BLOCK -->
            <!-- ================================================= -->

            <el-card v-for="(block, blockIndex) in form.scheduleBlocks"
                     :key="blockIndex"
                     shadow="never"
                     class="schedule-block">

              <!-- BLOCK HEADER -->

              <div class="block-header">

                <div>

                  <strong>
                    Block {{ blockIndex + 1 }}
                  </strong>

                  <div class="small-text">
                    {{ getBlockSummary(block) }}
                  </div>

                </div>

                <el-button text
                           circle
                           type="danger"
                           :icon="Delete"
                           @click="removeBlock(blockIndex)" />

              </div>

              <el-divider />

              <!-- DAYS -->

              <div class="field-label">
                Runs on
              </div>

              <el-checkbox-group v-model="block.days"
                                 class="day-group">

                <el-checkbox-button v-for="day in days"
                                    :key="day.value"
                                    :value="day.value">
                  {{ day.short }}
                </el-checkbox-button>

              </el-checkbox-group>

              <div class="selected-days">
                {{ selectedDayNames(block) }}
              </div>

              <!-- ALL DAY -->

              <div class="setting-row">

                <div>

                  <strong>
                    All day
                  </strong>

                  <div class="small-text">
                    Bonus remains active for the entire selected day.
                  </div>

                </div>

                <el-switch v-model="block.isAllDay"
                           @change="handleAllDayChange(block)" />

              </div>

              <!-- TIMED SCHEDULE -->

              <template v-if="!block.isAllDay">

                <el-divider />

                <el-row :gutter="10">

                  <el-col :xs="24"
                          :sm="12">

                    <el-form-item label="Start Time">

                      <el-time-picker v-model="block.startTime"
                                      value-format="HH:mm:ss"
                                      format="hh:mm A"
                                      placeholder="Start time"
                                      style="width: 100%" />

                    </el-form-item>

                  </el-col>

                  <el-col :xs="24"
                          :sm="12">

                    <el-form-item label="End Time">

                      <el-time-picker v-model="block.endTime"
                                      value-format="HH:mm:ss"
                                      format="hh:mm A"
                                      placeholder="End time"
                                      style="width: 100%" />

                    </el-form-item>

                  </el-col>

                </el-row>

                <!-- ENDS NEXT DAY -->

                <div class="setting-row next-day-row">

                  <div>

                    <strong>
                      Ends next day
                    </strong>

                    <div class="small-text">
                      Enable for schedules that continue past midnight.
                    </div>

                  </div>

                  <el-switch v-model="block.endDayOffset"
                             :active-value="1"
                             :inactive-value="0" />

                </div>

                <el-alert v-if="block.endDayOffset === 1"
                          title="This block continues into the following day."
                          type="warning"
                          :closable="false"
                          show-icon
                          class="next-day-alert" />

              </template>

              <!-- BLOCK SUMMARY -->

              <el-alert v-if="block.days.length > 0"
                        :title="getBlockSummary(block)"
                        type="info"
                        :closable="false"
                        show-icon
                        class="block-summary" />

            </el-card>

            <el-button type="primary"
                       plain
                       :icon="Plus"
                       class="full-button"
                       @click="addBlock">
              Add Time Block
            </el-button>

          </el-card>

        </el-col>

      </el-row>

      <!-- ================================================== -->
      <!-- FIXED ACTION BAR -->
      <!-- ================================================== -->

      <Transition name="action-bar-fade">
        <div v-if="showActionBar"
             class="fixed-actions"
             :style="actionBarStyle">

          <div class="fixed-actions-inner">

            <div class="action-left">

              <el-button v-if="isEdit"
                         type="danger"
                         plain
                         size="large"
                         :icon="Delete"
                         :loading="deleting"
                         @click="handleDelete">
                Delete Bonus
              </el-button>

            </div>

            <div class="right-actions">

              <el-button size="large"
                         @click="router.back()">
                Cancel
              </el-button>

              <el-button type="primary"
                         size="large"
                         :loading="saving"
                         :disabled="deleting"
                         @click="saveBonus">
                {{ isEdit ? 'Save Bonus' : 'Create Bonus' }}
              </el-button>

            </div>

          </div>

        </div>
      </Transition>

    </el-form>

  </div>
</template>

<script setup>
import {
  reactive,
  ref,
  computed,
  nextTick,
  onMounted,
  onBeforeUnmount
} from 'vue';

import {
  ArrowLeft,
  Plus,
  Delete,
  Money,
  Calendar
} from '@element-plus/icons-vue';

import {
  ElMessage,
  ElMessageBox
} from 'element-plus';

import {
  useRoute,
  useRouter,
  onBeforeRouteLeave
} from 'vue-router';

import {
  useUserStore
} from '@/store/modules/user';

import {
  getBonus,
  createBonus,
  updateBonus,
  deleteBonus
} from '@/api/bonus';

// ============================================================
// ROUTER / STORE
// ============================================================

const route = useRoute();

const router = useRouter();

const userStore = useUserStore();

// ============================================================
// STATE
// ============================================================

const formRef = ref(null);

const loading = ref(false);

const saving = ref(false);

const deleting = ref(false);

const showActionBar = ref(false);

const actionBarStyle = ref({
  left: '0px',
  width: '100%'
});

let actionBarTimer = null;

// ============================================================
// BONUS ID
// ============================================================

const bonusId = computed(() => {
  return Number(
    route.params.id
  );
});

const isEdit = computed(() => {
  return Boolean(
    bonusId.value
  );
});

// ============================================================
// DAYS
// ============================================================

const days = [
  {
    value: 1,
    short: 'M',
    name: 'Monday'
  },

  {
    value: 2,
    short: 'T',
    name: 'Tuesday'
  },

  {
    value: 3,
    short: 'W',
    name: 'Wednesday'
  },

  {
    value: 4,
    short: 'T',
    name: 'Thursday'
  },

  {
    value: 5,
    short: 'F',
    name: 'Friday'
  },

  {
    value: 6,
    short: 'S',
    name: 'Saturday'
  },

  {
    value: 7,
    short: 'S',
    name: 'Sunday'
  }
];

// ============================================================
// FORM
// ============================================================

const form = reactive({

  name: '',

  isActive: true,

  payouts: [],

  scheduleBlocks: []
});

const rules = {

  name: [
    {
      required: true,

      message:
                    'Bonus name is required.',

      trigger:
                    'blur'
    }
  ]
};

// ============================================================
// PAYOUTS
// ============================================================

const addPayout = () => {
  form.payouts.push({

    description: '',

    amount: 0
  });
};

const removePayout = index => {
  form.payouts.splice(
    index,
    1
  );
};

// ============================================================
// SCHEDULE BLOCKS
// ============================================================

const addBlock = () => {
  form.scheduleBlocks.push({

    isAllDay: true,

    startTime: null,

    endTime: null,

    endDayOffset: 0,

    days: [
      1,
      2,
      3,
      4,
      5,
      6,
      7
    ]
  });
};

const removeBlock = index => {
  form.scheduleBlocks.splice(
    index,
    1
  );
};

// ============================================================
// ALL DAY CHANGE
// ============================================================

const handleAllDayChange = block => {
  if (block.isAllDay) {
    block.startTime = null;

    block.endTime = null;

    block.endDayOffset = 0;
  }
};

// ============================================================
// SELECTED DAY NAMES
// ============================================================

const selectedDayNames = block => {
  if (!block.days?.length) {
    return 'No days selected';
  }

  if (block.days.length === 7) {
    return 'Every day';
  }

  return days
    .filter(
      day =>
        block.days.includes(
          day.value
        )
    )
    .map(
      day =>
        day.name
    )
    .join(', ');
};

// ============================================================
// FORMAT TIME
// ============================================================

const formatTime = value => {
  if (!value) {
    return '';
  }

  const parts =
            value.split(':');

  let hour =
            Number(parts[0]);

  const minute =
            parts[1];

  const period =
            hour >= 12
              ? 'PM'
              : 'AM';

  hour =
            hour % 12 ||
            12;

  return `${hour}:${minute} ${period}`;
};

// ============================================================
// BLOCK SUMMARY
// ============================================================

const getBlockSummary = block => {
  const dayText =
            selectedDayNames(block);

  if (block.isAllDay) {
    return `${dayText} · All day`;
  }

  if (
    !block.startTime ||
            !block.endTime
  ) {
    return `${dayText} · Select start and end time`;
  }

  let text =
            `${dayText} · ` +
            `${formatTime(block.startTime)} - ` +
            `${formatTime(block.endTime)}`;

  if (block.endDayOffset === 1) {
    text +=
                ' (next day)';
  }

  return text;
};

// ============================================================
// LOAD BONUS
// ============================================================

const loadBonus = async () => {
  if (!isEdit.value) {
    return;
  }

  try {
    loading.value = true;

    const response =
                await getBonus(
                  bonusId.value
                );

    const data =
                response.data;

    form.name =
                data.name ?? '';

    form.isActive =
                data.isActive ?? true;

    form.payouts =
                (
                  data.payouts ??
                    []
                )
                  .map(
                    item => ({

                      description:
                                item.description ?? '',

                      amount:
                                Number(
                                  item.amount ??
                                    0
                                )
                    })
                  );

    form.scheduleBlocks =
                (
                  data.scheduleBlocks ??
                    []
                )
                  .map(
                    item => ({

                      isAllDay:
                                Boolean(
                                  item.isAllDay
                                ),

                      startTime:
                                item.startTime ??
                                null,

                      endTime:
                                item.endTime ??
                                null,

                      endDayOffset:
                                Number(
                                  item.endDayOffset ??
                                    0
                                ),

                      days:
                                (
                                  item.days ??
                                    []
                                )
                                  .map(
                                    Number
                                  )
                    })
                  );
  } catch (error) {
    ElMessage.error(
      error.response?.data?.message ||
                'Unable to load bonus.'
    );
  } finally {
    loading.value = false;
  }
};

// ============================================================
// CUSTOM VALIDATION
// ============================================================

const validateBonus = () => {
  if (
    form.payouts.length === 0
  ) {
    ElMessage.warning(
      'Please add at least one payout.'
    );

    return false;
  }

  for (
    const payout of
    form.payouts
  ) {
    if (
      !payout.description
        ?.trim()
    ) {
      ElMessage.warning(
        'Each payout needs a description.'
      );

      return false;
    }

    if (
      payout.amount === null ||
                payout.amount === undefined ||
                Number(payout.amount) < 0
    ) {
      ElMessage.warning(
        'Enter a valid payout amount.'
      );

      return false;
    }
  }

  if (
    form.scheduleBlocks
      .length === 0
  ) {
    ElMessage.warning(
      'Please add at least one schedule block.'
    );

    return false;
  }

  for (
    let index = 0;
    index <
            form.scheduleBlocks.length;
    index++
  ) {
    const block =
                form.scheduleBlocks[index];

    if (
      !block.days ||
                block.days.length === 0
    ) {
      ElMessage.warning(
        `Block ${index + 1} needs at least one day.`
      );

      return false;
    }

    if (
      !block.isAllDay
    ) {
      if (
        !block.startTime ||
                    !block.endTime
      ) {
        ElMessage.warning(
          `Block ${index + 1} needs a start and end time.`
        );

        return false;
      }

      if (
        Number(
          block.endDayOffset
        ) === 0 &&
                    block.endTime <=
                    block.startTime
      ) {
        ElMessage.warning(
          `Block ${index + 1}: End time must be after start time, or enable "Ends next day".`
        );

        return false;
      }
    }
  }

  return true;
};

// ============================================================
// BUILD PAYLOAD
// ============================================================

const buildPayload = () => {
  return {

    name:
                form.name.trim(),

    isActive:
                Boolean(
                  form.isActive
                ),

    locationId:
                Number(
                  userStore.locationId
                ),

    payouts:
                form.payouts.map(
                  item => ({

                    description:
                            item.description
                              .trim(),

                    amount:
                            Number(
                              item.amount
                            )
                  })
                ),

    scheduleBlocks:
                form.scheduleBlocks.map(
                  block => ({

                    isAllDay:
                            Boolean(
                              block.isAllDay
                            ),

                    startTime:
                            block.isAllDay
                              ? null
                              : block.startTime,

                    endTime:
                            block.isAllDay
                              ? null
                              : block.endTime,

                    endDayOffset:
                            block.isAllDay
                              ? 0
                              : Number(
                                block.endDayOffset ??
                                    0
                              ),

                    days:
                            [
                              ...block.days
                            ]
                              .map(
                                Number
                              )
                              .sort(
                                (a, b) =>
                                  a - b
                              )
                  })
                )
  };
};

// ============================================================
// SAVE BONUS
// ============================================================

const saveBonus = async () => {
  try {
    const valid =
                await formRef.value
                  .validate()
                  .catch(
                    () => false
                  );

    if (!valid) {
      return;
    }

    if (
      !validateBonus()
    ) {
      return;
    }

    saving.value = true;

    const payload =
                buildPayload();

    let response;

    if (
      isEdit.value
    ) {
      response =
                    await updateBonus(
                      bonusId.value,
                      payload
                    );
    } else {
      response =
                    await createBonus(
                      payload
                    );
    }

    ElMessage.success(
      response.message
    );

    router.push({
      name:
                    'BonusManagement'
    });
  } catch (error) {
    ElMessage.error(
      error.response?.data?.message ||
                'Unable to save bonus.'
    );
  } finally {
    saving.value = false;
  }
};

// ============================================================
// DELETE BONUS
// ============================================================

const handleDelete = async () => {
  try {
    await ElMessageBox.confirm(
      'Are you sure you want to delete this bonus? Its payouts and schedules will also be deleted.',
      'Delete Bonus',
      {
        confirmButtonText:
                        'Delete',

        cancelButtonText:
                        'Cancel',

        type:
                        'warning'
      }
    );

    deleting.value = true;

    const response =
                await deleteBonus(
                  bonusId.value
                );

    ElMessage.success(
      response.message
    );

    router.push({
      name:
                    'BonusManagement'
    });
  } catch (error) {
    if (
      error === 'cancel' ||
                error === 'close'
    ) {
      return;
    }

    ElMessage.error(
      error.response?.data?.message ||
                'Unable to delete bonus.'
    );
  } finally {
    deleting.value = false;
  }
};

// ============================================================
// FIXED ACTION BAR
// ============================================================

const updateActionBarPosition = () => {
  const main =
            document.querySelector('.app-main') ||
            document.querySelector('main.el-main');

  if (!main) {
    actionBarStyle.value = {
      left: '0px',
      width: '100%'
    };

    return;
  }

  const rect =
            main.getBoundingClientRect();

  actionBarStyle.value = {
    left: `${Math.max(0, rect.left)}px`,
    width: `${Math.max(0, rect.width)}px`
  };
};

const showSettledActionBar = () => {
  updateActionBarPosition();

  if (actionBarTimer !== null) {
    window.clearTimeout(
      actionBarTimer
    );
  }

  actionBarTimer =
            window.setTimeout(
              () => {
                updateActionBarPosition();

                showActionBar.value =
                        true;

                actionBarTimer =
                        null;
              },
              550
            );
};

const wait = milliseconds => {
  return new Promise(
    resolve => {
      window.setTimeout(
        resolve,
        milliseconds
      );
    }
  );
};

// ============================================================
// INITIALIZE
// ============================================================

onMounted(
  async () => {
    if (
      isEdit.value
    ) {
      await loadBonus();
    } else {
      addPayout();

      addBlock();
    }

    await nextTick();

    window.addEventListener(
      'resize',
      updateActionBarPosition
    );

    showSettledActionBar();
  }
);

onBeforeRouteLeave(
  async () => {
    if (
      !showActionBar.value
    ) {
      return true;
    }

    showActionBar.value =
                false;

    await nextTick();

    await wait(320);

    return true;
  }
);

onBeforeUnmount(
  () => {
    if (
      actionBarTimer !== null
    ) {
      window.clearTimeout(
        actionBarTimer
      );

      actionBarTimer =
                    null;
    }

    window.removeEventListener(
      'resize',
      updateActionBarPosition
    );
  }
);
</script>

