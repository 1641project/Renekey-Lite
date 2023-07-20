<template>
<div ref="rootEl" v-size="{ max: [500] }" :class="$style.root">
	<header :class="$style.header" class="_button" :style="{ background: bg ?? undefined }" @click="showBody = !showBody">
		<div :class="$style.title"><div><slot name="header"></slot></div></div>
		<div :class="$style.divider"></div>
		<button class="_button" :class="$style.button">
			<template v-if="showBody"><i class="ti ti-chevron-up"></i></template>
			<template v-else><i class="ti ti-chevron-down"></i></template>
		</button>
	</header>
	<Transition
		:enter-active-class="defaultStore.state.animation ? $style.folder_toggle_enterActive : ''"
		:leave-active-class="defaultStore.state.animation ? $style.folder_toggle_leaveActive : ''"
		:enter-from-class="defaultStore.state.animation ? $style.folder_toggle_enterFrom : ''"
		:leave-to-class="defaultStore.state.animation ? $style.folder_toggle_leaveTo : ''"
		@enter="enter"
		@after-enter="afterEnter"
		@leave="leave"
		@after-leave="afterLeave"
	>
		<div v-show="showBody">
			<slot></slot>
		</div>
	</Transition>
</div>
</template>

<script lang="ts" setup>
import { onMounted, ref, shallowRef, watch } from 'vue';
import tinycolor from 'tinycolor2';
import { defaultStore } from '@/store';
import { isHtmlElement } from '@/scripts/tms/utils';

const localStoragePrefix = 'ui:folder:' as const;

const props = withDefaults(defineProps<{
	expanded?: boolean;
	persistKey?: string;
}>(), {
	expanded: true,
	persistKey: undefined,
});

const rootEl = shallowRef<HTMLDivElement | null>(null);
const bg = ref<string | null>(null);
const showBody = ref((props.persistKey && localStorage.getItem(`${localStoragePrefix}${props.persistKey}`)) ? (localStorage.getItem(`${localStoragePrefix}${props.persistKey}`) === 't') : props.expanded);

watch(showBody, () => {
	if (props.persistKey) {
		localStorage.setItem(`${localStoragePrefix}${props.persistKey}`, showBody.value ? 't' : 'f');
	}
});

const enter = (el: Element): void => {
	if (!isHtmlElement(el)) return;
	const { height } = el.getBoundingClientRect();
	el.style.height = '0';
	el.offsetHeight; // reflow
	el.style.height = `${height}px`;
};

const afterEnter = (el: Element): void => {
	if (!isHtmlElement(el)) return;
	el.style.height = '';
};

const leave = (el: Element): void => {
	if (!isHtmlElement(el)) return;
	const { height } = el.getBoundingClientRect();
	el.style.height = `${height}px`;
	el.offsetHeight; // reflow
	el.style.height = '0';
};

const afterLeave = (el: Element): void => {
	if (!isHtmlElement(el)) return;
	el.style.height = '';
};

onMounted(() => {
	const getParentBg = (el: HTMLElement | null): string => {
		if (el == null || el.tagName === 'BODY') return 'var(--bg)';
		const bg_ = el.style.background || el.style.backgroundColor;
		if (bg_) {
			return bg_;
		} else {
			return getParentBg(el.parentElement);
		}
	};
	const rawBg = getParentBg(rootEl.value);
	const _bg = tinycolor(rawBg.startsWith('var(') ? getComputedStyle(document.documentElement).getPropertyValue(rawBg.slice(4, -1)) : rawBg);
	_bg.setAlpha(0.85);
	bg.value = _bg.toRgbString();
});
</script>

<style lang="scss" module>
.folder_toggle_enterActive, .folder_toggle_leaveActive {
	overflow-y: hidden; // fallback (overflow: clip)
	overflow-y: clip;
	transition: opacity 0.5s, height 0.5s !important;
}
.folder_toggle_enterFrom {
	opacity: 0;
}
.folder_toggle_leaveTo {
	opacity: 0;
}

.root {
	position: relative;
}

.header {
	display: flex;
	position: relative;
	z-index: 10;
	position: sticky;
	top: var(--stickyTop, 0px);
	-webkit-backdrop-filter: var(--blur, blur(8px));
	backdrop-filter: var(--blur, blur(20px));
}

.title {
	display: grid;
	place-content: center;
	margin: 0;
	padding: 12px 16px 12px 0;
}

.divider {
	flex: 1;
	margin: auto;
	height: 1px;
	background: var(--divider);
}

.button {
	padding: 12px 0 12px 16px;
}

:where(:global(.max-width_500px)) {
	.title {
		padding: 8px 10px 8px 0;
	}
}
</style>
