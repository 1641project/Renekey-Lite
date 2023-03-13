import { defaultStore } from '@/store';
import { tmsStore } from '@/tms/store';

type State = typeof tmsStore.state;

const getter = <T = unknown>(key: string): T | undefined => defaultStore.state[key];
const setter = <K extends keyof State>(key: K, val: State[K]): void => tmsStore.set(key, val);

const migrate = <K extends keyof State>(oldKey: string, newKey: K): void => {
	const oldVal = getter<State[K]>(oldKey);
	if (typeof oldVal !== 'undefined') {
		setter(newKey, oldVal);
	}
};
const check = <K extends keyof State>(oldKey: string): boolean => {
	return typeof getter<State[K]>(oldKey) !== 'undefined';
};

export const tmsMigration = (): void => {
	if (tmsMigrationCheck()) return;

	migrate('tmsVerticalInstanceTicker', 'verticalInstanceTicker');
	migrate('tmsUseReactionMenu', 'useReactionMenu');
	migrate('tmsIsLongEnabled', 'collapseNote');
	migrate('tmsIsLongTextElHeight', 'collapseNoteHeight');
	migrate('tmsIsLongFilesLength', 'collapseNoteFile');
	migrate('tmsIsLongUrlsLength', 'collapseNoteUrl');
	migrate('tmsIsLongPollLength', 'collapseNotePoll');
	migrate('tmsRenoteCollapsedEnabled', 'collapseRenote');
	migrate('tmsPakuruEnabled', 'usePakuru');
	migrate('tmsNumberquoteEnabled', 'useNumberquote');
	migrate('tmsImanonashiEnabled', 'useImanonashi');
	migrate('tmsImanonashiWords', 'imanonashiWords');
	migrate('tmsImanonashiConfirmEnabled', 'imanonashiConfirm');
	migrate('tmsImanonashiDeleteEnabled', 'imanonashiItself');

	setter('migrated', true);
	setter('doNotMigrate', true);
};

export const tmsMigrationCheck = (): boolean => {
	if (tmsStore.state.migrated) return false;
	if (tmsStore.state.doNotMigrate) return false;

	const keys = [
		'tmsVerticalInstanceTicker',
		'tmsUseReactionMenu',
		'tmsIsLongEnabled',
		'tmsIsLongTextElHeight',
		'tmsIsLongFilesLength',
		'tmsIsLongUrlsLength',
		'tmsIsLongPollLength',
		'tmsRenoteCollapsedEnabled',
		'tmsPakuruEnabled',
		'tmsNumberquoteEnabled',
		'tmsImanonashiEnabled',
		'tmsImanonashiWords',
		'tmsImanonashiConfirmEnabled',
		'tmsImanonashiDeleteEnabled',
	];
	
	if (keys.some(key => check(key))) return true;

	setter('migrated', true);
	setter('doNotMigrate', true);
	return false;
};
