<template>
<XColumn :menu="menu" :column="column" :is-stacked="isStacked" :indicated="indicated">
	<template #icon><i class="ti ti-antenna"></i></template>
	<template #header>{{ column.name }}</template>

	<MkTimeline v-if="column.antennaId" ref="timeline" src="antenna" :antenna="column.antennaId" @queue="queueUpdated"/>
</XColumn>
</template>

<script lang="ts" setup>
import { onMounted, ref, shallowRef } from 'vue';
import XColumn from './column.vue';
import { updateColumn, Column } from './deck-store';
import MkTimeline from '@/components/MkTimeline.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';

const props = defineProps<{
	column: Column;
	isStacked: boolean;
}>();

const indicated = ref(false);

const queueUpdated = (q: number): void => {
	indicated.value = q !== 0;
};

const timeline = shallowRef<InstanceType<typeof MkTimeline>>();

onMounted(() => {
	if (props.column.antennaId == null) {
		setAntenna();
	}
});

const setAntenna = async (): Promise<void> => {
	const antennas = await os.api('antennas/list');

	const { canceled, result: antenna } = await os.select({
		title: i18n.ts.selectAntenna,
		items: antennas.map(x => ({
			value: x,
			text: x.name,
		})),
		default: props.column.antennaId,
	});
	if (canceled) return;

	updateColumn(props.column.id, {
		antennaId: antenna.id,
	});
};

const editAntenna = (): void => {
	os.pageWindow(`my/antennas/${props.column.antennaId}`);
};

const menu = [
	{
		icon: 'ti ti-pencil',
		text: i18n.ts.selectAntenna,
		action: setAntenna,
	},
	{
		icon: 'ti ti-settings',
		text: i18n.ts.editAntenna,
		action: editAntenna,
	},
];

// const focus = (): void => {
// 	timeline.value?.focus();
// };

// defineExpose({
// 	focus,
// });
</script>
