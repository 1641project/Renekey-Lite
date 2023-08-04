<template>
<XColumn :column="column" :is-stacked="isStacked" :indicated="indicated">
	<template #icon><i class="ti ti-at"></i></template>
	<template #header>{{ column.name }}</template>

	<MkNotes :pagination="pagination" no-gap @queue="queueUpdated"/>
</XColumn>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import XColumn from './column.vue';
import { Column } from './deck-store';
import MkNotes from '@/components/MkNotes.vue';

defineProps<{
	column: Column;
	isStacked: boolean;
}>();

const indicated = ref(false);

const queueUpdated = (q: number): void => {
	indicated.value = q !== 0;
};

const pagination = {
	endpoint: 'notes/mentions' as const,
	limit: 10,
};
</script>
