<template>
    <div class="app-container manage-rules-page irfan-ui-page">
        <div class="page-header">
            <div>
                <h2>Manage Rules</h2>
                <p>Configure operational rules for the selected location.</p>
            </div>
            <el-button type="primary" :loading="saving" :disabled="loading" @click="saveRules">
                <el-icon v-if="!saving"><Check /></el-icon>
                <span>Save Rules</span>
            </el-button>
        </div>
        <div v-loading="loading" element-loading-text="Loading rules..." class="rules-content">
            <el-card shadow="never" class="rule-card rule-match" :class="{ enabled: form.matchRuleEnabled }">
                <el-checkbox v-model="form.matchRuleEnabled" size="large">
                    <div class="rule-title-wrap">
                        <strong>Enable Match Rule</strong>
                        <small>
                            Enabling this rule allows customers to match again only after the configured time limit.
                        </small>
                    </div>
                </el-checkbox>
                <el-collapse-transition>
                    <div v-if="form.matchRuleEnabled" class="rule-body match-rule-body">
                        <!-- PRIMARY MATCH SETTINGS -->
                        <div class="match-settings-grid">
                            <div class="match-setting-block">
                                <div class="setting-label">
                                    Rule Name
                                    <span class="required-mark">*</span>
                                </div>
                                <el-input v-model="form.matchRuleName" maxlength="100" placeholder="MATCH" />
                                <div class="setting-help">
                                    Internal name used for this match rule.
                                </div>
                            </div>
                            <div class="match-setting-block">
                                <div class="setting-label">
                                    Cooldown
                                    <span class="required-mark">*</span>
                                </div>
                                <div class="input-with-suffix">
                                    <el-input-number v-model="form.matchCooldownHours" :min="0" :max="720" controls-position="right" class="full-width" />
                                    <span class="input-suffix">
                                        hours
                                    </span>
                                </div>
                                <div class="setting-help">
                                    Time before the customer can match again.
                                </div>
                            </div>
                            <div class="match-setting-block">
                                <div class="setting-label">
                                    Daily Match Limit
                                    <span class="required-mark">*</span>
                                </div>
                                <div class="input-with-suffix">
                                    <el-input-number v-model="form.matchMaxPerDay" :min="0" :max="100" controls-position="right" class="full-width" />
                                    <span class="input-suffix">
                                        matches
                                    </span>
                                </div>
                                <div class="setting-help">
                                    Maximum allowed matches per customer per day.
                                </div>
                            </div>
                        </div>
                        <!-- RESET SCHEDULE -->
                        <div class="reset-schedule-panel">
                            <div class="reset-schedule-header">
                                <div>
                                    <div class="reset-title">
                                        Reset Schedule
                                    </div>
                                    <div class="reset-description">
                                        Configure when daily match limits reset.
                                    </div>
                                </div>
                            </div>
                            <div class="reset-settings-grid">
                                <div class="match-setting-block">
                                    <div class="setting-label">
                                        Reset Times
                                        <span class="required-mark">*</span>
                                    </div>
                                    <el-select v-model="form.matchResetTimes" multiple allow-create filterable default-first-option placeholder="07:00, 19:00" class="full-width">
                                        <el-option v-for="time in commonTimes" :key="time" :label="time" :value="time" />
                                    </el-select>
                                    <div class="setting-help">
                                        Use 24-hour HH:MM format.
                                    </div>
                                </div>
                                <div class="match-setting-block">
                                    <div class="setting-label">
                                        Reset Day Time
                                        <span class="required-mark">*</span>
                                    </div>
                                    <el-time-picker v-model="form.matchResetDayTime" value-format="HH:mm" format="HH:mm" placeholder="07:00" class="full-width" />
                                    <div class="setting-help">
                                        Default time used for the daily reset cycle.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </el-collapse-transition>
            </el-card>
            <RuleToggleCard v-model="form.nfcTicketOutEnabled" title="Enable NFC Ticket Out" accent="#409eff" accent-soft="rgba(64, 158, 255, 0.11)" description="When enabled, employees with NFC access can scan a machine to auto-fill the Ticket Out form. Turn this off to require manual machine entry." />
            <RuleToggleCard v-model="form.auditVerificationEnabled" title="Enable Audit Verification of Bonuses & Raffles" accent="#e6a23c" accent-soft="rgba(230, 162, 60, 0.11)" description="When enabled, employees cannot close out every bonus and raffle in a session until the session has been audited, approved, or flagged." />
            <RuleToggleCard v-model="form.phoneVerificationRequired" title="Require Phone Verification" accent="#f56c6c" accent-soft="rgba(245, 108, 108, 0.10)" description="When enabled, a customer must verify their phone with an SMS code before collecting points. Turn this off for locations that do not need phone verification." />
            <RuleToggleCard v-model="form.nuVueBoostEnabled" title="Enable NuVue Boost" accent="#67c23a" accent-soft="rgba(103, 194, 58, 0.11)" description="When enabled, the NuVue Boost marketing menu is available to permitted staff at this location." />
            <el-card shadow="never" class="rule-card rule-ticket-photo" :class="{ enabled: form.ticketPhotoRequired }">
                <el-checkbox v-model="form.ticketPhotoRequired" size="large">
                    <div class="rule-title-wrap">
                        <strong>Enable Ticket Photo Requirement</strong>
                        <small>
                            When an employee enters a Ticket Out at or above the minimum amount, a photo is required before saving.
                        </small>
                    </div>
                </el-checkbox>
                <el-collapse-transition>
                    <div v-if="form.ticketPhotoRequired" class="rule-body">
                        <el-form-item label="Minimum Amount" required>
                            <el-input-number v-model="form.ticketPhotoMinAmount" :min="0" :step="10" :precision="2" controls-position="right" class="amount-field" />
                        </el-form-item>
                        <div class="quick-values">
                            <el-button v-for="amount in ticketQuickValues" :key="amount" round @click="form.ticketPhotoMinAmount = amount">
                                ${{ amount.toLocaleString() }}
                            </el-button>
                        </div>
                    </div>
                </el-collapse-transition>
            </el-card>
            <el-card shadow="never" class="rule-card rule-vip" :class="{ enabled: form.vipMatchEnabled }">
                <el-checkbox v-model="form.vipMatchEnabled" size="large">
                    <div class="rule-title-wrap">
                        <strong>Enable VIP Match</strong>
                        <small>
                            When a pending customer's points are at or above the minimum amount, the employee must take a photo before the machine can be set.
                        </small>
                    </div>
                </el-checkbox>
                <el-collapse-transition>
                    <div v-if="form.vipMatchEnabled" class="rule-body">
                        <el-form-item label="Minimum Points" required>
                            <el-input-number v-model="form.vipMatchMinPoints" :min="0" :step="10" controls-position="right" class="amount-field" />
                        </el-form-item>
                        <div class="quick-values">
                            <el-button v-for="points in vipQuickValues" :key="points" round @click="form.vipMatchMinPoints = points">
                                {{ points }} pts
                            </el-button>
                        </div>
                    </div>
                </el-collapse-transition>
            </el-card>
            <div class="save-footer">
                <el-button type="primary" size="large" :loading="saving" :disabled="loading" @click="saveRules">
                    Save Rules
                </el-button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Check } from '@element-plus/icons-vue'

import { useUserStore } from '@/store/modules/user'
import { getManageRules, updateManageRules } from '@/api/manageRules'
import RuleToggleCard from './components/RuleToggleCard.vue'

const userStore = useUserStore()

const loading = ref(false)
const saving = ref(false)

const commonTimes = [
        '05:00', '06:00', '07:00', '08:00', '09:00',
        '12:00', '17:00', '18:00', '19:00', '20:00', '21:00'
]

const ticketQuickValues = [250, 300, 400, 500, 1000]
const vipQuickValues = [30, 40, 50, 100, 200]

const defaultForm = () => ({
        locationId: Number(userStore.locationId || 0),
        matchRuleEnabled: false,
        matchRuleName: 'MATCH',
        matchCooldownHours: 3,
        matchMaxPerDay: 2,
        matchResetTimes: ['07:00', '19:00'],
        matchResetDayTime: '07:00',
        nfcTicketOutEnabled: false,
        auditVerificationEnabled: false,
        phoneVerificationRequired: false,
        nuVueBoostEnabled: false,
        ticketPhotoRequired: false,
        ticketPhotoMinAmount: 10,
        vipMatchEnabled: false,
        vipMatchMinPoints: 10
})

const form = reactive(defaultForm())

function applyRules(data: any) {
        Object.assign(
            form,
            defaultForm(),
            data || {},
            {
                locationId: Number(userStore.locationId || 0),
                matchResetTimes: Array.isArray(data?.matchResetTimes)
                    ? data.matchResetTimes
                    : []
            }
        )
}

async function loadRules() {
        if (!userStore.locationId) return

        try {
            loading.value = true

            const response = await getManageRules(userStore.locationId)
            applyRules(response?.data)
        } catch (error: any) {
            console.error(error)

            ElMessage.error(
                error?.response?.data?.message ||
                error?.message ||
                'Unable to load manage rules.'
            )
        } finally {
            loading.value = false
        }
}

async function saveRules() {
        if (!userStore.locationId) {
            ElMessage.warning('Please select a location.')
            return
        }

        if (form.matchRuleEnabled && !String(form.matchRuleName || '').trim()) {
            ElMessage.warning('Rule Name is required.')
            return
        }

        if (form.matchRuleEnabled && form.matchResetTimes.length === 0) {
            ElMessage.warning('Add at least one reset time.')
            return
        }

        try {
            saving.value = true

            const response = await updateManageRules({
                ...form,
                locationId: Number(userStore.locationId)
            })

            applyRules(response?.data)

            ElMessage.success(
                response?.message || 'Rules saved successfully.'
            )
        } catch (error: any) {
            console.error(error)

            ElMessage.error(
                error?.response?.data?.message ||
                error?.message ||
                'Unable to save manage rules.'
            )
        } finally {
            saving.value = false
        }
}

watch(
        () => userStore.locationId,
        () => loadRules()
)

onMounted(loadRules)
</script>

<style scoped lang="scss">
        .manage-rules-page {
            width: 100%;
            max-width: none;
            margin: 0;
        }

        .rules-content {
            width: 100%;
            min-height: 260px;
        }

        .page-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 18px;
            margin-bottom: 20px;
        }

            .page-header h2 {
                margin: 0 0 5px;
                color: var(--el-text-color-primary);
                font-size: 24px;
                font-weight: 700;
            }

            .page-header p {
                margin: 0;
                color: var(--el-text-color-secondary);
                font-size: 13px;
            }

        /* Dashboard-inspired cards with individual section accents. */
        .rule-card {
            --rule-accent: var(--el-color-primary);
            --rule-accent-soft: var(--el-color-primary-light-9);
            position: relative;
            isolation: isolate;
            overflow: hidden;
            margin-bottom: 16px;
            border: 1px solid var(--el-border-color-lighter);
            border-radius: 16px;
            background: linear-gradient(145deg, #ffffff 0%, #fbfcff 100%);
            box-shadow: 0 3px 12px rgba(0, 0, 0, 0.035);
            transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;
        }

            .rule-card::after {
                content: '';
                position: absolute;
                right: -28px;
                bottom: -35px;
                width: 85px;
                height: 85px;
                border-radius: 50%;
                background: var(--rule-accent-soft);
                opacity: .9;
                pointer-events: none;
                z-index: 0;
                transition: transform .25s ease, opacity .25s ease;
            }

            .rule-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 28px rgba(0, 0, 0, 0.07);
                border-color: var(--rule-accent);
            }

                .rule-card:hover::after {
                    transform: scale(1.08);
                    opacity: 1;
                }

            .rule-card.enabled {
                /*border-color: color-mix( in srgb, var(--rule-accent) 55%, var(--el-border-color-lighter) );*/
            }

        /* Different accent for each native rule section */
        .rule-match {
            --rule-accent: #40c9c6;
            --rule-accent-soft: rgba(64, 201, 198, 0.11);
        }

        .rule-ticket-photo {
            --rule-accent: #a78bfa;
            --rule-accent-soft: rgba(167, 139, 250, 0.12);
        }

        .rule-vip {
            --rule-accent: #f06292;
            --rule-accent-soft: rgba(240, 98, 146, 0.11);
        }

        .rule-card :deep(.el-card__body) {
            position: relative;
            z-index: 1;
            padding: 18px;
        }

        .rule-title-wrap {
            display: flex;
            flex-direction: column;
            gap: 3px;
            white-space: normal;
        }

            .rule-title-wrap strong {
                color: var(--el-text-color-primary);
                font-size: 13px;
                font-weight: 650;
            }

            .rule-title-wrap small {
                color: var(--el-text-color-secondary);
                font-size: 11px;
                font-weight: 400;
                line-height: 1.5;
            }

        .rule-body {
            margin-top: 18px;
            padding-top: 18px;
            border-top: 1px solid var(--el-border-color-lighter);
        }

        .full-width {
            width: 100%;
        }

        .time-field,
        .amount-field {
            width: 215px;
        }

        .field-help {
            width: 100%;
            margin-top: 5px;
            color: var(--el-text-color-secondary);
            font-size: 10px;
        }

        .quick-values {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 6px;
        }

            .quick-values .el-button {
                margin-left: 0;
            }

        .save-footer {
            display: flex;
            justify-content: flex-end;
            padding-top: 6px;
        }

            .save-footer .el-button {
                min-width: 160px;
            }

        :deep(.el-checkbox) {
            height: auto;
            align-items: flex-start;
        }

        :deep(.el-checkbox__input) {
            margin-top: 2px;
        }

        :deep(.el-checkbox__label) {
            padding-left: 9px;
        }


        /* =========================
       MATCH RULE INNER CONTENT
    ========================= */

        .match-rule-body {
            display: flex;
            flex-direction: column;
            gap: 18px;
        }

        .match-settings-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 14px;
        }

        .match-setting-block {
            min-width: 0;
        }

        .setting-label {
            margin-bottom: 7px;
            color: var(--el-text-color-primary);
            font-size: 12px;
            font-weight: 600;
        }

        .required-mark {
            color: var(--el-color-danger);
        }

        .setting-help {
            margin-top: 6px;
            color: var(--el-text-color-secondary);
            font-size: 10px;
            line-height: 1.45;
        }

        .input-with-suffix {
            position: relative;
        }

            .input-with-suffix :deep(.el-input__wrapper) {
                padding-right: 62px;
            }

        .input-suffix {
            position: absolute;
            top: 50%;
            right: 34px;
            transform: translateY(-50%);
            color: var(--el-text-color-secondary);
            font-size: 11px;
            pointer-events: none;
        }

        .reset-schedule-panel {
            padding: 16px;
            border: 1px solid var(--el-border-color-lighter);
            border-radius: 12px;
            background: var(--el-fill-color-extra-light);
        }

        .reset-schedule-header {
            margin-bottom: 14px;
        }

        .reset-title {
            color: var(--el-text-color-primary);
            font-size: 13px;
            font-weight: 650;
        }

        .reset-description {
            margin-top: 3px;
            color: var(--el-text-color-secondary);
            font-size: 10px;
        }

        .reset-settings-grid {
            display: grid;
            grid-template-columns: minmax(0, 2fr) minmax(190px, 1fr);
            gap: 14px;
        }

        @media (max-width: 1000px) {
            .match-settings-grid {
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .reset-settings-grid {
                grid-template-columns: 1fr 1fr;
            }
        }

        @media (max-width: 700px) {
            .match-settings-grid,
            .reset-settings-grid {
                grid-template-columns: 1fr;
            }

            .reset-schedule-panel {
                padding: 14px;
            }
        }

        @media (max-width: 700px) {
            .page-header {
                align-items: flex-start;
            }

                .page-header > .el-button {
                    flex-shrink: 0;
                }

            .rule-card :deep(.el-card__body) {
                padding: 15px;
            }

            .time-field,
            .amount-field {
                width: 100%;
            }

            .save-footer .el-button {
                width: 100%;
            }
        }
</style>
