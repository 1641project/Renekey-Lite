import * as AiScript from '@syuilo/aiscript';
import { deserialize } from '@syuilo/aiscript/built/serializer';
import * as AiScriptNext from '@syuilo/aiscript-next';
import { Parser } from '@syuilo/aiscript-next';
import { createAiScriptEnv } from '@/scripts/aiscript/api';
import { inputText } from '@/os';
import { Plugin, noteActions, notePostInterruptors, noteViewInterruptors, postFormActions, userActions } from '@/store';

export const AISCRIPT_VERSION = '0.11.1';
export const AISCRIPT_NEXT_VERSION = '0.14.1';

const parser = new Parser();

type PluginContext = {
	interpreter: AiScript.AiScript;
	isNext: false;
} | {
	interpreter: AiScriptNext.Interpreter;
	isNext: true;
};
const pluginContexts = new Map<string, PluginContext>();

export const install = (plugin: Plugin): void => {
	if (plugin.isNext && plugin.src == null) return;

	console.info('Plugin installed:', plugin.name, `v${plugin.version}`, `(AiScript v${plugin.isNext ? AISCRIPT_NEXT_VERSION : AISCRIPT_VERSION})`);

	const storageKey = `plugins:${plugin.id}`;
	const interpreterOptions = {
		in: (q: string): Promise<string> => {
			return new Promise(ok => {
				inputText({
					title: q,
				}).then(({ canceled, result: a }) => {
					if (canceled) {
						ok('');
					} else {
						ok(a);
					}
				});
			});
		},
		out: (value: unknown): void => {
			console.log(value);
		},
		log: (): void => {},
	};

	const interpreter = plugin.isNext
		? new AiScriptNext.Interpreter(createPluginEnv({ plugin, storageKey }), interpreterOptions)
		: new AiScript.AiScript(createPluginEnv({ plugin, storageKey }), interpreterOptions);

	initPlugin({ plugin, interpreter });

	if (plugin.isNext) {
		(interpreter as AiScriptNext.Interpreter).exec(parser.parse(plugin.src!));
	} else {
		(interpreter as AiScript.AiScript).exec(deserialize(plugin.ast));
	}
};

const createPluginEnv = (opts: { plugin: Plugin; storageKey: string }): Record<string, AiScriptNext.values.Value | AiScript.values.Value> => {
	const { values, utils } = opts.plugin.isNext ? AiScriptNext : AiScript;

	const config = new Map<string, AiScriptNext.values.Value | AiScript.values.Value>();
	for (const [k, v] of Object.entries(opts.plugin.config ?? {})) {
		config.set(k, utils.jsToVal(typeof opts.plugin.configData[k] !== 'undefined' ? opts.plugin.configData[k] : v.default));
	}

	return {
		...createAiScriptEnv({ ...opts, token: opts.plugin.token }),
		//#region Deprecated
		'Mk:register_post_form_action': values.FN_NATIVE(([title, handler]: any[]) => {
			utils.assertString(title);
			utils.assertFunction(handler);
			registerPostFormAction({ pluginId: opts.plugin.id, title: title.value, handler });
		}),
		'Mk:register_user_action': values.FN_NATIVE(([title, handler]: any[]) => {
			utils.assertString(title);
			utils.assertFunction(handler);
			registerUserAction({ pluginId: opts.plugin.id, title: title.value, handler });
		}),
		'Mk:register_note_action': values.FN_NATIVE(([title, handler]: any[]) => {
			utils.assertString(title);
			utils.assertFunction(handler);
			registerNoteAction({ pluginId: opts.plugin.id, title: title.value, handler });
		}),
		//#endregion
		'Plugin:register_post_form_action': values.FN_NATIVE(([title, handler]: any[]) => {
			utils.assertString(title);
			utils.assertFunction(handler);
			registerPostFormAction({ pluginId: opts.plugin.id, title: title.value, handler });
		}),
		'Plugin:register_user_action': values.FN_NATIVE(([title, handler]: any[]) => {
			utils.assertString(title);
			utils.assertFunction(handler);
			registerUserAction({ pluginId: opts.plugin.id, title: title.value, handler });
		}),
		'Plugin:register_note_action': values.FN_NATIVE(([title, handler]: any[]) => {
			utils.assertString(title);
			utils.assertFunction(handler);
			registerNoteAction({ pluginId: opts.plugin.id, title: title.value, handler });
		}),
		'Plugin:register_note_view_interruptor': values.FN_NATIVE(([handler]: any[]) => {
			utils.assertFunction(handler);
			registerNoteViewInterruptor({ pluginId: opts.plugin.id, handler });
		}),
		'Plugin:register_note_post_interruptor': values.FN_NATIVE(([handler]: any[]) => {
			utils.assertFunction(handler);
			registerNotePostInterruptor({ pluginId: opts.plugin.id, handler });
		}),
		'Plugin:open_url': values.FN_NATIVE(([url]: any[]) => {
			utils.assertString(url);
			window.open(url.value, '_blank');
		}),
		'Plugin:config': values.OBJ(config as any),
	};
};

const initPlugin = ({ plugin, interpreter }: {
	plugin: Plugin;
	interpreter: AiScriptNext.Interpreter | AiScript.AiScript;
}): void => {
	const context = { interpreter, isNext: !!plugin.isNext } as PluginContext;
	pluginContexts.set(plugin.id, context);
};

const registerPostFormAction = ({ pluginId, title, handler }: {
	pluginId: string;
	title: string;
	handler: AiScriptNext.values.VFn | AiScript.values.VFn;
}): void => {
	postFormActions.push({
		title, handler: (form, update) => {
			const pluginContext = pluginContexts.get(pluginId);
			if (!pluginContext) return;

			const { interpreter, isNext } = pluginContext;
			const { values, utils } = isNext ? AiScriptNext : AiScript;

			interpreter.execFn(handler as any, [utils.jsToVal(form), values.FN_NATIVE(([key, value]: any[]) => {
				if (!key || !value) return;
				update(utils.valToJs(key), utils.valToJs(value));
			})] as any[]);
		},
	});
};

const registerUserAction = ({ pluginId, title, handler }: {
	pluginId: string;
	title: string;
	handler: AiScriptNext.values.VFn | AiScript.values.VFn;
}): void => {
	userActions.push({
		title, handler: (user) => {
			const pluginContext = pluginContexts.get(pluginId);
			if (!pluginContext) return;

			const { interpreter, isNext } = pluginContext;
			const { values, utils } = isNext ? AiScriptNext : AiScript;

			interpreter.execFn(handler as any, [utils.jsToVal(user)] as any[]);
		},
	});
};

const registerNoteAction = ({ pluginId, title, handler }: {
	pluginId: string;
	title: string;
	handler: AiScriptNext.values.VFn | AiScript.values.VFn;
}): void => {
	noteActions.push({
		title, handler: (note) => {
			const pluginContext = pluginContexts.get(pluginId);
			if (!pluginContext) return;

			const { interpreter, isNext } = pluginContext;
			const { values, utils } = isNext ? AiScriptNext : AiScript;

			interpreter.execFn(handler as any, [utils.jsToVal(note)] as any[]);
		},
	});
};

const registerNoteViewInterruptor = ({ pluginId, handler }: {
	pluginId: string;
	handler: AiScriptNext.values.VFn | AiScript.values.VFn;
}): void => {
	noteViewInterruptors.push({
		handler: async (note) => {
			const pluginContext = pluginContexts.get(pluginId);
			if (!pluginContext) return;

			const { interpreter, isNext } = pluginContext;
			const { values, utils } = isNext ? AiScriptNext : AiScript;

			return utils.valToJs(await interpreter.execFn(handler as any, [utils.jsToVal(note)] as any[]) as any);
		},
	});
};

const registerNotePostInterruptor = ({ pluginId, handler }: {
	pluginId: string;
	handler: AiScriptNext.values.VFn | AiScript.values.VFn;
}): void => {
	notePostInterruptors.push({
		handler: async (note) => {
			const pluginContext = pluginContexts.get(pluginId);
			if (!pluginContext) return;

			const { interpreter, isNext } = pluginContext;
			const { values, utils } = isNext ? AiScriptNext : AiScript;

			return utils.valToJs(await interpreter.execFn(handler as any, [utils.jsToVal(note)] as any[]) as any);
		},
	});
};
