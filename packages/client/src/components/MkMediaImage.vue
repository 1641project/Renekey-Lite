<template>
<div
	:class="hide ? $style.hidden : $style.visible"
	:style="darkMode ? '--c: rgba(255, 255, 255, 0.02);' : '--c: rgba(0, 0, 0, 0.02);'"
	@click="onClick"
>
	<a
		:class="$style.imageContainer"
		:href="image.url"
		:title="image.name"
	>
		<MkImgWithBlurhash
			:hash="image.blurhash"
			:src="(defaultStore.state.enableDataSaverMode && hide) ? null : url"
			:force-blurhash="hide"
			:cover="hide"
			:alt="image.comment || image.name"
			:title="image.comment || image.name"
			:width="image.properties.width"
			:height="image.properties.height"
			:style="hide ? 'filter: brightness(0.5);' : undefined"
		/>
	</a>
	<template v-if="hide">
		<div :class="$style.hiddenText">
			<div :class="$style.hiddenTextWrapper">
				<b v-if="image.isSensitive" style="display: block;">
					<i class="ti ti-eye-exclamation"></i> {{ i18n.ts.sensitive }}{{ defaultStore.state.enableDataSaverMode ? ` (${i18n.ts.image}${image.size ? ` ${bytes(image.size)}` : ''})` : '' }}
				</b>
				<b v-else style="display: block;">
					<i class="ti ti-photo"></i> {{ defaultStore.state.enableDataSaverMode && image.size ? bytes(image.size) : i18n.ts.image }}
				</b>
				<span style="display: block;">{{ i18n.ts.clickToShow }}</span>
			</div>
		</div>
	</template>
	<template v-else>
		<button v-tooltip="i18n.ts.hide" :class="['_button', $style.hide]" @click.stop="hide = true">
			<div :class="$style.hideInner"><i class="ti ti-eye-off" style="display: block;"></i></div>
		</button>
		<button :class="['_button', $style.menu]" @click.stop="showMenu">
			<div :class="$style.menuInner"><i class="ti ti-dots" style="display: block;"></i></div>
		</button>
		<div :class="$style.indicators">
			<div v-if="['image/gif', 'image/apng'].includes(image.type)" :class="$style.indicator" @click.stop="() => {}">GIF</div>
			<div v-if="image.comment" :class="$style.indicator" @click.stop="() => {}">ALT</div>
			<div v-if="image.isSensitive" :title="i18n.ts.sensitive" :class="$style.indicator" @click.stop="() => {}">NSFW</div>
		</div>
	</template>
</div>
</template>

<script lang="ts" setup>
import { watch } from 'vue';
import * as Misskey from 'misskey-js';
import MkImgWithBlurhash from '@/components/MkImgWithBlurhash.vue';
import { defaultStore } from '@/store';
import { i18n } from '@/i18n';
import * as os from '@/os';
import { iAmModerator } from '@/account';
import { getStaticImageUrl } from '@/scripts/get-static-image-url';
import bytes from '@/filters/bytes';
import { MenuItem } from '@/types/menu';

const props = defineProps<{
	image: Misskey.entities.DriveFile;
	raw?: boolean;
}>();

let hide = $ref(true);
let darkMode: boolean = $ref(defaultStore.state.darkMode);

const url = $computed(() => (props.raw || defaultStore.state.loadRawImages)
	? props.image.url
	: defaultStore.state.disableShowingAnimatedImages
		? getStaticImageUrl(props.image.url)
		: props.image.thumbnailUrl,
);

const onClick = (): void => {
	if (hide) {
		hide = false;
	}
};

// Plugin:register_note_view_interruptor を使って書き換えられる可能性があるためwatchする
watch(() => props.image, () => {
	hide = (defaultStore.state.nsfw === 'force' || defaultStore.state.enableDataSaverMode) ? true : (props.image.isSensitive && defaultStore.state.nsfw !== 'ignore');
}, {
	deep: true,
	immediate: true,
});

const showMenu = (ev: MouseEvent): void => {
	const menu: MenuItem[] = [
		{
			text: i18n.ts.hide,
			icon: 'ti ti-eye-off',
			action: () => {
				hide = true;
			},
		},
		...iAmModerator ? [
			{
				text: i18n.ts.markAsSensitive,
				icon: 'ti ti-eye-exclamation',
				danger: true,
				action: () => {
					os.apiWithDialog('drive/files/update', {
						fileId: props.image.id,
						isSensitive: true,
					});
				},
			}
		] : [],
	];
	os.popupMenu(menu, ev.currentTarget ?? ev.target);
};

</script>

<style lang="scss" module>
.hidden {
	position: relative;
}

.hiddenText {
	position: absolute;
	left: 0;
	top: 0;
	width: 100%;
	height: 100%;
	z-index: 1;
	display: flex;
	justify-content: center;
	align-items: center;
}

.hiddenTextWrapper {
	display: table-cell;
	text-align: center;
	font-size: 0.8em;
	color: #fff;
}

.visible {
	position: relative;
	// box-shadow: 0 0 0 1px var(--divider) inset;
	background: var(--bg);
	background-image: linear-gradient(
		45deg,
		var(--c) 16.67%,
		var(--bg) 16.67%,
		var(--bg) 50%,
		var(--c) 50%,
		var(--c) 66.67%,
		var(--bg) 66.67%,
		var(--bg) 100%
	);
	background-size: 16px 16px;
}

.hide {
	position: absolute;
	top: 0;
	right: 0;
	bottom: auto;
	left: auto;
	display: flex;
	gap: 6px;
	padding: 8px;
	font-size: 0.8em;
	text-align: center;

	&:empty {
		display: none;
	}
}

.hideInner {
	display: block;
	border-radius: 6px;
	background-color: rgba(0, 0, 0, 0.3);
	-webkit-backdrop-filter: var(--blur, blur(15px));
	backdrop-filter: var(--blur, blur(15px));
	color: #fff;
	padding: 6px 8px;
}

.menu {
	@extend .hide;
	top: auto;
	right: 0;
	bottom: 0;
	left: auto;
}

.menuInner {
	@extend .hideInner;
}

.indicators {
	@extend .hide;
	top: 0;
	right: auto;
	bottom: auto;
	left: 0;
}

.indicator {
	@extend .hideInner;
	font-weight: bold;
}

.imageContainer {
	display: block;
	cursor: zoom-in;
	overflow: hidden;
	width: 100%;
	height: 100%;
	background-position: center;
	background-size: contain;
	background-repeat: no-repeat;
}
</style>
