<template>
<XColumn :column="column" :is-stacked="isStacked" :indicated="indicated">
	<template #header><i class="ti ti-mail" style="margin-right: 8px;"></i>{{ column.name }}</template>

	<MkNotes :pagination="pagination" @queue="queueUpdated"/>
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
	params: {
		visibility: 'specified',
	},
};
</script>
