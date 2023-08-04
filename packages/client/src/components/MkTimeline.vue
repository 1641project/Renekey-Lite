<template>
<MkNotes ref="tlComponent" :no-gap="!defaultStore.state.showGapBetweenNotesInTimeline" :pagination="pagination" @queue="emit('queue', $event)"/>
</template>

<script lang="ts" setup>
import { computed, provide, onUnmounted, ref } from 'vue';
import * as Misskey from 'misskey-js';
import MkNotes from '@/components/MkNotes.vue';
import { useStream } from '@/stream';
import * as sound from '@/scripts/sound';
import { $i } from '@/account';
import { defaultStore } from '@/store';

const props = defineProps<{
	src: string;
	list?: string;
	antenna?: string;
	channel?: string;
	sound?: boolean;
}>();

const emit = defineEmits<{
	(ev: 'note'): void;
	(ev: 'queue', count: number): void;
}>();

provide('inChannel', computed(() => props.src === 'channel'));

const tlComponent = ref<InstanceType<typeof MkNotes>>();

const prepend = (note: Misskey.entities.Note): void => {
	tlComponent.value?.pagingComponent?.prepend(note);

	emit('note');

	if (props.sound) {
		sound.play($i && (note.userId === $i.id) ? 'noteMy' : 'note');
	}
};

type Endpoints = keyof Misskey.Endpoints;
type EndpointReq<T extends Endpoints> = Misskey.Endpoints[T]['req'];

let endpoint: Endpoints | null = null;
let query: EndpointReq<Endpoints> | null = null;
let connection: Misskey.ChannelConnection | null = null;
let connection2: Misskey.ChannelConnection | null = null;

const stream = useStream();

if (props.src === 'antenna') {
	endpoint = 'antennas/notes' as const;
	query = {
		antennaId: props.antenna,
	};
	connection = stream.useChannel('antenna', {
		antennaId: props.antenna,
	});
	connection.on('note', prepend);
} else if (props.src === 'home') {
	endpoint = 'notes/timeline' as const;
	connection = stream.useChannel('homeTimeline');
	connection.on('note', prepend);

	connection2 = stream.useChannel('main');
} else if (props.src === 'local') {
	endpoint = 'notes/local-timeline' as const;
	connection = stream.useChannel('localTimeline');
	connection.on('note', prepend);
} else if (props.src === 'social') {
	endpoint = 'notes/hybrid-timeline' as const;
	connection = stream.useChannel('hybridTimeline');
	connection.on('note', prepend);
} else if (props.src === 'global') {
	endpoint = 'notes/global-timeline' as const;
	connection = stream.useChannel('globalTimeline');
	connection.on('note', prepend);
} else if (props.src === 'mentions') {
	endpoint = 'notes/mentions' as const;
	connection = stream.useChannel('main');
	connection.on('mention', prepend);
} else if (props.src === 'directs') {
	endpoint = 'notes/mentions' as const;
	query = {
		visibility: 'specified',
	};
	const onNote = (note: Misskey.entities.Note): void => {
		if (note.visibility === 'specified') {
			prepend(note);
		}
	};
	connection = stream.useChannel('main');
	connection.on('mention', onNote);
} else if (props.src === 'list') {
	endpoint = 'notes/user-list-timeline' as const;
	query = {
		listId: props.list,
	};
	connection = stream.useChannel('userList', {
		listId: props.list,
	});
	connection.on('note', prepend);
} else if (props.src === 'channel') {
	endpoint = 'channels/timeline' as const;
	query = {
		channelId: props.channel,
	};
	connection = stream.useChannel('channel', {
		channelId: props.channel,
	});
	connection.on('note', prepend);
}

if (!endpoint) {
	throw new Error();
}

const pagination = {
	endpoint: endpoint,
	limit: 10,
	params: query,
};

onUnmounted(() => {
	connection?.dispose();
	connection = null;
	connection2?.dispose();
	connection2 = null;
});

// const timetravel = (date?: Date) => {
// 	this.date = date;
// 	this.$refs.tl.reload();
// };
</script>
