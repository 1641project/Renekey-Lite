<template>
<div ref="rootEl" :class="$style.root">
	<div ref="contentEl" :class="$style.content">
		<slot></slot>
	</div>
</div>
</template>

<script lang="ts" setup>
import { inject, onMounted, onUnmounted } from 'vue';
import { deviceKind } from '@/scripts/device-kind';

const props = withDefaults(defineProps<{
	contentMax?: number | null;
	marginMin?: number;
	marginMax?: number;
}>(), {
	contentMax: null,
	marginMin: 12,
	marginMax: 24,
});

const forceSpacerMin = inject<boolean>('forceSpacerMin', false) || deviceKind === 'smartphone';

let ro: ResizeObserver | null = null;
let rootEl = $shallowRef<HTMLElement>();
let contentEl = $shallowRef<HTMLElement>();
let margin = $ref(0);

const adjustSpacer = (rect: {
	width: number;
	height: number;
}): void => {
	if (forceSpacerMin) {
		margin = props.marginMin;
		return;
	}

	if (rect.width > (props.contentMax ?? 0) || (rect.width > 360 && window.innerWidth > 400)) {
		margin = props.marginMax;
	} else {
		margin = props.marginMin;
	}
};

onMounted(() => {
	if (!rootEl) return;

	ro = new ResizeObserver(() => {
		if (!rootEl) return;
		adjustSpacer({
			width: rootEl.offsetWidth,
			height: rootEl.offsetHeight,
		});
	});
	ro.observe(rootEl);
});

onUnmounted(() => {
	ro?.disconnect();
	ro = null;
});
</script>

<style lang="scss" module>
@layer global {
	.root {
		box-sizing: border-box;
		width: 100%;
		padding: v-bind('`${margin}px`');
	}

	.content {
		container-type: inline-size;
		margin: 0 auto;
		max-width: v-bind('props.contentMax != null ? `${props.contentMax}px` : "none"');
	}
}
</style>
