<template>
<XColumn :column="column" :is-stacked="isStacked" :indicated="indicated" :is-mobile="isMobile">
	<template #icon><i class="ti ti-mail"></i></template>
	<template #header>{{ column.name }}</template>

	<MkTimeline ref="timeline" src="directs" @queue="queueUpdated"/>
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
	isMobile: boolean;
}>();

const indicated = ref(false);

const queueUpdated = (q: number): void => {
	indicated.value = q !== 0;
};

const timeline = shallowRef<InstanceType<typeof MkTimeline>>();
</script>
