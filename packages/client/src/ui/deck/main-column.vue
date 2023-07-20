<template>
<XColumn v-if="deckStore.state.alwaysShowMainColumn || mainRouter.currentRoute.value.name !== 'index'" :column="column" :is-stacked="isStacked">
	<template #header>
		<template v-if="pageMetadata?.value">
			<i :class="pageMetadata?.value.icon"></i>
			{{ pageMetadata?.value.title }}
		</template>
	</template>

	<div ref="contents">
		<RouterView @contextmenu.stop="onContextmenu"/>
	</div>
</XColumn>
</template>

<script lang="ts" setup>
import { ComputedRef, provide, shallowRef } from 'vue';
import XColumn from './column.vue';
import { deckStore, Column } from '@/ui/deck/deck-store';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { mainRouter } from '@/router';
import { PageMetadata, provideMetadataReceiver } from '@/scripts/page-metadata';
import { disableContextmenu } from '@/scripts/touch';
import { useScrollPositionManager } from '@/nirax';
import { getScrollContainer } from '@/scripts/scroll';

defineProps<{
	column: Column;
	isStacked: boolean;
}>();

const contents = shallowRef<HTMLElement | null>(null);
let pageMetadata = $ref<null | ComputedRef<PageMetadata>>();

provide('router', mainRouter);
provideMetadataReceiver((info) => {
	pageMetadata = info;
});

// const back = (): void => {
// 	history.back();
// };

const onContextmenu = (ev: MouseEvent): void => {
	if (disableContextmenu) return;
	if (!ev.target) return;

	const isLink = (el: HTMLElement): el is HTMLAnchorElement => {
		if (el.tagName === 'A') return true;
		if (el.parentElement) {
			return isLink(el.parentElement);
		}
		return false;
	};
	if (isLink(ev.target as HTMLElement)) return;
	if (['INPUT', 'TEXTAREA', 'IMG', 'VIDEO', 'CANVAS'].includes((ev.target as HTMLElement).tagName) || (ev.target as HTMLElement).attributes['contenteditable']) return;
	if (window.getSelection()?.toString() !== '') return;
	const path = mainRouter.currentRoute.value.path;
	os.contextMenu([{
		type: 'label',
		text: path,
	}, {
		icon: 'ti ti-window-maximize',
		text: i18n.ts.openInWindow,
		action: (): void => {
			os.pageWindow(path);
		},
	}], ev);
};

useScrollPositionManager(() => getScrollContainer(contents.value), mainRouter);
</script>
