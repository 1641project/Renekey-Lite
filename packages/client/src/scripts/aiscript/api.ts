import * as AiScript from '@syuilo/aiscript';
import * as AiScriptNext from '@syuilo/aiscript-next';
import * as os from '@/os';
import { $i } from '@/account';
import { instance } from '@/instance';
import { Plugin } from '@/store';

export const createAiScriptEnv = (opts: {
	plugin: Plugin;
	storageKey: string;
	token: string;
}) => {
	const { values, utils } = opts.plugin.isNext ? AiScriptNext : AiScript;
	let apiRequests = 0;
	return {
		USER_ID: $i ? values.STR($i.id) : values.NULL,
		USER_NAME: $i ? values.STR($i.name) : values.NULL,
		USER_USERNAME: $i ? values.STR($i.username) : values.NULL,
		CUSTOM_EMOJIS: utils.jsToVal(instance.emojis ?? []),
		CURRENT_URL: values.STR(window.location.href),
		'Mk:dialog': values.FN_NATIVE(async ([title, text, type]: any[]) => {
			await os.alert({
				type: type ? type.value : 'info',
				title: title.value,
				text: text.value,
				allowMfm: true,
			});
			return values.NULL;
		}),
		'Mk:confirm': values.FN_NATIVE(async ([title, text, type]: any[]) => {
			const confirm = await os.confirm({
				type: type ? type.value : 'question',
				title: title.value,
				text: text.value,
				allowMfm: true,
			});
			return confirm.canceled ? values.FALSE : values.TRUE;
		}),
		'Mk:api': values.FN_NATIVE(async ([ep, param, token]: any[]) => {
			if (token) {
				utils.assertString(token);
				// バグがあればundefinedもあり得るため念のため
				if (typeof token.value !== 'string') throw new Error('invalid token');
			}
			apiRequests++;
			if (apiRequests > 16) return values.NULL;
			const res = await os.api(ep.value, utils.valToJs(param), token ? token.value : (opts.token ?? null));
			return utils.jsToVal(res) as any;
		}),
		'Mk:save': values.FN_NATIVE(([key, value]: any[]) => {
			utils.assertString(key);
			localStorage.setItem(`aiscript:${opts.storageKey}:${key.value}`, JSON.stringify(utils.valToJs(value)));
			return values.NULL;
		}),
		'Mk:load': values.FN_NATIVE(([key]: any[]) => {
			utils.assertString(key);
			return utils.jsToVal(JSON.parse(localStorage.getItem(`aiscript:${opts.storageKey}:${key.value}`)!)) as any;
		}),
	};
};
