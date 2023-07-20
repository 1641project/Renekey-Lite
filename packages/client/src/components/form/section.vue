<template>
<div :class="[$style.root, { [$style.rootFirst]: first }]">
	<div :class="[$style.label, { [$style.labelFirst]: first }]">
		<slot name="label"></slot>
	</div>
	<div :class="$style.main">
		<slot></slot>
	</div>
	<div :class="$style.caption">
		<slot name="caption"></slot>
	</div>
</div>
</template>

<script lang="ts" setup>
defineProps<{
	first?: boolean;
}>();
</script>

<style lang="scss" module>
.root {
	border-top: solid 0.5px var(--divider);
}

.rootFirst,
.root:where(:first-child) {
	border-top: none;
}

.label {
	font-weight: bold;
	padding: 1.5em 0 0 0;
	margin: 0 0 16px 0;

	&:empty {
		display: none;
	}
}

.labelFirst,
:where(.root:first-child) > .label {
	padding-top: 0;
}

.main {
	margin: 1.5em 0 0 0;
}

.caption {
	font-size: 0.85em;
	margin: 8px 0 0 0;
	color: var(--fgTransparentWeak);

	&:empty {
		display: none;
	}
}
</style>
