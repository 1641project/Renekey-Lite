<template>
<XColumn :menu="menu" :column="column" :is-stacked="isStacked" :indicated="indicated" :is-mobile="isMobile">
	<template #icon><i class="ti ti-bell"></i></template>
	<template #header>{{ column.name }}</template>

	<MkNotifications :include-types="column.includingTypes" @queue="queueUpdated"/>
</XColumn>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, ref } from 'vue';
import { notificationTypes } from 'misskey-js';
import XColumn from './column.vue';
import { updateColumn, Column } from './deck-store';
import MkNotifications from '@/components/MkNotifications.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';

const props = defineProps<{
	column: Column;
	isStacked: boolean;
	isMobile: boolean;
}>();

const indicated = ref(false);

const queueUpdated = (q: number): void => {
	indicated.value = q !== 0;
};

const openNotificationSetting = (): void => {
	os.popup(defineAsyncComponent(() => import('@/components/MkNotificationSettingWindow.vue')), {
		includingTypes: props.column.includingTypes,
	}, {
		done: async (res: {
			includingTypes: typeof notificationTypes[number][] | null;
		}) => {
			const { includingTypes } = res;
			updateColumn(props.column.id, {
				includingTypes: includingTypes,
			});
		},
	}, 'closed');
};

const menu = [{
	icon: 'ti ti-pencil',
	text: i18n.ts.notificationSetting,
	action: openNotificationSetting,
}];
</script>
