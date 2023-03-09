const address = new URL(location.href);
const siteName = document.querySelector<HTMLMetaElement>('meta[property="og:site_name"]')?.content;

export const host = address.host;
export const hostname = address.hostname;
export const url = address.origin;
export const apiUrl = url + '/api';
export const wsUrl = url.replace('http://', 'ws://').replace('https://', 'wss://') + '/streaming';
export const lang = localStorage.getItem('lang');
export const langs = _LANGS_;
// TODO: any潰す
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export let locale = JSON.parse(localStorage.getItem('locale') || '{}') as any;
export const version = _VERSION_;
export const instanceName = siteName === 'Misskey' ? host : siteName;
export const ui = localStorage.getItem('ui');
export const debug = localStorage.getItem('debug') === 'true';

// TODO: any潰す
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function updateLocale(newLocale: any): void {
	locale = newLocale;
}
