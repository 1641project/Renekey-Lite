import * as Misskey from 'misskey-js';
import { $i } from '@/account';
import { parseArray } from '@/scripts/tms/parse';
import { removeUndefinedFromObject } from '@/scripts/tms/utils';
import { EditedPoll } from '@/components/MkPollEditor.vue';

const POST_DRAFTS_KEY = `tmsPostDrafts:${$i?.id ?? 'unknown'}` as const;

const get = (): PostDraftEntity[] => parseArray<PostDraftEntity[]>(window.localStorage.getItem(POST_DRAFTS_KEY));
const set = (val: PostDraftEntity[]): void => window.localStorage.setItem(POST_DRAFTS_KEY, JSON.stringify(val));

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

export const getPostDraft = (keyOrObj: PostDraftKeyOrObj): PostDraftEntity | null => {
	console.log('[getPostDraft]:', { keyOrObj }); // develop

	const key = _getPostDraftKey(keyOrObj);
	const postDrafts = get();
	return postDrafts.findLast(pd => pd.key === key) ?? null;
};

export const setPostDraft = (keyOrObj: PostDraftKeyOrObj, params: Omit<PostDraftEntity, 'key'>): void => {
	console.log('[setPostDraft]:', { keyOrObj, params }); // develop

	const key = _getPostDraftKey(keyOrObj);
	const postDrafts = get();
	const newPostDrafts = postDrafts.filter(pd => pd.key !== key);
	newPostDrafts.push({
		...removeUndefinedFromObject(params),
		key,
	});
	return set(newPostDrafts);
};

export const updatePostDraft = (keyOrObj: PostDraftKeyOrObj, params: Omit<PostDraftEntity, 'key'>): void => {
	console.log('[updatePostDraft]:', { keyOrObj, params }); // develop

	const key = _getPostDraftKey(keyOrObj);
	const postDrafts = get();
	const newPostDrafts = postDrafts.filter(pd => pd.key !== key);
	newPostDrafts.push({
		...removeUndefinedFromObject(postDrafts.findLast(pd => pd.key === key) ?? {}),
		...removeUndefinedFromObject(params),
		key,
	});
};

export const deletePostDraft = (keyOrObj: PostDraftKeyOrObj): void => {
	console.log('[deletePostDraft]:', { keyOrObj }); // develop

	const key = _getPostDraftKey(keyOrObj);
	const postDrafts = get();
	const newPostDrafts = postDrafts.filter(pd => pd.key !== key);
	return set(newPostDrafts);
};

export const renamePostDraft = (oldKeyOrObj: PostDraftKeyOrObj, newKeyOrObj: PostDraftKeyOrObj): void => {
	console.log('[renamePostDraft]:', { oldKeyOrObj, newKeyOrObj }); // develop

	const oldKey = _getPostDraftKey(oldKeyOrObj);
	const newKey = _getPostDraftKey(newKeyOrObj);
	const postDrafts = get();
	const newPostDrafts = postDrafts.map(pd => pd.key === oldKey ? { ...pd, key: newKey } : pd);
	return set(newPostDrafts);
};
