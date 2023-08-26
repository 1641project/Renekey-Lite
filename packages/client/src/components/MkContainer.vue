<template>
<div ref="rootEl" v-size="{ max: [380] }" class="_panel" :class="[$style.root, { [$style.naked]: naked, [$style.thin]: thin, [$style.hideHeader]: !showHeader, [$style.scrollable]: scrollable, [$style.closed]: !showBody }]">
	<header v-if="showHeader" ref="headerEl" :class="$style.header">
		<div :class="$style.title">
			<span :class="$style.titleIcon"><slot name="icon"></slot></span>
			<slot name="header"></slot>
		</div>
		<div :class="$style.headerSub">
			<div :class="$style.headerButtons">
				<slot name="func"></slot>
				<button v-if="foldable" class="_button" @click="() => showBody = !showBody">
					<template v-if="showBody"><i class="ti ti-chevron-up"></i></template>
					<template v-else><i class="ti ti-chevron-down"></i></template>
				</button>
			</div>
		</div>
	</header>
	<Transition
		:enter-active-class="defaultStore.state.animation ? $style.transition_toggle_enterActive : ''"
		:leave-active-class="defaultStore.state.animation ? $style.transition_toggle_leaveActive : ''"
		:enter-from-class="defaultStore.state.animation ? $style.transition_toggle_enterFrom : ''"
		:leave-to-class="defaultStore.state.animation ? $style.transition_toggle_leaveTo : ''"
		@enter="enter"
		@after-enter="afterEnter"
		@leave="leave"
		@after-leave="afterLeave"
	>
		<div v-show="showBody" ref="contentEl" :class="[$style.content, { [$style.omitted]: omitted }]">
			<slot></slot>
			<button v-if="omitted" :class="$style.fade" class="_button" @click="() => { ignoreOmit = true; omitted = false; }">
				<span :class="$style.fadeLabel">{{ i18n.ts.showMore }}</span>
			</button>
		</div>
	</Transition>
</div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref, shallowRef, watch } from 'vue';
import { defaultStore } from '@/store';
import { i18n } from '@/i18n';

const props = withDefaults(defineProps<{
	showHeader?: boolean;
	thin?: boolean;
	naked?: boolean;
	foldable?: boolean;
	scrollable?: boolean;
	expanded?: boolean;
	maxHeight?: number | null;
}>(), {
	showHeader: true,
	thin: false,
	naked: false,
	foldable: false,
	scrollable: false,
	expanded: true,
	maxHeight: null,
});

const rootEl = shallowRef<HTMLElement>();
const contentEl = shallowRef<HTMLElement>();
const headerEl = shallowRef<HTMLElement>();
const showBody = ref(props.expanded);
const ignoreOmit = ref(false);
const omitted = ref(false);

const enter = (el: HTMLElement): void => {
	const { height: elementHeight } = el.getBoundingClientRect();
	el.style.height = '0';
	el.offsetHeight; // reflow
	el.style.height = `${Math.min(elementHeight, props.maxHeight ?? Infinity)}px`;
};

const afterEnter = (el: HTMLElement): void => {
	el.style.height = '';
};

const leave = (el: HTMLElement): void => {
	const { height: elementHeight } = el.getBoundingClientRect();
	el.style.height = `${elementHeight}px`;
	el.offsetHeight; // reflow
	el.style.height = '0';
};

const afterLeave = (el: HTMLElement): void => {
	el.style.height = '';
};

const calcOmit = (): void => {
	if (omitted.value || ignoreOmit.value || props.maxHeight == null) return;
	const height = contentEl.value?.offsetHeight ?? 0;
	omitted.value = height > props.maxHeight;
};

let contentRo: ResizeObserver | null = null;

onMounted(() => {
	watch(showBody, v => {
		const headerHeight = props.showHeader ? headerEl.value?.offsetHeight ?? 0 : 0;
		if (rootEl.value) {
			rootEl.value.style.minHeight = `${headerHeight}px`;
			if (v) {
				rootEl.value.style.flexBasis = 'auto';
			} else {
				rootEl.value.style.flexBasis = `${headerHeight}px`;
			}
		}
	}, {
		immediate: true,
	});

	if (rootEl.value && props.maxHeight != null) {
		rootEl.value.style.setProperty('--maxHeight', `${props.maxHeight}px`);
	}

	calcOmit();

	if (contentEl.value) {
		contentRo = new ResizeObserver(calcOmit);
		contentRo.observe(contentEl.value);
	}
});

onUnmounted(() => {
	if (contentRo) {
		contentRo.disconnect();
		contentRo = null;
	}
});
</script>

<style lang="scss" module>
.transition_toggle_enterActive, .transition_toggle_leaveActive {
	overflow-y: hidden; // fallback (overflow: clip)
	overflow-y: clip;
	transition: opacity 0.5s, height 0.5s !important;
}
.transition_toggle_enterFrom, .transition_toggle_leaveTo {
	opacity: 0;
}

.root {
	position: relative;
	overflow: hidden; // fallback (overflow: clip)
	overflow: clip;
	contain: content;

	&.naked {
		background: transparent !important;
		box-shadow: none !important;
	}

	&.scrollable {
		display: flex;
		flex-direction: column;

		> .content {
			overflow: auto;
		}
	}

	&.thin {
		> .header {
			> .title {
				padding: 8px 10px;
				font-size: 0.9em;
			}
		}
	}
}

.header {
	position: sticky;
	top: var(--stickyTop, 0px);
	left: 0;
	color: var(--panelHeaderFg);
	background: var(--panelHeaderBg);
	border-bottom: solid 0.5px var(--panelHeaderDivider);
	z-index: 2;
	line-height: 1.4em;
}

.title {
	margin: 0;
	padding: 12px 16px;

	&:empty {
		display: none;
	}
}

.titleIcon {
	margin-right: 6px;
}

.headerSub {
	position: absolute;
	z-index: 2;
	top: 0;
	right: 0;
	height: 100%;
}

.headerButtons {
	display: flex;

	> :global(*) {
		width: 42px;
		height: 100%;
	}
}

.content {
	--stickyTop: 0px;

	&.omitted {
		position: relative;
		max-height: var(--maxHeight);
		overflow: hidden;

		> .fade {
			display: block;
			position: absolute;
			z-index: 10;
			bottom: 0;
			left: 0;
			width: 100%;
			height: 64px;
			background: linear-gradient(
				0deg,
				var(--panel),
				var(--X15)
			);

			> .fadeLabel {
				display: inline-block;
				background: var(--panel);
				padding: 6px 10px;
				font-size: 0.8em;
				border-radius: 999px;
				box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
			}

			&:hover {
				> .fadeLabel {
					background: var(--panelHighlight);
				}
			}
		}
	}
}

:where(:global(.max-width_380px)) {
	.title {
		padding: 8px 10px;
		font-size: 0.9em;
	}
}
</style>
