<!-- eslint-disable-line vue/multi-word-component-names -->
<template>
<div :class="[$style.root, '_gaps']">
	<MkInfo v-if="logs.length === 0">{{ i18n.ts.scratchpadDescription }}</MkInfo>

	<div :class="[$style.code, '_code']">
		<PrismEditor v-model="code" :highlight="highlighter" :line-numbers="false"/>
		<MkButton primary @click="run()"><i class="ti ti-player-play"></i></MkButton>
	</div>

	<MkContainer :foldable="true">
		<template #header>{{ i18n.ts.output }}</template>
		<div class="bepmlvbi">
			<div v-for="log in logs" :key="log.id" class="log" :class="{ print: log.print }">{{ log.text }}</div>
		</div>
	</MkContainer>
</div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import 'prismjs';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism-okaidia.css';
import { PrismEditor } from 'vue-prism-editor';
import 'vue-prism-editor/dist/prismeditor.min.css';
import { v4 as uuid } from 'uuid';
import { AiScript, parse, utils } from '@syuilo/aiscript';
import MkContainer from '@/components/MkContainer.vue';
import MkButton from '@/components/MkButton.vue';
import MkInfo from '@/components/MkInfo.vue';
import { createAiScriptEnv } from '@/scripts/aiscript/api';
import * as os from '@/os';
import { $i } from '@/account';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

const code = ref('');
const logs = ref<{
	id: string;
	text: string;
	print: boolean;
}[]>([]);

const saved = localStorage.getItem('scratchpad');
if (saved) {
	code.value = saved;
}

watch(code, () => {
	localStorage.setItem('scratchpad', code.value);
});

const run = async (): Promise<void> => {
	logs.value = [];
	const aiscript = new AiScript(createAiScriptEnv({
		storageKey: 'scratchpad',
		token: $i?.token,
	}), {
		in: (q: any): Promise<any> => {
			return new Promise(ok => {
				os.inputText({
					title: q,
				}).then(({ result: a }) => {
					ok(a);
				});
			});
		},
		out: (value: any): void => {
			logs.value.push({
				id: uuid(),
				text: value.type === 'str' ? value.value : utils.valToString(value),
				print: true,
			});
		},
		log: (type: any, params: any): void => {
			if (type === 'end') {
				logs.value.push({
					id: uuid(),
					text: utils.valToString(params.val, true),
					print: false,
				});
			}
		},
	});

	let ast: any;
	try {
		ast = parse(code.value);
	} catch (error) {
		os.alert({
			type: 'error',
			text: 'Syntax error :(',
		});
		return;
	}
	try {
		await aiscript.exec(ast);
	} catch (error: any) {
		os.alert({
			type: 'error',
			text: error.message,
		});
	}
};

const highlighter = (code_: string): string => {
	return highlight(code_, languages.js, 'javascript');
};

definePageMetadata({
	title: i18n.ts.scratchpad,
	icon: 'ti ti-terminal-2',
});
</script>

<style lang="scss" module>
.root {
	padding: 16px;
}

.code {
	display: flex;
	gap: 4px;
	padding: 8px;
	box-sizing: border-box;
}
</style>

<style lang="scss" scoped>
.iltifgqe {
	padding: 16px;

	> .editor {
		position: relative;
	}
}

.bepmlvbi {
	padding: 16px;

	> .log {
		&:not(.print) {
			opacity: 0.7;
		}
	}
}
</style>
