<template>
<div
	:class="[$style.root, {
		[$style.paged]: isMainColumn,
		[$style.naked]: naked,
		[$style.active]: active,
		[$style.draghover]: draghover,
		[$style.dragging]: dragging,
		[$style.dropready]: dropready,
	}]"
	@dragover.prevent.stop="onDragover"
	@dragleave="onDragleave"
	@drop.prevent.stop="onDrop"
>
	<header
		:class="[$style.header, {
			[$style.indicated]: indicated,
		}]"
		:draggable="draggable"
		@click="goTop"
		@dragstart="onDragstart"
		@dragend="onDragend"
		@contextmenu.prevent.stop="onContextmenu"
		@wheel="emit('headerWheel', $event)"
	>
		<svg viewBox="0 0 256 128" :class="$style.tabShape">
			<g transform="matrix(6.2431,0,0,6.2431,-677.417,-29.3839)">
				<path d="M149.512,4.707L108.507,4.707C116.252,4.719 118.758,14.958 118.758,14.958C118.758,14.958 121.381,25.283 129.009,25.209L149.512,25.209L149.512,4.707Z" style="fill: var(--deckBg);"/>
			</g>
		</svg>
		<div :class="$style.color"></div>
		<button v-if="isStacked && !isMainColumn" :class="$style.toggleActive" class="_button" @click="toggleActive">
			<template v-if="active"><i class="ti ti-chevron-up"></i></template>
			<template v-else><i class="ti ti-chevron-down"></i></template>
		</button>
		<span :class="$style.title">
			<span :class="$style.titleIcon"><slot name="icon"></slot></span>
			<slot name="header"></slot>
		</span>
		<svg v-if="draggable" viewBox="0 0 16 16" version="1.1" :class="$style.grabber">
			<path fill="currentColor" d="M10 13a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm0-4a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm-4 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm5-9a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM7 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM6 5a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"></path>
		</svg>
		<button v-tooltip="i18n.ts.settings" :class="$style.menu" class="_button" @click.stop="showSettingsMenu"><i class="ti ti-dots"></i></button>
	</header>
	<div v-if="active" ref="body" :class="$style.body"><slot></slot></div>
</div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, provide, ref, shallowRef, watch } from 'vue';
import { updateColumn, swapLeftColumn, swapRightColumn, swapUpColumn, swapDownColumn, stackLeftColumn, popRightColumn, removeColumn, swapColumn, Column } from './deck-store';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { disableContextmenu } from '@/scripts/touch';
import { MenuItem } from '@/types/menu';
import { getHtmlElementFromEvent } from '@/scripts/tms/utils';

provide('shouldHeaderThin', true);
provide('shouldOmitHeaderTitle', true);
provide('forceSpacerMin', true);

const props = withDefaults(defineProps<{
	column: Column;
	isStacked?: boolean;
	naked?: boolean;
	indicated?: boolean;
	menu?: MenuItem[];
	isMobile?: boolean;
}>(), {
	isStacked: false,
	naked: false,
	indicated: false,
	menu: undefined,
	isMobile: false,
});

const emit = defineEmits<{
	(ev: 'change-active-state', v: boolean): void;
	(ev: 'headerWheel', ctx: WheelEvent): void;
}>();

const body = shallowRef<HTMLElement>();

const dragging = ref(false);
watch(dragging, v => os.deckGlobalEvents.emit(v ? 'column.dragStart' : 'column.dragEnd'));

const draghover = ref(false);
const dropready = ref(false);

const isMainColumn = computed(() => props.column.type === 'main');
const active = computed(() => props.column.active !== false);
watch(active, v => emit('change-active-state', v));

const indicated = computed(() => active.value && props.indicated);

const draggable = computed(() => !props.isMobile);

onMounted(() => {
	os.deckGlobalEvents.on('column.dragStart', onOtherDragStart);
	os.deckGlobalEvents.on('column.dragEnd', onOtherDragEnd);
});

onBeforeUnmount(() => {
	os.deckGlobalEvents.off('column.dragStart', onOtherDragStart);
	os.deckGlobalEvents.off('column.dragEnd', onOtherDragEnd);
});

const onOtherDragStart = (): void => {
	if (!draggable.value) return;
	dropready.value = true;
};

const onOtherDragEnd = (): void => {
	if (!draggable.value) return;
	dropready.value = false;
};

const toggleActive = (): void => {
	if (!props.isStacked) return;
	updateColumn(props.column.id, {
		active: !props.column.active,
	});
};

const getMenu = (): MenuItem[] => {
	let items: MenuItem[] = [{
		icon: 'ti ti-settings',
		text: i18n.ts._deck.configureColumn,
		action: async (): Promise<void> => {
			const { canceled, result } = await os.form(props.column.name ?? '', {
				name: {
					type: 'string' as const,
					label: i18n.ts.name,
					default: props.column.name,
				},
				width: {
					type: 'number' as const,
					label: i18n.ts.width,
					default: props.column.width,
				},
				flexible: {
					type: 'boolean' as const,
					label: i18n.ts.flexible,
					default: props.column.flexible,
				},
			}) as any;
			if (canceled) return;
			updateColumn(props.column.id, result);
		},
	}, {
		type: 'parent',
		text: i18n.ts.move + '...',
		icon: 'ti ti-arrows-move',
		children: [{
			icon: 'ti ti-arrow-left',
			text: i18n.ts._deck.swapLeft,
			action: (): void => {
				swapLeftColumn(props.column.id);
			},
		}, {
			icon: 'ti ti-arrow-right',
			text: i18n.ts._deck.swapRight,
			action: (): void => {
				swapRightColumn(props.column.id);
			},
		}, props.isStacked ? {
			icon: 'ti ti-arrow-up',
			text: i18n.ts._deck.swapUp,
			action: (): void => {
				swapUpColumn(props.column.id);
			},
		} : undefined, props.isStacked ? {
			icon: 'ti ti-arrow-down',
			text: i18n.ts._deck.swapDown,
			action: (): void => {
				swapDownColumn(props.column.id);
			},
		} : undefined],
	}, {
		icon: 'ti ti-stack-2',
		text: i18n.ts._deck.stackLeft,
		action: (): void => {
			stackLeftColumn(props.column.id);
		},
	}, props.isStacked ? {
		icon: 'ti ti-window-maximize',
		text: i18n.ts._deck.popRight,
		action: (): void => {
			popRightColumn(props.column.id);
		},
	} : undefined, null, {
		icon: 'ti ti-trash',
		text: i18n.ts.remove,
		danger: true,
		action: (): void => {
			removeColumn(props.column.id);
		},
	}];

	if (props.menu && props.menu.length !== 0) {
		items = [...props.menu, null, ...items];
	}

	return items;
};

const showSettingsMenu = (ev: MouseEvent): void => {
	os.popupMenu(getMenu(), getHtmlElementFromEvent(ev) ?? undefined);
};

const onContextmenu = (ev: MouseEvent): void => {
	if (disableContextmenu) return;
	os.contextMenu(getMenu(), ev);
};

const goTop = (): void => {
	body.value?.scrollTo({
		top: 0,
		behavior: 'smooth',
	});
};

const onDragstart = (ev: DragEvent): void => {
	if (!draggable.value) return;
	if (!ev.dataTransfer) return;

	ev.dataTransfer.effectAllowed = 'move';
	ev.dataTransfer.setData(_DATA_TRANSFER_DECK_COLUMN_, props.column.id);

	// Chromeのバグで、Dragstartハンドラ内ですぐにDOMを変更する(=リアクティブなプロパティを変更する)とDragが終了してしまう
	// SEE: https://stackoverflow.com/questions/19639969/html5-dragend-event-firing-immediately
	window.setTimeout(() => {
		dragging.value = true;
	}, 10);
};

const onDragend = (_ev: DragEvent): void => {
	if (!draggable.value) return;
	dragging.value = false;
};

const onDragover = (ev: DragEvent): void => {
	if (!draggable.value) return;
	if (!ev.dataTransfer) return;

	// 自分自身がドラッグされている場合
	if (dragging.value) {
		// 自分自身にはドロップさせない
		ev.dataTransfer.dropEffect = 'none';
	} else {
		const isDeckColumn = ev.dataTransfer.types[0] === _DATA_TRANSFER_DECK_COLUMN_;

		ev.dataTransfer.dropEffect = isDeckColumn ? 'move' : 'none';

		if (isDeckColumn) draghover.value = true;
	}
};

const onDragleave = (): void => {
	if (!draggable.value) return;
	draghover.value = false;
};

const onDrop = (ev: DragEvent): void => {
	if (!draggable.value) return;
	if (!ev.dataTransfer) return;

	draghover.value = false;
	os.deckGlobalEvents.emit('column.dragEnd');

	const id = ev.dataTransfer.getData(_DATA_TRANSFER_DECK_COLUMN_);
	if (id) {
		swapColumn(props.column.id, id);
	}
};
</script>

<style lang="scss" module>
.root {
	--root-margin: 10px;
	--deckColumnHeaderHeight: 38px;

	height: 100%;
	overflow: hidden; // fallback (overflow: clip)
	overflow: clip;
	contain: strict;
	border-radius: 10px;

	&.draghover {
		&::after {
			content: "";
			display: block;
			position: absolute;
			z-index: 1000;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: var(--focus);
		}
	}

	&.dragging {
		&::after {
			content: "";
			display: block;
			position: absolute;
			z-index: 1000;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: var(--focus);
			opacity: 0.5;
		}
	}

	&.dropready {
		* {
			pointer-events: none;
		}
	}

	&:not(.active) {
		flex-basis: var(--deckColumnHeaderHeight);
		min-height: var(--deckColumnHeaderHeight);
		border-bottom-right-radius: 0;
	}

	&.naked {
		background: var(--acrylicBg) !important;
		-webkit-backdrop-filter: var(--blur, blur(10px));
		backdrop-filter: var(--blur, blur(10px));

		> .header {
			background: transparent;
			box-shadow: none;
			color: var(--fg);
		}

		> .body {
			background: transparent !important;

			&::-webkit-scrollbar-track {
				background: transparent;
			}
			scrollbar-color: var(--scrollbarHandle) transparent;
		}
	}

	&.paged {
		background: var(--bg) !important;

		> .body {
			background: var(--bg) !important;
			overflow-y: scroll !important;

			&::-webkit-scrollbar-track {
				background: inherit;
			}
			scrollbar-color: var(--scrollbarHandle) transparent;
		}
	}
}

.header {
	position: relative;
	display: flex;
	z-index: 2;
	line-height: var(--deckColumnHeaderHeight);
	height: var(--deckColumnHeaderHeight);
	padding: 0 16px 0 30px;
	font-size: 0.9em;
	color: var(--panelHeaderFg);
	background: var(--panelHeaderBg);
	box-shadow: 0 1px 0 0 var(--panelHeaderDivider);
	cursor: pointer;
	user-select: none;

	&.indicated {
		box-shadow: 0 3px 0 0 var(--accent);
	}
}

.color {
	position: absolute;
	top: 12px;
	left: 12px;
	width: 3px;
	height: calc(100% - 24px);
	background: var(--accent);
	border-radius: 999px;
}

.tabShape {
	position: absolute;
	top: 0;
	right: -8px;
	width: auto;
	height: calc(100% - 6px);
}

.title {
	display: inline-block;
	align-items: center;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	width: 100%;
}

.titleIcon {
	margin-right: 8px;

	&:empty {
		display: none;
	}
}

.toggleActive,
.menu {
	z-index: 1;
	width: var(--deckColumnHeaderHeight);
	line-height: var(--deckColumnHeaderHeight);
}

.toggleActive {
	margin-left: -16px;
}

.grabber {
	margin-left: auto;
	margin-right: 10px;
	padding: 8px 8px;
	box-sizing: border-box;
	height: var(--deckColumnHeaderHeight);
	cursor: move;
	user-select: none;
	opacity: 0.5;
}

.menu {
	margin-right: -16px;
}

.body {
	height: calc(100% - var(--deckColumnHeaderHeight));
	overflow-y: auto;
	overflow-x: hidden; // fallback (overflow: clip)
	overflow-x: clip;
	overscroll-behavior-y: contain;
	box-sizing: border-box;
	container-type: size;
	background-color: var(--bg);

	&::-webkit-scrollbar-track {
		background: var(--panel);
	}
	scrollbar-color: var(--scrollbarHandle) var(--panel);
}
</style>
