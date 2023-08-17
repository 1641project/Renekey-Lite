import * as Misskey from 'misskey-js';
import { $i } from '@/account';
import { get, set } from '@/scripts/idb-proxy';
import { removeUndefinedFromObject } from '@/scripts/tms/utils';
import { EditedPoll } from '@/components/MkPollEditor.vue';

const POST_DRAFTS_KEY = `tmsPostDrafts:${$i?.id ?? 'unknown'}` as const;

export type PostDraftEntity = {
	key: string;
	text?: string;
	useCw?: boolean;
	cw?: string;
	visibility?: (typeof Misskey.noteVisibilities)[number];
	localOnly?: boolean;
	files?: Misskey.entities.DriveFile[];
	poll?: EditedPoll;
	reply?: Misskey.entities.Note;
	renote?: Misskey.entities.Note;
	channel?: Misskey.entities.Channel;
	quote?: Misskey.entities.Note;
	visibleUsers?: Misskey.entities.User[];
};

export type PostDraftKey = string;
export type PostDraftKeyObject = {
	replyId?: string;
	renoteId?: string;
	channelId?: string;
};
export type PostDraftKeyOrObj = PostDraftKey | PostDraftKeyObject;

const _getPostDraftKey = (keyOrObj: PostDraftKeyOrObj): string => {
	console.log('[_getPostDraftKey]:', { keyOrObj }); // develop

	if (typeof keyOrObj === 'string') return keyOrObj;

	const { replyId, renoteId, channelId } = keyOrObj;
	const entries: [string, string | null][] = [];

	if (channelId) {
		entries.push(['ch', channelId]);
	}
	if (renoteId) {
		entries.push(['rn', renoteId]);
	} else if (replyId) {
		entries.push(['re', replyId]);
	} else {
		entries.push(['new', null]);
	}
	return entries.map(([k, v]) => v ? `${k}:${v}` : k).join('/');
};

export const getPostDraft = async (keyOrObj: PostDraftKeyOrObj): Promise<PostDraftEntity | null> => {
	console.log('[getPostDraft]:', { keyOrObj }); // develop

	const key = _getPostDraftKey(keyOrObj);
	const postDrafts = await get<PostDraftEntity[]>(POST_DRAFTS_KEY) ?? [];
	return postDrafts.findLast(pd => pd.key === key) ?? null;
};

export const setPostDraft = async (keyOrObj: PostDraftKeyOrObj, params: Omit<PostDraftEntity, 'key'>): Promise<void> => {
	console.log('[setPostDraft]:', { keyOrObj, params }); // develop

	const key = _getPostDraftKey(keyOrObj);
	const postDrafts = await get<PostDraftEntity[]>(POST_DRAFTS_KEY) ?? [];
	const newPostDrafts = postDrafts.filter(pd => pd.key !== key);
	newPostDrafts.push({
		...removeUndefinedFromObject(params),
		key,
	});
	return set(POST_DRAFTS_KEY, newPostDrafts);
};

export const updatePostDraft = async (keyOrObj: PostDraftKeyOrObj, params: Omit<PostDraftEntity, 'key'>): Promise<void> => {
	console.log('[updatePostDraft]:', { keyOrObj, params }); // develop

	const key = _getPostDraftKey(keyOrObj);
	const postDrafts = await get<PostDraftEntity[]>(POST_DRAFTS_KEY) ?? [];
	const newPostDrafts = postDrafts.filter(pd => pd.key !== key);
	newPostDrafts.push({
		...removeUndefinedFromObject(postDrafts.findLast(pd => pd.key === key) ?? {}),
		...removeUndefinedFromObject(params),
		key,
	});
};

export const deletePostDraft = async (keyOrObj: PostDraftKeyOrObj): Promise<void> => {
	console.log('[deletePostDraft]:', { keyOrObj }); // develop

	const key = _getPostDraftKey(keyOrObj);
	const postDrafts = await get<PostDraftEntity[]>(POST_DRAFTS_KEY) ?? [];
	const newPostDrafts = postDrafts.filter(pd => pd.key !== key);
	return set(POST_DRAFTS_KEY, newPostDrafts);
};

export const renamePostDraft = async (oldKeyOrObj: PostDraftKeyOrObj, newKeyOrObj: PostDraftKeyOrObj): Promise<void> => {
	console.log('[renamePostDraft]:', { oldKeyOrObj, newKeyOrObj }); // develop

	const oldKey = _getPostDraftKey(oldKeyOrObj);
	const newKey = _getPostDraftKey(newKeyOrObj);
	const postDrafts = await get<PostDraftEntity[]>(POST_DRAFTS_KEY) ?? [];
	const newPostDrafts = postDrafts.map(pd => pd.key === oldKey ? { ...pd, key: newKey } : pd);
	return set(POST_DRAFTS_KEY, newPostDrafts);
};
