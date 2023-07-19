import { computed, watch, version as vueVersion, App } from 'vue';
import { compareVersions } from 'compare-versions';
import widgets from '@/widgets';
import directives from '@/directives';
import components from '@/components';
import { version, lang, updateLocale } from '@/config';
import { applyTheme } from '@/scripts/theme';
import { isDeviceDarkmode } from '@/scripts/is-device-darkmode';
import { updateI18n, I18nObject } from '@/i18n';
import { $i, refreshAccount, login } from '@/account';
import { defaultStore, ColdDeviceStorage } from '@/store';
import { fetchInstance, instance } from '@/instance';
import { deviceKind } from '@/scripts/device-kind';
import { reloadChannel } from '@/scripts/unison-reload';
import { getUrlWithoutLoginId } from '@/scripts/login-id';
import { getAccountFromId } from '@/scripts/get-account-from-id';
import { deckStore } from '@/ui/deck/deck-store';
import { parseObject } from '@/scripts/tms/parse';

export const common = async (createVue: () => App<Element>): Promise<{
	isClientUpdated: boolean;
	app: App<Element>;
}> => {
	console.info(`Misskey v${version}`);

	if (_DEV_) {
		console.warn('Development mode!!!');

		console.info(`vue ${vueVersion}`);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(window as any).$i = $i;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(window as any).$store = defaultStore;

		window.addEventListener('error', event => {
			console.error(event);
			// alert({
			// 	type: 'error',
			// 	title: 'DEV: Unhandled error',
			// 	text: event.message,
			// });
		});

		window.addEventListener('unhandledrejection', event => {
			console.error(event);
			// alert({
			// 	type: 'error',
			// 	title: 'DEV: Unhandled promise rejection',
			// 	text: event.reason,
			// });
		});
	}

	const splash = document.getElementById('splash');
	// 念のためnullチェック(HTMLが古い場合があるため(そのうち消す))
	if (splash) splash.addEventListener('transitionend', () => {
		splash.remove();
	});

	let isClientUpdated = false;

	//#region クライアントが更新されたかチェック
	const lastVersion = localStorage.getItem('lastVersion');
	if (lastVersion !== version) {
		localStorage.setItem('lastVersion', version);

		// テーマリビルドするため
		localStorage.removeItem('theme');

		try { // 変なバージョン文字列来るとcompareVersionsでエラーになるため
			if (lastVersion != null && compareVersions(version, lastVersion) === 1) {
				isClientUpdated = true;
			}
		} catch (err) { /* empty */ }
	}
	//#endregion

	//#region Detect language & fetch translations
	const localeVersion = localStorage.getItem('localeVersion');
	const localeOutdated = (localeVersion == null || localeVersion !== version);
	if (localeOutdated) {
		const res = await window.fetch(`/assets/locales/${lang}.${version}.json`);
		if (res.status === 200) {
			const newLocale = await res.text();
			const parsedNewLocale = parseObject<I18nObject>(newLocale);
			localStorage.setItem('locale', newLocale);
			localStorage.setItem('localeVersion', version);
			updateLocale(parsedNewLocale);
			updateI18n(parsedNewLocale);
		}
	}
	//#endregion

	// タッチデバイスでCSSの:hoverを機能させる
	document.addEventListener('touchend', () => {}, { passive: true });

	// 一斉リロード
	reloadChannel.addEventListener('message', path => {
		if (path !== null) location.href = path;
		else location.reload();
	});

	//#region SEE: https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
	try {
		if (!window.CSS.supports('height', '1dvh')) throw new Error();
		document.documentElement.style.setProperty('--vh', '1dvh'); // 後方互換
	} catch {
		// fallback (dvh units)
		const setViewportHeight = (): void => {
			const vh = window.innerHeight * 0.01;
			document.documentElement.style.setProperty('--vh', `${vh}px`);
		};
		window.addEventListener('resize', setViewportHeight);
	}
	//#endregion

	// If mobile, insert the viewport meta tag
	if (['smartphone', 'tablet'].includes(deviceKind)) {
		const viewport = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
		if (viewport) {
			viewport.content += ', minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';
		}
	}

	//#region Set lang attr
	const html = document.documentElement;
	html.setAttribute('lang', lang);
	//#endregion

	await defaultStore.ready;
	await deckStore.ready;

	const fetchInstanceMetaPromise = fetchInstance();

	fetchInstanceMetaPromise.then(() => {
		localStorage.setItem('v', instance.version);
	});

	//#region loginId
	const params = new URLSearchParams(location.search);
	const loginId = params.get('loginId');

	if (loginId) {
		const target = getUrlWithoutLoginId(location.href);

		if (!$i || $i.id !== loginId) {
			const account = await getAccountFromId(loginId);
			if (account) {
				await login(account.token, target);
			}
		}

		history.replaceState({ misskey: 'loginId' }, '', target);
	}
	//#endregion

	// NOTE: この処理は必ずクライアント更新チェック処理より後に来ること(テーマ再構築のため)
	watch(defaultStore.reactiveState.darkMode, (darkMode) => {
		applyTheme(darkMode ? ColdDeviceStorage.get('darkTheme') : ColdDeviceStorage.get('lightTheme'));
	}, { immediate: localStorage.getItem('theme') == null });

	const darkTheme = computed(ColdDeviceStorage.makeGetterSetter('darkTheme'));
	const lightTheme = computed(ColdDeviceStorage.makeGetterSetter('lightTheme'));

	watch(darkTheme, (theme) => {
		if (defaultStore.state.darkMode) {
			applyTheme(theme);
		}
	});

	watch(lightTheme, (theme) => {
		if (!defaultStore.state.darkMode) {
			applyTheme(theme);
		}
	});

	//#region Sync dark mode
	if (ColdDeviceStorage.get('syncDeviceDarkMode')) {
		defaultStore.set('darkMode', isDeviceDarkmode());
	}

	window.matchMedia('(prefers-color-scheme: dark)').addListener(mql => {
		if (ColdDeviceStorage.get('syncDeviceDarkMode')) {
			defaultStore.set('darkMode', mql.matches);
		}
	});
	//#endregion

	fetchInstanceMetaPromise.then(() => {
		if (defaultStore.state.themeInitial) {
			if (instance.defaultLightTheme != null) ColdDeviceStorage.set('lightTheme', JSON.parse(instance.defaultLightTheme));
			if (instance.defaultDarkTheme != null) ColdDeviceStorage.set('darkTheme', JSON.parse(instance.defaultDarkTheme));
			defaultStore.set('themeInitial', false);
		}
	});

	watch(defaultStore.reactiveState.useBlurEffectForModal, v => {
		document.documentElement.style.setProperty('--modalBgFilter', v ? 'blur(4px)' : 'none');
	}, { immediate: true });

	watch(defaultStore.reactiveState.useBlurEffect, v => {
		if (v) {
			document.documentElement.style.removeProperty('--blur');
		} else {
			document.documentElement.style.setProperty('--blur', 'none');
		}
	}, { immediate: true });

	//#region Fetch user
	if ($i && $i.token) {
		if (_DEV_) {
			console.log('account cache found. refreshing...');
		}

		refreshAccount();
	}
	//#endregion

	const app = createVue();

	if (_DEV_) {
		app.config.performance = true;
	}

	widgets(app);
	directives(app);
	components(app);

	// https://github.com/misskey-dev/misskey/pull/8575#issuecomment-1114239210
	// なぜか2回実行されることがあるため、mountするdivを1つに制限する
	const rootEl = ((): HTMLElement => {
		const MISSKEY_MOUNT_DIV_ID = 'misskey_app';

		const currentRoot = document.getElementById(MISSKEY_MOUNT_DIV_ID);

		if (currentRoot) {
			console.warn('multiple import detected');
			return currentRoot;
		}

		const root = document.createElement('div');
		root.id = MISSKEY_MOUNT_DIV_ID;
		document.body.appendChild(root);
		return root;
	})();

	app.mount(rootEl);

	// boot.jsのやつを解除
	window.onerror = null;
	window.onunhandledrejection = null;

	removeSplash();

	return {
		isClientUpdated,
		app,
	};
};

const removeSplash = (): void => {
	const splash = document.getElementById('splash');
	if (splash) {
		splash.style.opacity = '0';
		splash.style.pointerEvents = 'none';
	}
};
