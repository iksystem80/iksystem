<template>
    <el-card shadow="never" class="toggle-rule-card" :class="{ enabled: modelValue }" :style="{
            '--rule-accent': accent,
            '--rule-accent-soft': accentSoft
        }">
        <el-checkbox :model-value="modelValue" size="large" @update:model-value="$emit('update:modelValue', $event)">
            <div class="rule-title-wrap">
                <strong>{{ title }}</strong>
                <small>{{ description }}</small>
            </div>
        </el-checkbox>
    </el-card>
</template>

<script setup lang="ts">
defineProps({
        modelValue: { type: Boolean, required: true },
        title: { type: String, required: true },
        description: { type: String, required: true },

        accent: {
            type: String,
            default: 'var(--el-color-primary)'
        },

        accentSoft: {
            type: String,
            default: 'var(--el-color-primary-light-9)'
        }
})

defineEmits(['update:modelValue'])
</script>

<style scoped lang="scss">
    .toggle-rule-card {
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

        .toggle-rule-card::after {
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

        .toggle-rule-card.enabled {
            /*border-color: color-mix( in srgb, var(--rule-accent) 55%, var(--el-border-color-lighter) );*/
        }

        .toggle-rule-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 28px rgba(0, 0, 0, 0.07);
            border-color: var(--rule-accent);
        }

            .toggle-rule-card:hover::after {
                transform: scale(1.08);
                opacity: 1;
            }

        .toggle-rule-card :deep(.el-card__body) {
            position: relative;
            z-index: 1;
            padding: 16px 18px;
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
</style>
