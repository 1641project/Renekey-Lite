<template>
<XColumn :menu="menu" :column="column" :is-stacked="isStacked">
	<template #header>
		<i class="ti ti-list"></i><span style="margin-left: 8px;">{{ column.name }}</span>
	</template>

	<MkTimeline v-if="column.listId" ref="timeline" src="list" :list="column.listId"/>
</XColumn>
</template>

<script lang="ts" setup>
import { } from 'vue';
import XColumn from './column.vue';
import { updateColumn, Column } from './deck-store';
import MkTimeline from '@/components/MkTimeline.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';

const props = defineProps<{
	column: Column;
	isStacked: boolean;
}>();

const timeline = $shallowRef<InstanceType<typeof MkTimeline>>();

const setList = async (): Promise<void> => {
	const lists = await os.api('users/lists/list');

	const { canceled, result: list } = await os.select({
		title: i18n.ts.selectList,
		items: lists.map(x => ({
			value: x, text: x.name,
		})),
		default: props.column.listId,
	});
	if (canceled) return;

	updateColumn(props.column.id, {
		listId: list.id,
	});
};

const editList = (): void => {
	os.pageWindow('my/lists/' + props.column.listId);
};

if (props.column.listId == null) {
	setList();
}

const menu = [
	{
		icon: 'ti ti-pencil',
		text: i18n.ts.selectList,
		action: setList,
	},
	{
		icon: 'ti ti-settings',
		text: i18n.ts.editList,
		action: editList,
	},
];
</script>
