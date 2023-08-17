import * as Misskey from 'misskey-js';
import { $i } from '@/account';
import { parseArray } from '@/scripts/tms/parse';
import { removeUndefinedFromObject } from '@/scripts/tms/utils';

const MESSAGE_DRAFTS_KEY = `tmsMessageDrafts:${$i?.id ?? 'unknown'}` as const;

const get = (): MessageDraftEntity[] => parseArray<MessageDraftEntity[]>(window.localStorage.getItem(MESSAGE_DRAFTS_KEY));
const set = (val: MessageDraftEntity[]): void => window.localStorage.setItem(MESSAGE_DRAFTS_KEY, JSON.stringify(val));

export type MessageDraftEntity = {
	key: string;
	text?: string;
	file?: Misskey.entities.DriveFile | null;
};

export type MessageDraftKey = string;
export type MessageDraftKeyObject = {
	userId?: string;
	groupId?: string;
};
export type MessageDraftKeyOrObj = MessageDraftKey | MessageDraftKeyObject;

const _getMessageDraftKey = (keyOrObj: MessageDraftKeyOrObj): string => {
	console.log('[_getMessageDraftKey]:', { keyOrObj }); // develop

	if (typeof keyOrObj === 'string') return keyOrObj;

	const { userId, groupId } = keyOrObj;
	const entries: [string, string | null][] = [];

	if (userId) {
		entries.push(['user', userId]);
	} else if (groupId) {
		entries.push(['group', groupId]);
	} else {
		entries.push(['unknown', null]);
	}
	return entries.map(([k, v]) => v ? `${k}:${v}` : k).join('/');
};

export const getMessageDraft = (keyOrObj: MessageDraftKeyOrObj): MessageDraftEntity | null => {
	console.log('[getMessageDraft]:', { keyOrObj }); // develop

	const key = _getMessageDraftKey(keyOrObj);
	const messageDrafts = get();
	return messageDrafts.findLast(pd => pd.key === key) ?? null;
};

export const setMessageDraft = (keyOrObj: MessageDraftKeyOrObj, params: Omit<MessageDraftEntity, 'key'>): void => {
	console.log('[setMessageDraft]:', { keyOrObj, params }); // develop

	const key = _getMessageDraftKey(keyOrObj);
	const messageDrafts = get();
	const newMessageDrafts = messageDrafts.filter(pd => pd.key !== key);
	newMessageDrafts.push({
		...removeUndefinedFromObject(params),
		key,
	});
	return set(newMessageDrafts);
};

export const updateMessageDraft = (keyOrObj: MessageDraftKeyOrObj, params: Omit<MessageDraftEntity, 'key'>): void => {
	console.log('[updateMessageDraft]:', { keyOrObj, params }); // develop

	const key = _getMessageDraftKey(keyOrObj);
	const messageDrafts = get();
	const newMessageDrafts = messageDrafts.filter(pd => pd.key !== key);
	newMessageDrafts.push({
		...removeUndefinedFromObject(messageDrafts.findLast(pd => pd.key === key) ?? {}),
		...removeUndefinedFromObject(params),
		key,
	});
};

export const deleteMessageDraft = (keyOrObj: MessageDraftKeyOrObj): void => {
	console.log('[deleteMessageDraft]:', { keyOrObj }); // develop

	const key = _getMessageDraftKey(keyOrObj);
	const messageDrafts = get();
	const newMessageDrafts = messageDrafts.filter(pd => pd.key !== key);
	return set(newMessageDrafts);
};

export const renameMessageDraft = (oldKeyOrObj: MessageDraftKeyOrObj, newKeyOrObj: MessageDraftKeyOrObj): void => {
	console.log('[renameMessageDraft]:', { oldKeyOrObj, newKeyOrObj }); // develop

	const oldKey = _getMessageDraftKey(oldKeyOrObj);
	const newKey = _getMessageDraftKey(newKeyOrObj);
	const messageDrafts = get();
	const newMessageDrafts = messageDrafts.map(pd => pd.key === oldKey ? { ...pd, key: newKey } : pd);
	return set(newMessageDrafts);
};
