<template>
<TmsPostFormCore
	v-if="showPostForm"
	ref="form"
	v-bind="bindProps"
	:instant="props.instant"
	:fixed="props.fixed"
	:autofocus="props.autofocus"
	:freeze-after-posted="props.freezeAfterPosted"
	@posted="posted"
	@cancel="cancel"
	@esc="esc"
	@submit="submit"
/>
</template>

<script lang="ts" setup>
import { ref, shallowRef, nextTick, onMounted } from 'vue';
import * as Misskey from 'misskey-js';
import { v4 as uuid } from 'uuid';
import * as os from '@/os';
import { PostDraftEntity, setPostDraft } from '@/tms/post-drafts';
import TmsPostFormCore from '@/components/TmsPostForm.core.vue';

const props = withDefaults(defineProps<{
	reply?: Misskey.entities.Note | null;
	renote?: Misskey.entities.Note | null;
	channel?: Misskey.entities.Channel | null;
	mention?: Misskey.entities.User | null;
	specified?: Misskey.entities.User | null;
	initialText?: string | null;
	initialVisibility?: Misskey.entities.Note['visibility'] | null;
	initialFiles?: Misskey.entities.DriveFile[] | null;
	initialLocalOnly?: boolean | null;
	initialVisibleUsers?: Misskey.entities.User[] | null;
	initialNote?: Misskey.entities.Note | null;
	instant?: boolean | null;
	fixed?: boolean | null;
	autofocus?: boolean | null;
	freezeAfterPosted?: boolean | null;
}>(), {
	reply: null,
	renote: null,
	channel: null,
	mention: null,
	specified: null,
	initialText: null,
	initialVisibility: null,
	initialFiles: null,
	initialLocalOnly: null,
	initialVisibleUsers: null,
	initialNote: null,
	instant: null,
	fixed: null,
	autofocus: true,
	freezeAfterPosted: null,
});

const emit = defineEmits<{
	(ev: 'posted'): void;
	(ev: 'cancel'): void;
	(ev: 'esc'): void;
	(ev: 'submit'): void;
}>();

let bindProps = $ref<{
	draft?: PostDraftEntity | null;
	reply?: Misskey.entities.Note | null;
	renote?: Misskey.entities.Note | null;
	channel?: Misskey.entities.Channel | null;
	mention?: Misskey.entities.User | null;
	specified?: Misskey.entities.User | null;
	initialText?: string | null;
	initialVisibility?: Misskey.entities.Note['visibility'] | null;
	initialFiles?: Misskey.entities.DriveFile[] | null;
	initialLocalOnly?: boolean | null;
	initialVisibleUsers?: Misskey.entities.User[] | null;
}>({
	draft: null,
	reply: props.reply,
	renote: props.renote,
	channel: props.channel,
	mention: props.mention,
	specified: props.specified,
	initialText: props.initialText,
	initialVisibility: props.initialVisibility,
	initialFiles: props.initialFiles,
	initialLocalOnly: props.initialLocalOnly,
	initialVisibleUsers: props.initialVisibleUsers,
});

const form = shallowRef<InstanceType<typeof TmsPostFormCore> | null>(null);

const showPostForm = ref(false);

const shown = (): void => {
	showPostForm.value = true;
};

const hidden = (): void => {
	showPostForm.value = false;
};

onMounted(async () => {
	hidden();

	if (props.initialNote) {
		const init = props.initialNote as Misskey.entities.Note & {
			channel?: Misskey.entities.Channel;
		};

		const postDraft: PostDraftEntity = {
			key: `edit:${uuid()}`,
			text: init.text ?? '',
			useCw: init.cw != null,
			cw: init.cw ?? '',
			visibility: init.visibility,
			localOnly: !!init.localOnly,
			files: init.files,
			poll: init.poll ? {
				choices: init.poll.choices.map(x => x.text),
				multiple: init.poll.multiple,
				expiresAt: init.poll.expiresAt ? Date.parse(init.poll.expiresAt) : null,
				expiredAfter: null,
			} : undefined,
			reply: init.reply,
			renote: init.renote,
			channel: init.channel,
			quote: undefined,
			visibleUsers: init.visibleUserIds?.length ? await os.api('users/show', { userIds: init.visibleUserIds }) : [],
		};

		setPostDraft(postDraft.key, postDraft);

		bindProps.draft = postDraft;
	}

	nextTick(shown);
});

const posted = (): void => {
	emit('posted');
};

const cancel = (): void => {
	emit('cancel');
};

const esc = (): void => {
	emit('esc');
};

const submit = (): void => {
	emit('submit');
};
</script>
