<template>
<XColumn :column="column" :is-stacked="isStacked">
	<template #header><i class="ti ti-at" style="margin-right: 8px;"></i>{{ column.name }}</template>

	<MkNotes :pagination="pagination" no-gap/>
</XColumn>
</template>

<script lang="ts" setup>
import { } from 'vue';
import XColumn from './column.vue';
import { Column } from './deck-store';
import MkNotes from '@/components/MkNotes.vue';

defineProps<{
	column: Column;
	isStacked: boolean;
}>();

const pagination = {
	endpoint: 'notes/mentions' as const,
	limit: 10,
};
</script>
