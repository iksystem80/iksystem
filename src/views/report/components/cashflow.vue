<template>
    <div>
        <div v-if="device !== 'mobile'">
            <el-table :data="tableData" border style="width: 100%; font-size:12px">
                <el-table-column prop="date" label="Date" min-width="100" />
                <el-table-column prop="opbalance" label="Opening Balance" min-width="140" />
                <el-table-column prop="readingin" label="Reading In"  min-width="140"/>
                <el-table-column prop="totalin" label="Total Credit" width="140" />
                <el-table-column prop="readingout" label="Reading out" min-width="140"/>
                <el-table-column prop="match" label="Match Amount" min-width="140"/>
                <el-table-column prop="expenses" label="Expenses" min-width="140"/>
                <el-table-column prop="totalout" label="Total Debit" min-width="140"/>
                <el-table-column prop="clbalance" label="Closing Balance" min-width="140"/>
                <el-table-column prop="cashinhand" label="Cash in Hand" min-width="140"/>
                <el-table-column prop="shortover" label="Short/Over" min-width="140"/>
            </el-table>
        </div>
        <div v-if="device === 'mobile'">
            <el-row :gutter="32">
                <el-col>
                    <el-card shadow="hover" style="background-color: #e6f7f5;">
                        <template #header>
                            <div class="card-header">
                                <span><el-icon style="color:darkgreen"><ArrowDownBold /></el-icon>  Credit</span>
                            </div>
                        </template>
                        <div  class="elcard-body">
                            <el-row>
                                <el-col :span="12">
                                    <p style="margin-top: 5px; margin-bottom: 5px;">Opening Balance </p>
                                </el-col>
                                <el-col :span="12">
                                    <p  style="margin-top: 5px; margin-bottom: 5px;" class="text-right-bold">$1021.23</p>
                                </el-col>
                            </el-row>
                            <el-row>
                                <el-col :span="12">
                                    <p style="margin-top: 5px; margin-bottom: 5px;">Reading Total </p>
                                </el-col>
                                <el-col :span="12">
                                    <p  style="margin-top: 5px; margin-bottom: 5px;" class="text-right-bold">$5125.75</p>
                                </el-col>
                            </el-row>
                        </div>
                        <template #footer>
                            <el-row>
                                <el-col :span="12">
                                    <p>Total Credit</p>
                                </el-col>
                                <el-col :span="12">
                                    <p class="text-right-pad40">$125.00</p>
                                </el-col>
                            </el-row>
                        </template>
                    </el-card>
                </el-col>
            </el-row>
            <el-row :gutter="32" style="margin-top:20px">
                <el-col>
                    <el-card shadow="hover" style="background-color: #f5e1e1;">
                        <template #header>
                            <div class="card-header">
                                <span><el-icon style="color:red"><ArrowUpBold /></el-icon>  Debit</span>
                            </div>
                        </template>
                        <div class="elcard-body">
                            <el-row>
                                <el-col :span="12">
                                    <p style="margin-top: 5px; margin-bottom: 5px;" >Reading Total</p>
                                </el-col>
                                <el-col :span="12">
                                    <p style="margin-top: 5px; margin-bottom: 5px;" class="text-right-bold">$2021.23</p>
                                </el-col>
                            </el-row>
                            <el-row>
                                <el-col :span="12">
                                    <p style="margin-top: 5px; margin-bottom: 5px;">Match</p>
                                </el-col>
                                <el-col :span="12">
                                    <p style="margin-top: 5px; margin-bottom: 5px;"class="text-right-bold">$1150.50</p>
                                </el-col>
                            </el-row>
                            <el-row>
                                <el-col :span="12">
                                    <p style="margin-top: 5px; margin-bottom: 5px;">Other Expenses</p>
                                </el-col>
                                <el-col :span="12">
                                    <p style="margin-top: 5px; margin-bottom: 5px;" class="text-right-bold">$125.00</p>
                                </el-col>
                            </el-row>
                            </div>
                            <template #footer>
                                <el-row>
                                    <el-col :span="12">
                                        <p>Total Debit</p>
                                    </el-col>
                                    <el-col :span="12">
                                        <p class="text-right-pad40">$125.00</p>
                                    </el-col>
                                </el-row>
                            </template>
                    </el-card>
                </el-col>
            </el-row>
            <el-row :gutter="32" style="margin-top:20px">
                <el-col>
                    <el-card shadow="hover" style="background-color: #d9e3f5;">
                        <div class="elcard-body">
                            <el-row>
                                <el-col :span="12">
                                    <p style="margin-top: 5px; margin-bottom: 5px;">Balance</p>
                                </el-col>
                                <el-col :span="12">
                                    <p style="margin-top: 5px; margin-bottom: 5px;" class="text-right-bold">$2021.23</p>
                                </el-col>
                            </el-row>
                            <el-row>
                                <el-col :span="12">
                                    <p style="margin-top: 5px; margin-bottom: 5px;">Cash In Hand</p>
                                </el-col>
                                <el-col :span="12">
                                    <p style="margin-top: 5px; margin-bottom: 5px;" class="text-right-bold">$2021.23</p>
                                </el-col>
                            </el-row>
                            <el-row>
                                <el-col :span="12">
                                    <p style="margin-top: 5px; margin-bottom: 5px;">Short/Over</p>
                                </el-col>
                                <el-col :span="12">
                                    <p style="margin-top: 5px; margin-bottom: 5px;" class="text-right-bold">$2021.23</p>
                                </el-col>
                            </el-row>
                            </div>
                    </el-card>
                </el-col>
            </el-row>
        </div>
   </div>
</template>

<script setup>
    import { onMounted, ref, computed } from 'vue'
    import { useUserStore } from '@/store/modules/user'
    import { useAppStore } from '@/store/modules/app'

    const appStore = useAppStore()
    const userStore = useUserStore()

    const device = computed(() => appStore.device)

</script>

