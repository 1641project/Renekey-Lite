<template>
<XColumn :menu="menu" :column="column" :is-stacked="isStacked">
	<template #header>
		<i class="ti ti-device-tv"></i><span style="margin-left: 8px;">{{ column.name }}</span>
	</template>

	<template v-if="column.channelId">
		<div style="padding: 8px; text-align: center;">
			<MkButton primary gradate rounded inline @click="post"><i class="ti ti-pencil"></i></MkButton>
		</div>
		<MkTimeline ref="timeline" src="channel" :channel="column.channelId"/>
	</template>
</XColumn>
</template>

<script lang="ts" setup>
import { } from 'vue';
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
}>();

const timeline = $shallowRef<InstanceType<typeof MkTimeline>>();
let channel = $shallowRef<Misskey.entities.Channel>();

const setChannel = async (): Promise<void> => {
	const channels = await os.api('channels/followed', {
		limit: 100,
	});

	const { canceled, result: channel_ } = await os.select({
		title: i18n.ts.selectChannel,
		items: channels.map(x => ({
			value: x, text: x.name,
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
	if (!channel || channel.id !== props.column.channelId) {
		channel = await os.api('channels/show', {
			channelId: props.column.channelId,
		});
	}

	os.post({
		channel,
	});
};

if (props.column.channelId == null) {
	setChannel();
}

const menu = [{
	icon: 'ti ti-pencil',
	text: i18n.ts.selectChannel,
	action: setChannel,
}];
</script>
