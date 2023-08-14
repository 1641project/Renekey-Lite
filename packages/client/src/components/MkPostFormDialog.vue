<template>
<MkModal
	ref="modal"
	prefer-type="dialog"
	@click="onClick"
	@close="onModalClose()"
	@closed="onModalClosed()"
>
	<TmsPostForm
		ref="form"
		style="margin: 0 auto auto auto;"
		v-bind="props"
		autofocus
		freeze-after-posted
		@posted="onPosted"
		@cancel="modal?.close()"
		@esc="modal?.close()"
		@submit="onPosted"
	/>
</MkModal>
</template>

<script lang="ts" setup>
import { shallowRef } from 'vue';
import * as Misskey from 'misskey-js';
import MkModal from '@/components/MkModal.vue';
import TmsPostForm from '@/components/TmsPostForm.vue';

const props = defineProps<{
	reply?: Misskey.entities.Note;
	renote?: Misskey.entities.Note;
	channel?: Misskey.entities.Channel; // TODO
	mention?: Misskey.entities.User;
	specified?: Misskey.entities.User;
	initialText?: string;
	initialVisibility?: 'public' | 'home' | 'followers' | 'specified';
	initialFiles?: Misskey.entities.DriveFile[];
	initialLocalOnly?: boolean;
	initialVisibleUsers?: Misskey.entities.User[];
	initialNote?: Misskey.entities.Note;
	instant?: boolean;
	fixed?: boolean;
	autofocus?: boolean;
}>();

const emit = defineEmits<{
	(ev: 'close'): void;
	(ev: 'closed'): void;
}>();

const modal = shallowRef<InstanceType<typeof MkModal>>();
const form = shallowRef<InstanceType<typeof TmsPostForm>>();

const onClick = (): void => {
	modal.value?.close();
};

const onPosted = (): void => {
	modal.value?.close({
		useSendAnimation: true,
	});
};

const onModalClose = (): void => {
	emit('close');
};

const onModalClosed = (): void => {
	emit('closed');
};
</script>
