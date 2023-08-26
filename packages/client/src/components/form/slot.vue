<template>
<div>
	<div :class="$style.label" @click="focus"><slot name="label"></slot></div>
	<div>
		<slot></slot>
	</div>
	<div :class="$style.caption"><slot name="caption"></slot></div>
</div>
</template>

<script lang="ts" setup>
import { } from 'vue';

const focus = (): void => {
	// TODO
};
</script>

<style lang="scss" module>
.label {
	font-size: 0.85em;
	padding: 0 0 8px 0;
	-webkit-user-select: none;
	user-select: none;

	&:empty {
		display: none;
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
</style>
