<template>
<MkModalWindow
	ref="dialog"
	:width="450"
	:can-close="false"
	:with-ok-button="true"
	:ok-button-disabled="false"
	@click="cancel()"
	@ok="ok()"
	@close="cancel()"
	@closed="emit('closed')"
>
	<template #header>
		{{ title }}
	</template>

	<MkSpacer :margin-min="20" :margin-max="32">
		<div class="xkpnjxcv _gaps_m">
			<template v-for="F in forms" :key="F.key">
				<MkInput v-if="F.type === 'number'" v-model="(values[F.key] as any)" type="number" :step="F.step || 1">
					<template #label><span>{{ F.label || F.key }}</span><span v-if="F.required === false"> ({{ i18n.ts.optional }})</span></template>
					<template v-if="F.description" #caption>{{ F.description }}</template>
				</MkInput>
				<MkInput v-else-if="F.type === 'string' && !F.multiline" v-model="(values[F.key] as any)" :max-length="F.maxLength" type="text">
					<template #label><span>{{ F.label || F.key }}</span><span v-if="F.required === false"> ({{ i18n.ts.optional }})</span></template>
					<template v-if="F.description" #caption>{{ F.description }}</template>
				</MkInput>
				<MkTextarea v-else-if="F.type === 'string' && F.multiline" v-model="(values[F.key] as any)" :max-length="F.maxLength">
					<template #label><span>{{ F.label || F.key }}</span><span v-if="F.required === false"> ({{ i18n.ts.optional }})</span></template>
					<template v-if="F.description" #caption>{{ F.description }}</template>
				</MkTextarea>
				<MkSwitch v-else-if="F.type === 'boolean'" v-model="(values[F.key] as any)">
					<template #label><span>{{ F.label || F.key }}</span></template>
					<template v-if="F.description" #caption>{{ F.description }}</template>
				</MkSwitch>
				<MkSelect v-else-if="F.type === 'enum'" v-model="(values[F.key] as any)">
					<template #label><span>{{ F.label || F.key }}</span><span v-if="F.required === false"> ({{ i18n.ts.optional }})</span></template>
					<option v-for="enumItem in F.enum" :key="enumItem.value" :value="enumItem.value">{{ enumItem.label }}</option>
				</MkSelect>
				<MkRadios v-else-if="F.type === 'radio'" v-model="(values[F.key] as any)">
					<template #label><span>{{ F.label || F.key }}</span><span v-if="F.required === false"> ({{ i18n.ts.optional }})</span></template>
					<option v-for="radioItem in F.options" :key="radioItem.value" :value="radioItem.value">{{ radioItem.label }}</option>
				</MkRadios>
				<MkRange v-else-if="F.type === 'range'" v-model="(values[F.key] as any)" :min="F.min" :max="F.max" :step="F.step" :text-converter="F.textConverter">
					<template #label><span>{{ F.label || F.key }}</span><span v-if="F.required === false"> ({{ i18n.ts.optional }})</span></template>
					<template v-if="F.description" #caption>{{ F.description }}</template>
				</MkRange>
				<MkButton v-else-if="F.type === 'button'" @click="F.action($event, values)">
					<span>{{ F.content || F.key }}</span>
				</MkButton>
			</template>
		</div>
	</MkSpacer>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { computed, reactive, shallowRef } from 'vue';
import MkInput from './form/input.vue';
import MkTextarea from './form/textarea.vue';
import MkSwitch from './form/switch.vue';
import MkSelect from './form/select.vue';
import MkRange from './form/range.vue';
import MkButton from './MkButton.vue';
import MkRadios from './form/radios.vue';
import MkModalWindow from '@/components/MkModalWindow.vue';
import { i18n } from '@/i18n';
import { typedEntries } from '@/scripts/tms/utils';

export type FormNumber = {
	type: 'number';
	step?: number;
	label?: string;
	required?: boolean;
	description?: string;
	default?: number | null;
	hidden?: boolean;
};
export type FormString = {
	type: 'string';
	multiline?: boolean;
	maxLength?: number;
	label?: string;
	required?: boolean;
	description?: string;
	default?: string | null;
	hidden?: boolean;
};
export type FormBoolean = {
	type: 'boolean';
	label?: string;
	description?: string;
	default?: boolean | null;
	hidden?: boolean;
};
export type FormEnum = {
	type: 'enum';
	label?: string;
	required?: boolean;
	enum: {
		value: string;
		label: string;
	}[];
	default?: string | null;
	hidden?: boolean;
};
export type FormRadio = {
	type: 'radio';
	label?: string;
	required?: boolean;
	options: {
		value: string;
		label: string;
	}[];
	default?: string | null;
	hidden?: boolean;
};
export type FormRange = {
	type: 'range';
	min: number;
	max: number;
	step?: number;
	textConverter?: (value: number) => string;
	label?: string;
	required?: boolean;
	description?: string;
	default?: number | null;
	hidden?: boolean;
};
export type FormButton = {
	type: 'button';
	action: (event: MouseEvent, values: Values<PropsForm>) => void;
	content?: string;
	default?: undefined | null;
	hidden?: boolean;
};
export type PropsForm = Record<string, FormNumber | FormString | FormBoolean | FormEnum | FormRadio | FormRange | FormButton>;

const props = defineProps<{
	title: string;
	form: PropsForm;
}>();

const emit = defineEmits<{
	(ev: 'done', v: { canceled: false; result: Values<PropsForm>; }): void;
	(ev: 'done', v: { canceled: true; result: undefined; }): void;
	(ev: 'closed'): void;
}>();

const dialog = shallowRef<InstanceType<typeof MkModalWindow>>();

type Forms<T extends PropsForm> = (T[keyof T] & { key: keyof T; })[];
const forms = computed<Forms<PropsForm>>(() => {
	return typedEntries(props.form).flatMap(([k, f]) => {
		return !f.hidden ? [{ ...f, key: k }] : [];
	});
});

type Values<T extends PropsForm> = {
	[K in keyof T]: T[K]['default'] | null;
}
const values = reactive<Values<PropsForm>>({});

for (const formKey in props.form) {
	values[formKey] = props.form[formKey].default ?? null;
}

const ok = (): void => {
	emit('done', {
		canceled: false,
		result: values,
	});
	dialog.value?.close();
};

const cancel = (): void => {
	emit('done', {
		canceled: true,
		result: undefined,
	});
	dialog.value?.close();
};
</script>
