<template>
<div ref="root" :class="[$style.root, { [$style.cover]: cover }]" :title="title ?? ''">
	<TransitionGroup
		:duration="props.transition?.duration"
		:enter-active-class="defaultStore.state.animation && props.transition?.enterActiveClass || undefined"
		:leave-active-class="defaultStore.state.animation && (props.transition?.leaveActiveClass ?? $style.transition_leaveActive) || undefined"
		:enter-from-class="defaultStore.state.animation && props.transition?.enterFromClass || undefined"
		:leave-to-class="defaultStore.state.animation && props.transition?.leaveToClass || undefined"
		:enter-to-class="defaultStore.state.animation && props.transition?.enterToClass || undefined"
		:leave-from-class="defaultStore.state.animation && props.transition?.leaveFromClass || undefined"
	>
		<div
			v-show="hide"
			key="dummy"
			:class="$style.canvas"
			:width="canvasWidth"
			:height="canvasHeight"
			:title="title ?? undefined"
			:style="{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }"
		/>
		<img
			v-show="!hide"
			key="img"
			ref="img"
			:height="imgHeight"
			:width="imgWidth"
			:class="$style.img"
			:src="src ?? undefined"
			:title="title ?? undefined"
			:alt="alt ?? undefined"
			loading="eager"
			decoding="async"
		/>
	</TransitionGroup>
</div>
</template>

<script lang="ts" setup>
import { computed, shallowRef, watch } from 'vue';
import { defaultStore } from '@/store';

const props = withDefaults(defineProps<{
	transition?: {
		duration?: number | { enter: number; leave: number; };
		enterActiveClass?: string;
		leaveActiveClass?: string;
		enterFromClass?: string;
		leaveToClass?: string;
		enterToClass?: string;
		leaveFromClass?: string;
	} | null;
	src?: string | null;
	hash?: string;
	alt?: string | null;
	title?: string | null;
	height?: number;
	width?: number;
	cover?: boolean;
	forceBlurhash?: boolean;
	onlyAvgColor?: boolean; // 軽量化のためにBlurhashを使わずに平均色だけを描画
}>(), {
	transition: null,
	src: null,
	alt: '',
	title: null,
	height: 64,
	width: 64,
	cover: true,
	forceBlurhash: false,
	onlyAvgColor: false,
});

const root = shallowRef<HTMLDivElement>();
const img = shallowRef<HTMLImageElement>();
let loaded = $ref(false);
let canvasWidth = $ref(64);
let canvasHeight = $ref(64);
let imgWidth = $ref(props.width);
let imgHeight = $ref(props.height);
const hide = computed(() => !loaded || props.forceBlurhash);

watch([() => props.width, () => props.height, root], () => {
	const ratio = props.width / props.height;
	if (ratio > 1) {
		canvasWidth = Math.round(64 * ratio);
		canvasHeight = 64;
	} else {
		canvasWidth = 64;
		canvasHeight = Math.round(64 / ratio);
	}

	const clientWidth = root.value?.clientWidth ?? 300;
	imgWidth = clientWidth;
	imgHeight = Math.round(clientWidth / ratio);
}, {
	immediate: true,
});
</script>

<style lang="scss" module>
.transition_leaveActive {
	position: absolute;
	top: 0;
	left: 0;
}

.root {
	position: relative;
	width: 100%;
	height: 100%;

	&.cover {
		> .canvas,
		> .img {
			object-fit: cover;
		}
	}
}

.canvas,
.img {
	display: block;
	width: 100%;
	height: 100%;
}

.canvas {
	object-fit: contain;
}

.img {
	object-fit: contain;
}
</style>
