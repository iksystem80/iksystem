<template>
    <div class="app-container irfan-ui-page">
        <el-tabs v-model="activeName" @tab-click="handleClick">
            <el-tab-pane label="Cash Flow" name="first"><cashflow /></el-tab-pane>
            <el-tab-pane label="Reading" name="second"><reading /></el-tab-pane>
            <el-tab-pane label="Expenses" name="third"><expenses /></el-tab-pane>
            <el-tab-pane label="Colsing Balance" name="fourth"><closingbalance /></el-tab-pane>
            <el-tab-pane label="Manager Loan" name="fifth"><loan/></el-tab-pane>
            <el-tab-pane label="Daily Analysis" name="sixth">
                <analysis />
            </el-tab-pane>
            <el-tab-pane label="Percentages" name="seventh"><percentages/></el-tab-pane>
        </el-tabs>
    </div>
</template>

<script lang="ts" setup>
    import { ref } from 'vue'
    import type { TabsPaneContext } from 'element-plus'
    import analysis from './components/analysis';
    import cashflow from './components/cashflow';
    import closingbalance from './components/closingbalance';
    import expenses from './components/expenses';
    import loan from './components/loan';
    import percentages from './components/percentages';
    import reading from './components/reading';

    const activeName = ref('first')

    const handleClick = (tab: TabsPaneContext, event: Event) => {
        console.log(tab, event)
    }
</script>

