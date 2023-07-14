<template>
<MkTooltip ref="tooltip" :showing="showing" :target-element="targetElement" :max-width="340" @closed="emit('closed')">
	<div :class="$style.root">
		<MkReactionIcon :reaction="reaction" :custom-emojis="emojis" :class="$style.icon" :no-style="true"/>
		<div :class="$style.name">{{ getReactionName(reaction) }}</div>
	</div>
</MkTooltip>
</template>

<script lang="ts" setup>
import { } from 'vue';
import MkTooltip from '@/components/MkTooltip.vue';
import MkReactionIcon from '@/components/MkReactionIcon.vue';
import { getEmojiName } from '@/scripts/emojilist';

defineProps<{
	showing: boolean;
	reaction: string;
	emojis: {
		name: string;
		url: string;
	}[];
	targetElement: HTMLElement;
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

const getReactionName = (reaction: string): string => {
	const trimLocal = reaction.replace('@.', '');
	if (trimLocal.startsWith(':')) {
		return trimLocal;
	}
	return getEmojiName(reaction) ?? reaction;
};
</script>

<style lang="scss" module>
.root {
	text-align: center;
}

.icon {
	display: block;
	width: 60px;
	font-size: 60px; // unicodeな絵文字についてはwidthが効かないため
	margin: 0 auto;
	object-fit: contain;
}

.name {
	font-size: 0.9em;
}
</style>
