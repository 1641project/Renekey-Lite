<template>
<span
	class="mk-ellipsis"
	:class="[$style.root, {
		[$style.static]: static,
	}]"
>
	<span :class="[$style.dot, $style.dot1]">.</span>
	<span :class="[$style.dot, $style.dot2]">.</span>
	<span :class="[$style.dot, $style.dot3]">.</span>
</span>
</template>

<script lang="ts" setup>
import { } from 'vue';

withDefaults(defineProps<{
	static?: boolean;
}>(), {
	static: false,
});
</script>

<style lang="scss" module>
@layer global {
	.root.static > .dot {
		animation-play-state: paused;
	}

	.dot {
		animation: ellipsis 1.4s infinite ease-in-out both;

		&.dot1 {
			animation-delay: 0s;
		}

		&.dot2 {
			animation-delay: 0.16s;
		}

		&.dot3 {
			animation-delay: 0.32s;
		}
	}

	@keyframes ellipsis {
		0%, 80%, 100% {
			opacity: 1;
		}
		40% {
			opacity: 0;
		}
	}
}
</style>
