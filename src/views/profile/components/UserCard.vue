<template>
  <el-card shadow="never" class="profile-card">
    <!-- PROFILE -->
    <div class="profile-header">
      <div class="avatar-wrap">
        <img :src="customer.avatar" alt="Customer" class="customer-avatar" />
        <span v-if="customer.isvip" class="vip-dot">
          <el-icon>
            <StarFilled />
          </el-icon>
        </span>
      </div>
      <div class="profile-info">
        <h3>
          {{ customer.firstname }}
          {{ customer.lastname }}
        </h3>
        <div class="phone-row">
          <el-icon>
            <Phone />
          </el-icon>
          <span>
            {{ formatPhone(customer.phone) }}
          </span>
        </div>
      </div>
      <el-tag v-if="customer.isactive" type="success" effect="light" size="small" round>
        Active
      </el-tag>
      <el-tag v-else type="info" effect="plain" size="small" round>
        Inactive
      </el-tag>
    </div>
    <el-divider />
    <!-- QUICK INFO -->
    <div class="quick-info">
      <div class="info-item">
        <div class="info-icon">
          <el-icon>
            <Coin />
          </el-icon>
        </div>
        <div class="info-content">
          <span>Points</span>
          <strong>
            {{ Number(customer.points || 0).toLocaleString() }}
          </strong>
        </div>
      </div>
      <div class="info-item">
        <div class="info-icon">
          <el-icon>
            <Calendar />
          </el-icon>
        </div>
        <div class="info-content">
          <span>Customer Since</span>
          <strong>
            {{ customer.datecreated || '—' }}
          </strong>
        </div>
      </div>
    </div>
    <!-- NOTE -->
    <div class="section-block">
      <div class="section-title">
        <div class="section-title-icon">
          <el-icon>
            <Document />
          </el-icon>
        </div>
        <span>Note</span>
      </div>
      <div class="note-box">
        This customer demonstrates strong play skills.
      </div>
    </div>
    <!-- STATISTICS -->
    <div class="section-block">
      <div class="section-title">
        <div class="section-title-icon">
          <el-icon>
            <TrendCharts />
          </el-icon>
        </div>
        <span>Statistics</span>
      </div>
      <div class="statistics">
        <div class="progress-item">
          <div class="progress-label">
            <span>Visits</span>
            <strong>70%</strong>
          </div>
          <el-progress :percentage="70" :show-text="false" />
        </div>
        <div class="progress-item">
          <div class="progress-label">
            <span>Spending</span>
            <strong>18%</strong>
          </div>
          <el-progress :percentage="18" :show-text="false" />
        </div>
        <div class="progress-item">
          <div class="progress-label">
            <span>Winning</span>
            <strong>12%</strong>
          </div>
          <el-progress :percentage="12" :show-text="false" />
        </div>
      </div>
    </div>
    <!-- VIP -->
    <div v-if="customer.isvip" class="vip-badge">
      <div class="vip-icon-wrap">
        <el-icon>
          <StarFilled />
        </el-icon>
      </div>
      <div class="vip-text">
        <span class="vip-title">
          VIP Customer
        </span>
        <small>
          Premium Member
        </small>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { formatPhone } from '@/utils/phone';

import {
  Calendar,
  Coin,
  Document,
  Phone,
  StarFilled,
  TrendCharts
} from '@element-plus/icons-vue';

defineProps({
  customer: {
    type: Object,
    required: true
  }
});
</script>

<style lang="scss" scoped>

        .profile-card {
            margin-bottom: 20px;
            border-radius: 16px;
            border: 1px solid var(--el-border-color-lighter);
            background: #fff;
        }

            .profile-card :deep(.el-card__body) {
                padding: 22px;
            }

        /* =========================
       PROFILE
    ========================= */

        .profile-header {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
        }

        .avatar-wrap {
            position: relative;
            display: inline-flex;
        }

        .customer-avatar {
            width: 104px;
            height: 104px;
            display: block;
            border-radius: 14px;
            object-fit: cover;
            border: 1px solid var(--el-border-color-lighter);
            box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
        }

        .vip-dot {
            position: absolute;
            right: -3px;
            bottom: 3px;
            width: 29px;
            height: 29px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 3px solid #fff;
            border-radius: 50%;
            background: var(--el-color-primary);
            color: #fff;
            font-size: 13px;
            box-shadow: 0 4px 12px color-mix( in srgb, var(--el-color-primary) 30%, transparent );
        }

        .profile-info {
            margin: 14px 0 12px;
        }

            .profile-info h3 {
                margin: 0;
                color: var(--el-text-color-primary);
                font-size: 18px;
                font-weight: 700;
            }

        .phone-row {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            margin-top: 7px;
            color: var(--el-text-color-secondary);
            font-size: 13px;
        }

            .phone-row .el-icon {
                color: var(--el-color-primary);
            }

        /* =========================
       QUICK INFO
    ========================= */

        .quick-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
        }

        .info-item {
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 0;
            padding: 11px 10px;
            border: 1px solid var(--el-border-color-lighter);
            border-radius: 12px;
            background: #fff;
        }

        .info-icon {
            width: 34px;
            height: 34px;
            flex: 0 0 34px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 9px;
            background: var(--el-fill-color-light);
            color: var(--el-color-primary);
            font-size: 17px;
        }

        .info-content {
            min-width: 0;
        }

        .info-item span,
        .info-item strong {
            display: block;
        }

        .info-item span {
            color: var(--el-text-color-secondary);
            font-size: 10px;
        }

        .info-item strong {
            margin-top: 2px;
            overflow: hidden;
            color: var(--el-text-color-primary);
            font-size: 12px;
            font-weight: 600;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        /* =========================
       SECTIONS
    ========================= */

        .section-block {
            margin-top: 22px;
        }

        .section-title {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 11px;
            color: var(--el-text-color-primary);
            font-size: 13px;
            font-weight: 650;
        }

        .section-title-icon {
            width: 29px;
            height: 29px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            background: var(--el-fill-color-light);
            color: var(--el-color-primary);
        }

        /* =========================
       NOTE
    ========================= */

        .note-box {
            padding: 12px 13px;
            border: 1px solid var(--el-border-color-lighter);
            border-radius: 11px;
            background: var(--el-fill-color-extra-light);
            color: var(--el-text-color-regular);
            font-size: 12px;
            line-height: 1.6;
        }

        /* =========================
       STATISTICS
    ========================= */

        .statistics {
            display: flex;
            flex-direction: column;
            gap: 13px;
        }

        .progress-label {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 6px;
            font-size: 11px;
        }

            .progress-label span {
                color: var(--el-text-color-regular);
            }

            .progress-label strong {
                color: var(--el-color-primary);
                font-weight: 600;
            }

        .progress-item :deep(.el-progress-bar__outer) {
            height: 6px !important;
            background: var(--el-fill-color-light);
        }

        .progress-item :deep(.el-progress-bar__inner) {
            background: var(--el-color-primary) !important;
        }

        /* =========================
       VIP
    ========================= */

        .vip-badge {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-top: 22px;
            padding: 13px 14px;
            border: 1px solid var(--el-border-color-lighter);
            border-radius: 13px;
            background: var(--el-fill-color-extra-light);
        }

        .vip-icon-wrap {
            width: 38px;
            height: 38px;
            flex: 0 0 38px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 10px;
            background: var(--el-color-primary);
            color: #fff;
            font-size: 18px;
        }

        .vip-text {
            display: flex;
            flex-direction: column;
        }

        .vip-title {
            color: var(--el-text-color-primary);
            font-size: 13px;
            font-weight: 650;
        }

        .vip-text small {
            margin-top: 2px;
            color: var(--el-text-color-secondary);
            font-size: 11px;
        }

        /* =========================
       MOBILE
    ========================= */

        @media (max-width: 768px) {

            .profile-card :deep(.el-card__body) {
                padding: 18px;
            }

            .quick-info {
                margin-top: 4px;
            }
        }
</style>
