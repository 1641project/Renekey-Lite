// FirefoxのプライベートモードなどではindexedDBが使用不可能なので、
// indexedDBが使えない環境ではlocalStorageを使う
import {
	get as iget,
	set as iset,
	del as idel,
} from 'idb-keyval';

const fallbackName = (key: string): string => `idbfallback::${key}`;

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
let idbAvailable = (typeof window !== 'undefined' ? !!(window.indexedDB && window.indexedDB.open) : true) as boolean;

if (idbAvailable) {
	await iset('idb-test', 'test')
		.catch(err => {
			console.error('idb error', err);
			console.error('indexedDB is unavailable. It will use localStorage.');
			idbAvailable = false;
		});
} else {
	console.error('indexedDB is unavailable. It will use localStorage.');
}

export const get = async <T>(key: string): Promise<T | undefined> => {
	if (idbAvailable) return iget<T>(key);
	const raw = window.localStorage.getItem(fallbackName(key));
	return raw ? JSON.parse(raw) as T : undefined;
};

export const set = async (key: string, val: unknown): Promise<void> => {
	if (idbAvailable) return iset(key, val);
	return window.localStorage.setItem(fallbackName(key), JSON.stringify(val));
};

export const del = async (key: string): Promise<void> => {
	if (idbAvailable) return idel(key);
	return window.localStorage.removeItem(fallbackName(key));
};
