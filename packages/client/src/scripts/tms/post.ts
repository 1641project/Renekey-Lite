import { noteVisibilities } from 'misskey-js';
import { Note } from 'misskey-js/built/entities';
import { Ref, ref } from 'vue';
import { v4 as uuid } from 'uuid';
import { api } from '@/os';
import { EditedPoll } from '@/components/MkPollEditor.vue';

export const pendingPosts: Ref<PendingPost[]> = ref([]);
export const processedCount = ref(0);
export const totalProcessCount = ref(0);
export const isProcessing = ref(false);

export const enqueuePendingPost = async (postData: ValueOrPromise<PostData>, credential?: string | null): Promise<CallbackResult<Note>> => {
	return new Promise<CallbackResult<Note>>(resolve => {
		const queueId = uuid();
		pendingPosts.value.push({
			queueId,
			postData: Promise.resolve(postData),
			callback: resolve,
			credential: credential ?? null,
		});
		if (!isProcessing.value) processPendingPosts();
	});
};

const processPendingPosts = async () => {
	if (isProcessing.value) return;
	isProcessing.value = true;

	processedCount.value = 0;

	while (pendingPosts.value.length > 0) {
		totalProcessCount.value = pendingPosts.value.length;
		await processPendingPost(pendingPosts.value.shift()!);
		processedCount.value++;
	}

	isProcessing.value = false;
};

const processPendingPost = async ({ postData, callback, credential }: PendingPost): Promise<CallbackResult<Note>> => {
	return new Promise<CallbackResult<Note>>(async resolve => {
		api('notes/create', await postData, credential).then(({ createdNote }) => {
			const result = { canceled: false as const, result: createdNote };
			callback(result);
			resolve(result);
		}).catch((err: unknown) => {
			const result = { canceled: true as const, result: err };
			callback(result);
			resolve(result);
		});;
	})
};

type PendingPost = {
	queueId: string;
	postData: Promise<PostData>;
	callback: (result: CallbackResult<Note>) => void;
	credential: string | null;
};

type PostData = {
	text?: string | null;
	fileIds?: string[];
	replyId?: string | null;
	renoteId?: string | null;
	channelId?: string | null;
	poll?: EditedPoll | null;
	cw?: string | null;
	localOnly?: boolean;
	visibility?: (typeof noteVisibilities)[number];
	visibleUserIds?: string[];
};

type ValueOrPromise<T> = T | Promise<T>;

type CallbackResult<T> = {
	canceled: true;
	result: unknown;
} | {
	canceled: false;
	result: T;
};
