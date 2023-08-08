<template>
<XColumn :menu="menu" :column="column" :is-stacked="isStacked" :indicated="indicated" :is-mobile="isMobile">
	<template #icon><i class="ti ti-device-tv"></i></template>
	<template #header>{{ column.name }}</template>

	<template v-if="column.channelId">
		<div style="padding: 8px; text-align: center;">
			<MkButton primary gradate rounded inline @click="post"><i class="ti ti-pencil"></i></MkButton>
		</div>
		<MkTimeline ref="timeline" src="channel" :channel="column.channelId" @queue="queueUpdated"/>
	</template>
</XColumn>
</template>

<script lang="ts" setup>
import { onMounted, ref, shallowRef } from 'vue';
import * as Misskey from 'misskey-js';
import XColumn from './column.vue';
import { updateColumn, Column } from './deck-store';
import MkTimeline from '@/components/MkTimeline.vue';
import MkButton from '@/components/MkButton.vue';
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

const timeline = shallowRef<InstanceType<typeof MkTimeline>>();
const channel = shallowRef<Misskey.entities.Channel | null>(null);

onMounted(() => {
	if (props.column.channelId == null) {
		setChannel();
	}
});

const setChannel = async (): Promise<void> => {
	const channels = await os.api('channels/followed', {
		limit: 100,
	}) as any[];

	const { canceled, result: channel_ } = await os.select({
		title: i18n.ts.selectChannel,
		items: channels.map(x => ({
			value: x,
			text: x.name,
		})),
		default: props.column.channelId,
	});
	if (canceled) return;

	updateColumn(props.column.id, {
		channelId: channel_.id,
		name: channel_.name,
	});
};

const post = async (): Promise<void> => {
	if (!channel.value || channel.value.id !== props.column.channelId) {
		channel.value = await os.api('channels/show', {
			channelId: props.column.channelId,
		}) as any;
	}

	os.post({
		channel: channel.value,
	});
};

const menu = [{
	icon: 'ti ti-pencil',
	text: i18n.ts.selectChannel,
	action: setChannel,
}];
</script>
