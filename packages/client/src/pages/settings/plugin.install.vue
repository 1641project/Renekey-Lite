<template>
<div class="_gaps_m">
	<FormInfo warn>{{ i18n.ts._plugin.installWarn }}</FormInfo>

	<FormTextarea v-model="code" tall>
		<template #label>{{ i18n.ts.code }}</template>
	</FormTextarea>

	<div>
		<FormSwitch v-model="nextMode" class="_formBlock">
			<template #label>AiScript Next Mode</template>
		</FormSwitch>
		<MkButton :disabled="!code" primary inline @click="install"><i class="ti ti-check"></i> {{ i18n.ts.install }}</MkButton>
	</div>
</div>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, nextTick, ref } from 'vue';
import * as AiScript from '@syuilo/aiscript';
import { serialize } from '@syuilo/aiscript/built/serializer';
import * as AiScriptNext from '@syuilo/aiscript-next';
import { v4 as uuid } from 'uuid';
import FormTextarea from '@/components/form/textarea.vue';
import FormSwitch from '@/components/form/switch.vue';
import MkButton from '@/components/MkButton.vue';
import FormInfo from '@/components/MkInfo.vue';
import * as os from '@/os';
import { ColdDeviceStorage } from '@/store';
import { unisonReload } from '@/scripts/unison-reload';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

const parser = new AiScriptNext.Parser();
const code = ref('');
const nextMode = ref(false);

const installPlugin = ({ id, meta, ast, src, token, isNext }) => {
	ColdDeviceStorage.set('plugins', ColdDeviceStorage.get('plugins').concat({
		...meta,
		id,
		active: true,
		configData: {},
		token: token,
		...isNext ? { isNext: true, src } : { isNext: false, ast },
	}));
};

const install = async () => {
	if (!code.value) return;

	if (nextMode.value) {
		const lv = AiScriptNext.utils.getLangVersion(code.value);
		if (lv == null) {
			os.alert({
				type: 'error',
				text: 'No language version annotation found :(',
			});
			return;
		} else if (!(lv.startsWith('0.12.') || lv.startsWith('0.13.'))) {
			os.alert({
				type: 'error',
				text: `aiscript version '${lv}' is not supported :(`,
			});
			return;
		}
	}

	let ast: any;
	try {
		ast = (nextMode.value ? parser.parse : AiScript.parse)(code.value);
	} catch (err) {
		os.alert({
			type: 'error',
			text: 'Syntax error :(',
		});
		return;
	}

	const meta = (nextMode.value ? AiScriptNext.Interpreter : AiScript.AiScript).collectMetadata(ast);
	if (meta == null) {
		os.alert({
			type: 'error',
			text: 'No metadata found :(',
		});
		return;
	}

	const metadata = meta.get(null);
	if (metadata == null) {
		os.alert({
			type: 'error',
			text: 'No metadata found :(',
		});
		return;
	}

	const { name, version, author, description, permissions, config } = metadata;
	if (name == null || version == null || author == null) {
		os.alert({
			type: 'error',
			text: 'Required property not found :(',
		});
		return;
	}

	const token = permissions == null || permissions.length === 0 ? null : await new Promise((res, rej) => {
		os.popup(defineAsyncComponent(() => import('@/components/MkTokenGenerateWindow.vue')), {
			title: i18n.ts.tokenRequested,
			information: i18n.ts.pluginTokenRequestedDescription,
			initialName: name,
			initialPermissions: permissions,
		}, {
			done: async result => {
				const { name, permissions } = result;
				const { token } = await os.api('miauth/gen-token', {
					session: null,
					name: name,
					permission: permissions,
				});
				res(token);
			},
		}, 'closed');
	});

	installPlugin({
		id: uuid(),
		meta: {
			name, version, author, description, permissions, config,
		},
		token,
		...nextMode.value ? {
			isNext: true,
			src: code.value,
			ast: undefined,
		} : {
			isNext: false,
			src: undefined,
			ast: serialize(ast),
		},
	});

	os.success();

	nextTick(() => {
		unisonReload();
	});
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts._plugin.install,
	icon: 'ti ti-download',
});
</script>
