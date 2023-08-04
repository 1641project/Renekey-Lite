<template>
<XColumn :column="column" :is-stacked="isStacked" :indicated="indicated">
	<template #icon><i class="ti ti-at"></i></template>
	<template #header>{{ column.name }}</template>

	<MkTimeline ref="timeline" src="mentions" @queue="queueUpdated"/>
</XColumn>
</template>

<script lang="ts" setup>
import { ref, shallowRef } from 'vue';
import XColumn from './column.vue';
import { Column } from './deck-store';
import MkTimeline from '@/components/MkTimeline.vue';

defineProps<{
	column: Column;
	isStacked: boolean;
}>();

const indicated = ref(false);

const queueUpdated = (q: number): void => {
	indicated.value = q !== 0;
};

const timeline = shallowRef<InstanceType<typeof MkTimeline>>();
</script>
