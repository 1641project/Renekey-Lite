import * as Misskey from 'misskey-js';
import { $i } from '@/account';
import { get as iget, set as iset } from '@/scripts/idb-proxy';
import { removeUndefinedFromObject } from '@/scripts/tms/utils';

const MESSAGE_DRAFTS_KEY = `tmsMessageDrafts:${$i?.id ?? 'unknown'}` as const;

const get = async (): Promise<MessageDraftEntity[]> => (await iget(MESSAGE_DRAFTS_KEY)) ?? [];
const set = async (val: MessageDraftEntity[]): Promise<void> => await iset(MESSAGE_DRAFTS_KEY, val);

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

export const getMessageDraft = async (keyOrObj: MessageDraftKeyOrObj): Promise<MessageDraftEntity | null> => {
	console.log('[getMessageDraft]:', { keyOrObj }); // develop

	const key = _getMessageDraftKey(keyOrObj);
	const messageDrafts = await get();
	return messageDrafts.findLast(pd => pd.key === key) ?? null;
};

export const setMessageDraft = async (keyOrObj: MessageDraftKeyOrObj, params: Omit<MessageDraftEntity, 'key'>): Promise<void> => {
	console.log('[setMessageDraft]:', { keyOrObj, params }); // develop

	const key = _getMessageDraftKey(keyOrObj);
	const messageDrafts = await get();
	const newMessageDrafts = messageDrafts.filter(pd => pd.key !== key);
	newMessageDrafts.push({
		...removeUndefinedFromObject(params),
		key,
	});
	return set(newMessageDrafts);
};

export const updateMessageDraft = async (keyOrObj: MessageDraftKeyOrObj, params: Omit<MessageDraftEntity, 'key'>): Promise<void> => {
	console.log('[updateMessageDraft]:', { keyOrObj, params }); // develop

	const key = _getMessageDraftKey(keyOrObj);
	const messageDrafts = await get();
	const newMessageDrafts = messageDrafts.filter(pd => pd.key !== key);
	newMessageDrafts.push({
		...removeUndefinedFromObject(messageDrafts.findLast(pd => pd.key === key) ?? {}),
		...removeUndefinedFromObject(params),
		key,
	});
	return set(newMessageDrafts);
};

export const deleteMessageDraft = async (keyOrObj: MessageDraftKeyOrObj): Promise<void> => {
	console.log('[deleteMessageDraft]:', { keyOrObj }); // develop

	const key = _getMessageDraftKey(keyOrObj);
	const messageDrafts = await get();
	const newMessageDrafts = messageDrafts.filter(pd => pd.key !== key);
	return set(newMessageDrafts);
};

export const renameMessageDraft = async (oldKeyOrObj: MessageDraftKeyOrObj, newKeyOrObj: MessageDraftKeyOrObj): Promise<void> => {
	console.log('[renameMessageDraft]:', { oldKeyOrObj, newKeyOrObj }); // develop

	const oldKey = _getMessageDraftKey(oldKeyOrObj);
	const newKey = _getMessageDraftKey(newKeyOrObj);
	const messageDrafts = await get();
	const newMessageDrafts = messageDrafts.map(pd => pd.key === oldKey ? { ...pd, key: newKey } : pd);
	return set(newMessageDrafts);
};
