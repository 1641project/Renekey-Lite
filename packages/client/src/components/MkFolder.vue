<template>
<div ref="rootEl" :class="$style.root" role="group" :aria-expanded="opened">
	<MkStickyContainer>
		<template #header>
			<div :class="[$style.header, { [$style.opened]: opened }]" class="_button" role="button" data-cy-folder-header @click="toggle">
				<div :class="$style.headerIcon"><slot name="icon"></slot></div>
				<div :class="$style.headerText">
					<div>
						<MkCondensedLine :min-scale="2 / 3"><slot name="label"></slot></MkCondensedLine>
					</div>
					<div :class="$style.headerTextSub">
						<slot name="caption"></slot>
					</div>
				</div>
				<div :class="$style.headerRight">
					<span :class="$style.headerRightText"><slot name="suffix"></slot></span>
					<i v-if="opened" class="ti ti-chevron-up icon"></i>
					<i v-else class="ti ti-chevron-down icon"></i>
				</div>
			</div>
		</template>

		<div v-if="openedAtLeastOnce" :class="[$style.body, { [$style.bgSame]: bgSame }]" :style="{ maxHeight: maxHeight ? `${maxHeight}px` : undefined, overflow: maxHeight ? 'auto' : undefined }" :aria-hidden="!opened">
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
				<KeepAlive>
					<div v-show="opened">
						<MkSpacer :margin-min="14" :margin-max="22">
							<slot></slot>
						</MkSpacer>
					</div>
				</KeepAlive>
			</Transition>
		</div>
	</MkStickyContainer>
</div>
</template>

<script lang="ts" setup>
import { nextTick, onMounted } from 'vue';
import { defaultStore } from '@/store';
import { isHtmlElement } from '@/scripts/tms/utils';

const props = withDefaults(defineProps<{
	defaultOpen?: boolean;
	maxHeight?: number | null;
}>(), {
	defaultOpen: false,
	maxHeight: null,
});

const isTransparent = (color?: string | null): boolean => {
	if (!color) return false;
	if (color === 'transparent') return true;
	const [_r, _g, _b, alpha = null] = [...color.match(/\d+/g) ?? []];
	return alpha === '0';
};

const getBgColor = (el: HTMLElement | null): string => {
	if (!el) return 'transparent';
	const { backgroundColor } = window.getComputedStyle(el);
	if (backgroundColor && !isTransparent(backgroundColor)) {
		return backgroundColor;
	} else {
		return getBgColor(el.parentElement);
	}
};

let rootEl = $shallowRef<HTMLElement>();
let bgSame = $ref(false);
let opened = $ref(props.defaultOpen);
let openedAtLeastOnce = $ref(props.defaultOpen);

const enter = (el: Element): void => {
	if (!isHtmlElement(el)) return;
	const { height } = el.getBoundingClientRect();
	el.style.height = '0';
	el.offsetHeight; // reflow
	el.style.height = `${Math.min(height, props.maxHeight ?? Infinity)}px`;
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

const toggle = (): void => {
	if (!opened) {
		openedAtLeastOnce = true;
	}

	nextTick(() => {
		opened = !opened;
	});
};

onMounted(() => {
	const computedStyle = getComputedStyle(document.documentElement);
	const parentBg = getBgColor(rootEl?.parentElement ?? null);
	const myBg = computedStyle.getPropertyValue('--panel');
	bgSame = parentBg === myBg;
});
</script>

<style lang="scss" module>
.transition_toggle_enterActive,
.transition_toggle_leaveActive {
	overflow-y: hidden; // fallback (overflow: clip)
	overflow-y: clip;
	transition: opacity 0.3s, height 0.3s, transform 0.3s !important;
}
.transition_toggle_enterFrom,
.transition_toggle_leaveTo {
	opacity: 0;
}

.root {
	display: block;
}

.header {
	display: flex;
	align-items: center;
	width: 100%;
	box-sizing: border-box;
	padding: 9px 12px 9px 12px;
	background: var(--buttonBg);
	-webkit-backdrop-filter: var(--blur, blur(15px));
	backdrop-filter: var(--blur, blur(15px));
	border-radius: 6px;
	transition: border-radius 0.3s;

	&:hover {
		text-decoration: none;
		background: var(--buttonHoverBg);
	}

	&.active {
		color: var(--accent);
		background: var(--buttonHoverBg);
	}

	&.opened {
		border-radius: 6px 6px 0 0;
	}
}

.headerUpper {
	display: flex;
	align-items: center;
}

.headerLower {
	color: var(--fgTransparentWeak);
	font-size: .85em;
	padding-left: 4px;
}

.headerIcon {
	margin-right: 0.75em;
	flex-shrink: 0;
	text-align: center;
	opacity: 0.8;

	&:empty {
		display: none;

		& + .headerText {
			padding-left: 4px;
		}
	}
}

.headerText {
	white-space: nowrap;
	text-overflow: ellipsis;
	overflow: hidden;
	padding-right: 12px;
}

.headerTextSub {
	color: var(--fgTransparentWeak);
	font-size: .85em;
}

.headerRight {
	margin-left: auto;
	color: var(--fgTransparentWeak);
	white-space: nowrap;
}

.headerRightText:not(:empty) {
	margin-right: 0.75em;
}

.body {
	background: var(--panel);
	border-radius: 0 0 6px 6px;
	container-type: inline-size;

	&.bgSame {
		background: var(--bg);
	}
}
</style>
