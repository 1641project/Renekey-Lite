<!-- eslint-disable-line vue/multi-word-component-names -->
<template>
<div class="matxzzsk">
	<div :class="$style.label" @click="focus">
		<span v-if="$slots.label || counter.isRemaining" :class="$style.labelText"><slot name="label"></slot></span>
		<span v-if="counter.isRemaining" :class="[$style.textCount, { [$style.isOver]: counter.isOver }]">{{ counter.remainingChars }}</span>
	</div>
	<div :class="[$style.input, {
		[$style.inline]: inline,
		[$style.disabled]: disabled,
		[$style.focused]: focused,
	}]">
		<div ref="prefixEl" :class="$style.prefix"><slot name="prefix"></slot></div>
		<input
			ref="inputEl"
			v-model="v"
			v-adaptive-border
			:class="$style.inputCore"
			:type="type"
			:disabled="disabled"
			:required="required"
			:readonly="readonly"
			:placeholder="placeholder"
			:pattern="pattern"
			:autocomplete="autocomplete"
			:spellcheck="spellcheck"
			:step="step"
			:list="id"
			@focus="focused = true"
			@blur="focused = false"
			@keydown="onKeydown"
			@input="onInput"
		>
		<datalist v-if="datalist" :id="id">
			<option v-for="data in datalist" :key="data" :value="data"/>
		</datalist>
		<div ref="suffixEl" :class="$style.suffix"><slot name="suffix"></slot></div>
	</div>
	<div :class="$style.caption"><slot name="caption"></slot></div>

	<MkButton v-if="manualSave && changed" primary :class="$style.save" @click="updated"><i class="ti ti-check"></i> {{ i18n.ts.save }}</MkButton>
</div>
</template>

<script lang="ts" setup>
import { onMounted, nextTick, ref, shallowRef, watch, toRefs } from 'vue';
import { debounce } from 'throttle-debounce';
import { v4 as uuid } from 'uuid';
import MkButton from '@/components/MkButton.vue';
import { useInterval } from '@/scripts/use-interval';
import { i18n } from '@/i18n';
import { textCounter } from '@/scripts/tms/text-counter';

const props = defineProps<{
	modelValue: string | number;
	type?: 'text' | 'number' | 'password' | 'email' | 'url' | 'date' | 'time' | 'search' | 'datetime-local';
	required?: boolean;
	readonly?: boolean;
	disabled?: boolean;
	pattern?: string;
	placeholder?: string;
	autofocus?: boolean;
	autocomplete?: string;
	spellcheck?: boolean;
	step?: number;
	datalist?: string[];
	inline?: boolean;
	debounce?: boolean;
	manualSave?: boolean;
	small?: boolean;
	large?: boolean;
	minLength?: number;
	maxLength?: number;
}>();

const emit = defineEmits<{
	(ev: 'change', _ev: Event): void;
	(ev: 'keydown', _ev: KeyboardEvent): void;
	(ev: 'enter'): void;
	(ev: 'update:modelValue', value: string | number): void;
}>();

const { modelValue, type, autofocus } = toRefs(props);
const v = ref(modelValue.value);
const id = uuid();
const focused = ref(false);
const changed = ref(false);
const invalid = ref(false);
const inputEl = shallowRef<HTMLElement>();
const prefixEl = shallowRef<HTMLElement>();
const suffixEl = shallowRef<HTMLElement>();
const height =
	props.small ? 33 :
	props.large ? 39 :
	36;

const counter = textCounter({
	text: v,
	maxChars: props.maxLength ?? Infinity,
});

const focus = (): void => inputEl.value?.focus();
const onInput = (ev: Event): void => {
	changed.value = true;
	emit('change', ev);
};
const onKeydown = (ev: KeyboardEvent) => {
	if (ev.isComposing || ev.key === 'Process' || ev.keyCode === 229) return;

	emit('keydown', ev);

	if (ev.code === 'Enter') {
		emit('enter');
	}
};

const updated = (): void => {
	changed.value = false;
	if (type?.value === 'number') {
		emit('update:modelValue', parseFloat(v.value as string));
	} else {
		emit('update:modelValue', v.value);
	}
};

const debouncedUpdated = debounce(1000, updated);

watch(modelValue, newValue => {
	v.value = newValue;
});

watch(v, () => {
	invalid.value = !!inputEl.value?.validity.badInput || (counter.value.isRemaining && counter.value.isOver);

	if (!props.manualSave) {
		if (props.debounce) {
			debouncedUpdated();
		} else {
			updated();
		}
	}
});

// このコンポーネントが作成された時、非表示状態である場合がある
// 非表示状態だと要素の幅などは0になってしまうので、定期的に計算する
useInterval(() => {
	if (!inputEl.value) return;
	if (prefixEl.value) {
		if (prefixEl.value.offsetWidth) {
			inputEl.value.style.paddingLeft = prefixEl.value.offsetWidth + 'px';
		}
	}
	if (suffixEl.value) {
		if (suffixEl.value.offsetWidth) {
			inputEl.value.style.paddingRight = suffixEl.value.offsetWidth + 'px';
		}
	}
}, 100, {
	immediate: true,
	afterMounted: true,
});

onMounted(() => {
	nextTick(() => {
		if (autofocus.value) {
			focus();
		}
	});
});
</script>

<style lang="scss" module>
.label {
	font-size: 0.85em;
	padding: 0 0 8px 0;
	user-select: none;
	min-height: 1.35em; // line-height
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 8px;

	&:empty {
		display: none;
	}

	> .labelText {
		overflow-wrap: break-word;
	}

	> .textCount {
		white-space: nowrap;
		opacity: 0.7;

		&.isOver {
			color: var(--error);
		}
	}
}

.caption {
	font-size: 0.85em;
	padding: 8px 0 0 0;
	color: var(--fgTransparentWeak);

	&:empty {
		display: none;
	}
}

.input {
	position: relative;

	&.inline {
		display: inline-block;
		margin: 0;
	}

	&.focused {
		> .inputCore {
			border-color: var(--accent) !important;
			// box-shadow: 0 0 0 4px var(--focus);
		}
	}

	&.disabled {
		opacity: 0.7;

		&,
		> .inputCore {
			cursor: not-allowed !important;
		}
	}
}

.inputCore {
	-webkit-appearance: none;
	appearance: none;
	display: block;
	height: v-bind("`${height}px`");
	width: 100%;
	margin: 0;
	padding: 0 12px;
	font: inherit;
	font-weight: normal;
	font-size: 1em;
	color: var(--fg);
	background: var(--panel);
	border: solid 1px var(--panel);
	border-radius: 6px;
	outline: none;
	box-shadow: none;
	box-sizing: border-box;
	transition: border-color 0.1s ease-out;

	&:hover {
		border-color: var(--inputBorderHover) !important;
	}
}

.prefix,
.suffix {
	display: flex;
	align-items: center;
	position: absolute;
	z-index: 1;
	top: 0;
	padding: 0 12px;
	font-size: 1em;
	height: v-bind("`${height}px`");
	min-width: 16px;
	max-width: 150px;
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
	box-sizing: border-box;
	pointer-events: none;

	&:empty {
		display: none;
	}
}

.prefix {
	left: 0;
	padding-right: 6px;
}

.suffix {
	right: 0;
	padding-left: 6px;
}

.save {
	margin: 8px 0 0 0;
}
</style>
