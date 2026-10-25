<template>
            <el-dialog v-model="visible"
                       title=""
                       width="92%"
                       class="ticket-reconcile-dialog"
                       destroy-on-close>
              <div class="ticket-dialog-heading">
                <div>
                  <strong>Reading Session #{{ sessionId }}</strong>
                  <span>{{ endedAt }}</span>
                </div>
              </div>

              <div class="ticket-dialog-summary employee-banner-theme">
                <div>
                  <span class="ticket-reconcile-eyebrow">TICKET RECONCILIATION</span>
                  <strong class="ticket-reconcile-net"
                          :class="ticketVariance > 0 ? 'is-short' : ticketVariance < 0 ? 'is-over' : 'is-even'">
                    {{ signedMoney(ticketVariance) }}
                  </strong>
                  <p>
                    {{
                    ticketVariance > 0
                      ? 'Money still available — tickets were paid below machine OUT.'
                      : ticketVariance < 0
                        ? 'Tickets were paid above machine OUT.'
                        : 'Machine OUT and Ticket Out match exactly.'
                    }}
                  </p>
                </div>

                <div class="ticket-reconcile-badges">
                  <div class="ticket-reconcile-badge short">
                    <span>SHORT PAY</span>
                    <strong>${{ formatMoney(ticketShortPayTotal) }}</strong>
                  </div>
                  <div class="ticket-reconcile-badge over">
                    <span>OVER TICKET PAID</span>
                    <strong>${{ formatMoney(ticketOverPaidTotal) }}</strong>
                  </div>
                </div>

                <div class="ticket-reconcile-bottom">
                  <div>
                    <span>READING OUT</span>
                    <strong>${{ formatMoney(totalMachineOut) }}</strong>
                    <small>{{ rows.length }} machines</small>
                  </div>
                  <div>
                    <span>TICKET OUT</span>
                    <strong>${{ formatMoney(totalTicketOut) }}</strong>
                    <small>{{ totalTicketCount }} tickets</small>
                  </div>
                </div>
              </div>

              <div class="ticket-dialog-filters">
                <el-button :type="ticketReconcileFilter === 'all' ? 'primary' : 'default'"
                           round
                           @click="ticketReconcileFilter = 'all'">
                  All · {{ ticketReconcileCounts.all }}
                </el-button>
                <el-button :type="ticketReconcileFilter === 'even' ? 'primary' : 'default'"
                           round
                           @click="ticketReconcileFilter = 'even'">
                  Even · {{ ticketReconcileCounts.even }}
                </el-button>
                <el-button :type="ticketReconcileFilter === 'short' ? 'success' : 'default'"
                           round
                           @click="ticketReconcileFilter = 'short'">
                  Short Paid · {{ ticketReconcileCounts.short }}
                </el-button>
                <el-button :type="ticketReconcileFilter === 'over' ? 'danger' : 'default'"
                           round
                           @click="ticketReconcileFilter = 'over'">
                  Over Paid · {{ ticketReconcileCounts.over }}
                </el-button>
              </div>

              <div class="ticket-machine-list">
                <div v-for="row in filteredTicketReconcileRows"
                     :key="row.id"
                     class="ticket-machine-row">
                  <div class="ticket-machine-number">
                    <span>MCH</span>
                    <strong>{{ row.machinenumber }}</strong>
                  </div>

                  <div class="ticket-machine-amount">
                    <span>READING OUT</span>
                    <strong>${{ formatMoney(row.dailyout) }}</strong>
                  </div>

                  <div class="ticket-machine-arrow">→</div>

                  <div class="ticket-machine-amount">
                    <span>TICKET OUT</span>
                    <strong>${{ formatMoney(row.ticketout) }}</strong>
                  </div>

                  <div class="ticket-machine-meta">
                    <span>{{ Number(row.ticketcount || 0) }} {{ Number(row.ticketcount || 0) === 1 ? 'ticket' : 'tickets' }}</span>
                    <small v-if="row.ticketemployees">{{ row.ticketemployees }}</small>
                  </div>

                  <div class="ticket-machine-status">
                    <el-tag :type="ticketReconcileType(row) === 'short' ? 'success' : ticketReconcileType(row) === 'over' ? 'danger' : 'info'"
                            effect="light"
                            round>
                      {{
                      ticketReconcileType(row) === 'short'
                        ? `+${formatMoney(ticketMachineVariance(row))}`
                        : ticketReconcileType(row) === 'over'
                          ? `-${formatMoney(Math.abs(ticketMachineVariance(row)))}`
                          : 'Even'
                      }}
                    </el-tag>
                    <small>
                      {{
                      ticketReconcileType(row) === 'short'
                        ? 'Short Paid'
                        : ticketReconcileType(row) === 'over'
                          ? 'Over Paid'
                          : 'Matched'
                      }}
                    </small>
                  </div>
                </div>

                <el-empty v-if="filteredTicketReconcileRows.length === 0"
                          description="No machines match this filter." />
              </div>
            </el-dialog>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
const props = defineProps<{ modelValue: boolean; sessionId?: number | null; endedAt?: string; rows: any[] }>();
const emit = defineEmits<{ (event: 'update:modelValue', value: boolean): void }>();
const visible = computed({ get: () => props.modelValue, set: value => emit('update:modelValue', value) });
const ticketReconcileFilter = ref<'all' | 'even' | 'short' | 'over'>('all');
const moneyNumber = (value: unknown) => Number(value || 0);
const formatMoney = (value: unknown) => moneyNumber(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const signedMoney = (value: unknown) => `${moneyNumber(value) < 0 ? '-' : ''}$${formatMoney(Math.abs(moneyNumber(value)))}`;
const ticketMachineVariance = (row: any) => moneyNumber(row.dailyout) - moneyNumber(row.ticketout);
const ticketReconcileType = (row: any): 'even' | 'short' | 'over' => Math.abs(ticketMachineVariance(row)) < .005 ? 'even' : ticketMachineVariance(row) > 0 ? 'short' : 'over';
const totalMachineOut = computed(() => props.rows.reduce((n, r) => n + moneyNumber(r.dailyout), 0));
const totalTicketOut = computed(() => props.rows.reduce((n, r) => n + moneyNumber(r.ticketout), 0));
const totalTicketCount = computed(() => props.rows.reduce((n, r) => n + moneyNumber(r.ticketcount), 0));
const ticketVariance = computed(() => totalMachineOut.value - totalTicketOut.value);
const ticketShortPayTotal = computed(() => props.rows.reduce((n, r) => n + Math.max(0, ticketMachineVariance(r)), 0));
const ticketOverPaidTotal = computed(() => props.rows.reduce((n, r) => n + Math.max(0, -ticketMachineVariance(r)), 0));
const ticketReconcileCounts = computed(() => {
  const counts = { all: props.rows.length, even: 0, short: 0, over: 0 };
  props.rows.forEach(row => counts[ticketReconcileType(row)]++);
  return counts;
});
const filteredTicketReconcileRows = computed(() => ticketReconcileFilter.value === 'all' ? props.rows : props.rows.filter(row => ticketReconcileType(row) === ticketReconcileFilter.value));
</script>
