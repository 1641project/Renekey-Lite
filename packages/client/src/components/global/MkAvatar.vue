<template>
<component
	:is="link ? MkA : 'span'"
	v-user-preview="preview ? user.id : undefined"
	v-bind="bound"
	class="eiwwqkts _noSelect"
	:class="[$style.root, {
		[$style.animation]: animation,
		[$style.cat]: (user as any).isCat,
		[$style.square]: squareAvatars,
	}, {
		animation,
		cat: (user as any).isCat,
		square: squareAvatars,
	}]"
	:style="{ color }"
	:title="acct(user)"
	@click="onClick"
>
	<MkImgWithBlurhash
		:class="$style.inner"
		:src="url"
		:hash="user?.avatarBlurhash"
		:cover="true"
		:only-avg-color="true"
	/>
	<MkUserOnlineIndicator
		v-if="indicator"
		:class="$style.indicator"
		:user="user"
	/>
	<div v-if="(user as any).isCat" :class="[$style.ears]">
		<div :class="$style.earLeft"></div>
		<div :class="$style.earRight"></div>
	</div>
</component>
</template>

<script lang="ts" setup>
import { watch } from 'vue';
import * as Misskey from 'misskey-js';
import MkA from '@/components/global/MkA.vue';
import MkImgWithBlurhash from '@/components/MkImgWithBlurhash.vue';
import MkUserOnlineIndicator from '@/components/MkUserOnlineIndicator.vue';
import { defaultStore } from '@/store';
import { acct, userPage } from '@/filters/user';
import { getStaticImageUrl } from '@/scripts/get-static-image-url';
import { extractAvgColorFromBlurhash } from '@/scripts/extract-avg-color-from-blurhash';

const animation = $ref(defaultStore.state.animation);
const squareAvatars = $ref(defaultStore.state.squareAvatars);

const props = withDefaults(defineProps<{
	user: Misskey.entities.User;
	target?: string | null;
	link?: boolean;
	preview?: boolean;
	indicator?: boolean;
}>(), {
	target: null,
	link: false,
	preview: false,
	indicator: false,
});

const emit = defineEmits<{
	(ev: 'click', v: MouseEvent): void;
}>();

const bound = $computed(() => props.link
	// MkA
	? {
		to: userPage(props.user),
		target: props.target,
	}
	// span
	: {
	});

const url = $computed(() => defaultStore.state.disableShowingAnimatedImages
	? getStaticImageUrl(props.user.avatarUrl)
	: props.user.avatarUrl);

const onClick = (ev: MouseEvent): void => {
	if (props.link) return;
	emit('click', ev);
};

let color = $ref<string | undefined>();

watch(() => props.user.avatarBlurhash, () => {
	color = extractAvgColorFromBlurhash(props.user.avatarBlurhash);
}, {
	immediate: true,
});
</script>

<style lang="scss" module>
@layer global {
	@keyframes earwiggleleft {
		from { transform: rotate(37.6deg) skew(30deg); }
		25% { transform: rotate(10deg) skew(30deg); }
		50% { transform: rotate(20deg) skew(30deg); }
		75% { transform: rotate(0deg) skew(30deg); }
		to { transform: rotate(37.6deg) skew(30deg); }
	}

	@keyframes earwiggleright {
		from { transform: rotate(-37.6deg) skew(-30deg); }
		30% { transform: rotate(-10deg) skew(-30deg); }
		55% { transform: rotate(-20deg) skew(-30deg); }
		75% { transform: rotate(0deg) skew(-30deg); }
		to { transform: rotate(-37.6deg) skew(-30deg); }
	}

	@keyframes eartightleft {
		from { transform: rotate(37.6deg) skew(30deg); }
		50% { transform: rotate(37.4deg) skew(30deg); }
		to { transform: rotate(37.6deg) skew(30deg); }
	}

	@keyframes eartightright {
		from { transform: rotate(-37.6deg) skew(-30deg); }
		50% { transform: rotate(-37.4deg) skew(-30deg); }
		to { transform: rotate(-37.6deg) skew(-30deg); }
	}

	.root {
		position: relative;
		display: inline-block;
		vertical-align: bottom;
		flex-shrink: 0;
		border-radius: 100%;
		line-height: 16px;
	}

	.inner {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		top: 0;
		border-radius: 100%;
		z-index: 1;
		overflow: hidden; // fallback (overflow: clip)
		overflow: clip;
		object-fit: cover;
		width: 100%;
		height: 100%;
	}

	.indicator {
		position: absolute;
		z-index: 1;
		bottom: 0;
		left: 0;
		width: 20%;
		height: 20%;
	}

	.square {
		border-radius: 20%;

		> .inner {
			border-radius: 20%;
		}
	}

	.cat {
		> .ears {
			contain: strict;
			position: absolute;
			top: -50%;
			left: -50%;
			width: 100%;
			height: 100%;
			padding: 50%;
			pointer-events: none;

			> .earLeft,
			> .earRight {
				contain: strict;
				display: inline-block;
				height: 50%;
				width: 50%;
				background: currentColor;

				&::after {
					contain: strict;
					content: '';
					display: block;
					width: 60%;
					height: 60%;
					margin: 20%;
					background: #df548f;
				}
			}

			> .earLeft {
				transform: rotate(37.5deg) skew(30deg);

				&, &::after {
					border-radius: 25% 75% 75% 75%;
				}
			}

			> .earRight {
				transform: rotate(-37.5deg) skew(-30deg);

				&, &::after {
					border-radius: 75% 25% 75% 75%;
				}
			}
		}

		&.animation:hover {
			> .ears {
				> .earLeft {
					animation: earwiggleleft 1s infinite;
				}

				> .earRight {
					animation: earwiggleright 1s infinite;
				}
			}
		}
	}
}
</style>
