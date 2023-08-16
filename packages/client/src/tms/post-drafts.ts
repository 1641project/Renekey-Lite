import * as Misskey from 'misskey-js';
import { Ref, ref } from 'vue';
import { $i } from '@/account';
import { get, set } from '@/scripts/idb-proxy';
import { deepClone } from '@/scripts/clone';
import { EditedPoll } from '@/components/MkPollEditor.vue';

const POST_DRAFTS_KEY = `tmsPostDrafts:${$i?.id ?? 'unknown'}`;

export type PostDraftEntity = {
	draftId: string;
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

const init = async (): Promise<PostDraftEntity[]> => {
	const gettedDrafts = await get<PostDraftEntity[]>(POST_DRAFTS_KEY);
	if (gettedDrafts) return gettedDrafts;
	set(POST_DRAFTS_KEY, []);
	return [];
};

const postDrafts: Ref<PostDraftEntity[]> = ref(await init());

const getPostDraft = (draftId: string): PostDraftEntity | null => {
	return postDrafts.value.findLast(pd => pd.draftId === draftId) ?? null;
};

const setPostDraft = (draftId: string, params: Omit<PostDraftEntity, 'draftId'>): void => {
	postDrafts.value = postDrafts.value.filter(pd => pd.draftId !== draftId);
	postDrafts.value.push({ ...params, draftId });
	set(POST_DRAFTS_KEY, postDrafts.value);
};

const deletePostDraft = (draftId: string): void => {
	postDrafts.value = postDrafts.value.filter(pd => pd.draftId !== draftId);
	set(POST_DRAFTS_KEY, postDrafts.value);
};

export class PostDraft {
	private readonly _draft: Ref<PostDraftEntity | null>;

	constructor({ draftId }: Pick<PostDraftEntity, 'draftId'>) {
		const matchPostDraft = getPostDraft(draftId);
		if (matchPostDraft) {
			this._draft = ref(deepClone(matchPostDraft));
		} else {
			const newPostDraft: PostDraftEntity = { draftId };
			setPostDraft(draftId, newPostDraft);
			this._draft = ref(deepClone(getPostDraft(draftId)));
		}
	}

	public get(): PostDraftEntity {
		if (!this._draft.value) throw new Error('This PostDraft is closed.');
		return deepClone(this._draft.value);
	}

	public set(params: Omit<PostDraftEntity, 'draftId'>): void {
		if (!this._draft.value) throw new Error('This PostDraft is closed.');
		const clonedParams = deepClone(params);
		this._draft.value = {
			...clonedParams,
			draftId: this._draft.value.draftId,
		};
		setPostDraft(this._draft.value.draftId, this._draft.value);
	}

	public update(params: Omit<PostDraftEntity, 'draftId'>): void {
		if (!this._draft.value) throw new Error('This PostDraft is closed.');
		const clonedParams = deepClone(params);
		this._draft.value = {
			...this._draft.value,
			...clonedParams,
			draftId: this._draft.value.draftId,
		};
		setPostDraft(this._draft.value.draftId, this._draft.value);
	}

	public delete(): void {
		if (!this._draft.value) throw new Error('This PostDraft is closed.');
		deletePostDraft(this._draft.value.draftId);
		this._draft.value = null; // close
	}

	public static genDraftId({ replyId, renoteId, channelId }: {
		replyId?: string;
		renoteId?: string;
		channelId?: string;
	}): string {
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
	}
}
