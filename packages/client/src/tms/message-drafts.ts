import * as Misskey from 'misskey-js';
import { Ref, ref } from 'vue';
import { $i } from '@/account';
import { get, set } from '@/scripts/idb-proxy';
import { deepClone } from '@/scripts/clone';

const MESSAGE_DRAFTS_KEY = `tmsMessageDrafts:${$i?.id ?? 'unknown'}`;

export type MessageDraftEntity = {
	draftId: string;
	text?: string;
	file?: Misskey.entities.DriveFile | null;
};

const init = async (): Promise<MessageDraftEntity[]> => {
	const gettedDrafts = await get<MessageDraftEntity[]>(MESSAGE_DRAFTS_KEY);
	if (gettedDrafts) return gettedDrafts;
	set(MESSAGE_DRAFTS_KEY, []);
	return [];
};

const messageDrafts: Ref<MessageDraftEntity[]> = ref(await init());

const getMessageDraft = (draftId: string): MessageDraftEntity | null => {
	return messageDrafts.value.findLast(pd => pd.draftId === draftId) ?? null;
};

const setMessageDraft = (draftId: string, params: Omit<MessageDraftEntity, 'draftId'>): void => {
	messageDrafts.value = messageDrafts.value.filter(pd => pd.draftId !== draftId);
	messageDrafts.value.push({ ...params, draftId });
	set(MESSAGE_DRAFTS_KEY, messageDrafts.value);
};

const deleteMessageDraft = (draftId: string): void => {
	messageDrafts.value = messageDrafts.value.filter(pd => pd.draftId !== draftId);
	set(MESSAGE_DRAFTS_KEY, messageDrafts.value);
};

export class MessageDraft {
	private readonly _draft: Ref<MessageDraftEntity | null>;

	constructor({ draftId }: Pick<MessageDraftEntity, 'draftId'>) {
		const matchMessageDraft = getMessageDraft(draftId);
		if (matchMessageDraft) {
			this._draft = ref(deepClone(matchMessageDraft));
		} else {
			const newMessageDraft: MessageDraftEntity = { draftId };
			setMessageDraft(draftId, newMessageDraft);
			this._draft = ref(deepClone(getMessageDraft(draftId)));
		}
	}

	public get(): MessageDraftEntity {
		if (!this._draft.value) throw new Error('This MessageDraft is closed.');
		return deepClone(this._draft.value);
	}

	public set(params: Omit<MessageDraftEntity, 'draftId'>): void {
		if (!this._draft.value) throw new Error('This MessageDraft is closed.');
		const clonedParams = deepClone(params);
		this._draft.value = {
			...clonedParams,
			draftId: this._draft.value.draftId,
		};
		setMessageDraft(this._draft.value.draftId, this._draft.value);
	}

	public update(params: Omit<MessageDraftEntity, 'draftId'>): void {
		if (!this._draft.value) throw new Error('This MessageDraft is closed.');
		const clonedParams = deepClone(params);
		this._draft.value = {
			...this._draft.value,
			...clonedParams,
			draftId: this._draft.value.draftId,
		};
		setMessageDraft(this._draft.value.draftId, this._draft.value);
	}

	public delete(): void {
		if (!this._draft.value) throw new Error('This MessageDraft is closed.');
		deleteMessageDraft(this._draft.value.draftId);
		this._draft.value = null; // close
	}

	public static genDraftId({ userId, groupId }: {
		userId?: string;
		groupId?: string;
	}): string {
		const entries: [string, string | null][] = [];
		if (userId) {
			entries.push(['user', userId]);
		} else if (groupId) {
			entries.push(['group', groupId]);
		} else {
			entries.push(['unknown', null]);
		}
		return entries.map(([k, v]) => v ? `${k}:${v}` : k).join('/');
	}
}
