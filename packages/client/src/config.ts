import { I18nObject } from '@/i18n';
import { parseObject } from '@/scripts/tms/parse';

const address = new URL(location.href);
const siteName = document.querySelector<HTMLMetaElement>('meta[property="og:site_name"]')?.content;

export const host = address.host;
export const hostname = address.hostname;
export const url = address.origin;
export const apiUrl = url + '/api';
export const wsUrl = url.replace('http://', 'ws://').replace('https://', 'wss://') + '/streaming';
export const lang = localStorage.getItem('lang');
export const langs = _LANGS_;
export let locale = parseObject<I18nObject>(localStorage.getItem('locale'));
export const version = _VERSION_;
export const instanceName = siteName === 'Misskey' ? host : siteName;
export const ui = localStorage.getItem('ui');
export const debug = localStorage.getItem('debug') === 'true';

export const updateLocale = (newLocale: I18nObject): void => {
	locale = newLocale;
};
