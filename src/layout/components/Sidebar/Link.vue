<template>
    <component :is="type"
               v-bind="linkProps">
        <slot />
    </component>
</template>

<script setup lang="ts">
    import { computed } from 'vue'
    import { isExternal } from '@/utils/validate'

    interface Props {
        to: string
    }

    const props = defineProps<Props>()

    const external = computed(() => {
        return isExternal(props.to)
    })

    const type = computed(() => {
        return external.value
            ? 'a'
            : 'router-link'
    })

    const linkProps = computed(() => {
        if (external.value) {
            return {
                href: props.to,
                target: '_blank',
                rel: 'noopener noreferrer'
            }
        }

        return {
            to: props.to
        }
    })
</script>
