<template>
<div ref="rootEl" class="hoawjimk">
	<MkMediaBanner v-for="media in mediaList.filter(media => !previewable(media))" :key="media.id" :media="media"/>
	<div v-if="mediaList.filter(media => previewable(media)).length > 0" :class="$style.container">
		<div
			ref="galleryEl"
			v-size="{ max: [320] }"
			:class="[
				$style.medias,
				count === 1 ? [
					$style.n1, {
						[$style.n1_16_9]: defaultStore.reactiveState.mediaListWithOneImageAppearance.value === '16_9',
						[$style.n1_1_1]: defaultStore.reactiveState.mediaListWithOneImageAppearance.value === '1_1',
						[$style.n1_2_3]: defaultStore.reactiveState.mediaListWithOneImageAppearance.value === '2_3',
					},
				]
				: count === 2 ? $style.n2
				: count === 3 ? $style.n3
				: count === 4 ? $style.n4
				: $style.nMany,
			]"
		>
			<template v-for="media in mediaList.filter(media => previewable(media))">
				<MkMediaVideo
					v-if="media.type.startsWith('video')"
					:key="`video:${media.id}`"
					:class="$style.media"
					:video="media"
				/>
				<MkMediaImage
					v-else-if="media.type.startsWith('image')"
					:key="`image:${media.id}`"
					:class="$style.media"
					class="image"
					:data-id="media.id"
					:image="media"
					:raw="raw"
				/>
			</template>
		</div>
	</div>
</div>
</template>

<script lang="ts">
/**
 * expand表示の最小の高さを指定します
 * MkMediaImageのボタンが被るのを防ぐため
 */
const EXPANDED_MIN_HEIGHT = 100;

/**
 * アスペクト比算出のためにHTMLElement.clientWidthを使うが、
 * 大変重たいのでコンテナ要素とメディアリスト幅のペアをキャッシュする
 * （タイムラインごとにスクロールコンテナが存在する前提だが……）
 */
const widthCache = new Map<Element, number>();

/**
 * コンテナ要素がリサイズされたらキャッシュを削除する
 */
const ro = new ResizeObserver(entries => {
	for (const entry of entries) {
		widthCache.delete(entry.target);
	}
});

const getClientWidthWithCache = async (targetEl: HTMLElement, containerEl: HTMLElement, count = 0): Promise<number> => {
	if (_DEV_) console.log('getClientWidthWithCache', { targetEl, containerEl, count, cache: widthCache.get(containerEl) });
	if (widthCache.has(containerEl)) return widthCache.get(containerEl)!;

	const width = targetEl.clientWidth;

	if (count <= 10 && width < EXPANDED_MIN_HEIGHT) {
		// widthが64未満はおかしいのでリトライする
		await new Promise(resolve => setTimeout(resolve, 50));
		return getClientWidthWithCache(targetEl, containerEl, count + 1);
	}

	widthCache.set(containerEl, width);
	ro.observe(containerEl);
	return width;
};
</script>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, shallowRef } from 'vue';
import * as Misskey from 'misskey-js';
// @ts-expect-error https://photoswipe.com/
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import PhotoSwipe from 'photoswipe';
import 'photoswipe/style.css';
import MkMediaBanner from '@/components/MkMediaBanner.vue';
import MkMediaImage from '@/components/MkMediaImage.vue';
import MkMediaVideo from '@/components/MkMediaVideo.vue';
import * as os from '@/os';
import { FILE_TYPE_BROWSERSAFE } from '@/const';
import { defaultStore } from '@/store';
import { getScrollContainer, getBodyScrollHeight } from '@/scripts/scroll';

const props = defineProps<{
	mediaList: Misskey.entities.DriveFile[];
	raw?: boolean;
}>();

const rootEl = shallowRef<HTMLDivElement | null>(null);
const containerEl = shallowRef<HTMLElement | null>(null);
const galleryEl = shallowRef<HTMLDivElement | null>(null);

const pswpZIndex = os.claimZIndex('middle');
document.documentElement.style.setProperty('--mk-pswp-root-z-index', pswpZIndex.toString());

const count = computed(() => props.mediaList.filter(media => previewable(media)).length);
let lightbox: PhotoSwipeLightbox | null;

const popstateHandler = (): void => {
	if (lightbox.pswp && lightbox.pswp.isOpen === true) {
		lightbox.pswp.close();
	}
};

/**
 * アスペクト比をmediaListWithOneImageAppearanceに基づいていい感じに調整する
 * aspect-ratioではなくheightを使う
 */
const calcAspectRatio = async (): Promise<void> => {
	if (!galleryEl.value || !rootEl.value) return;

	const img = props.mediaList[0];

	if (props.mediaList.length !== 1 || !(img.properties.width && img.properties.height)) {
		galleryEl.value.style.aspectRatio = '';
		return;
	}

	if (!containerEl.value) containerEl.value = getScrollContainer(rootEl.value);
	const width = containerEl.value ? await getClientWidthWithCache(rootEl.value, containerEl.value) : rootEl.value.clientWidth;

	const heightMin = (ratio: number) => {
		const imgResizeRatio = width / img.properties.width;
		const imgDrawHeight = img.properties.height * imgResizeRatio;
		const maxHeight = width * ratio;
		const height = Math.min(imgDrawHeight, maxHeight);
		if (_DEV_) console.log('Image height calculated:', { width, properties: img.properties, imgResizeRatio, imgDrawHeight, maxHeight, height });
		return `${height}px`;
	};

	switch (defaultStore.state.mediaListWithOneImageAppearance) {
		case '16_9':
			galleryEl.value.style.height = heightMin(9 / 16);
			break;
		case '1_1':
			galleryEl.value.style.height = heightMin(1);
			break;
		case '2_3':
			galleryEl.value.style.height = heightMin(3 / 2);
			break;
		default: {
			const maxHeight = Math.max(EXPANDED_MIN_HEIGHT, (containerEl.value ? containerEl.value.clientHeight : getBodyScrollHeight()) * 0.5 || 360);
			if (width === 0 || !maxHeight) return;
			const imgResizeRatio = width / img.properties.width;
			const imgDrawHeight = img.properties.height * imgResizeRatio;
			galleryEl.value.style.height = `${Math.max(EXPANDED_MIN_HEIGHT, Math.min(imgDrawHeight, maxHeight))}px`;
			galleryEl.value.style.minHeight = 'initial';
			galleryEl.value.style.maxHeight = 'initial';
			break;
		}
	}

	galleryEl.value.style.aspectRatio = 'initial';
};

onMounted(() => {
	calcAspectRatio();

	lightbox = new PhotoSwipeLightbox({
		dataSource: props.mediaList
			.filter(media => {
				if (media.type === 'image/svg+xml') return true; // svgのwebpublicはpngなのでtrue
				return media.type.startsWith('image') && FILE_TYPE_BROWSERSAFE.includes(media.type);
			})
			.map(media => {
				const item = {
					src: media.url,
					w: media.properties.width,
					h: media.properties.height,
					alt: media.comment ?? media.name,
					comment: media.comment ?? media.name,
				};
				if (media.properties.orientation != null && media.properties.orientation >= 5) {
					[item.w, item.h] = [item.h, item.w];
				}
				return item;
			}),
		gallery: galleryEl.value,
		mainClass: 'pswp',
		children: '.image',
		thumbSelector: '.image',
		loop: false,
		padding: window.innerWidth > 500
			? {
				top: 32,
				right: 32,
				bottom: 32,
				left: 32,
			}
			: {
				top: 0,
				right: 0,
				bottom: 0,
				left: 0,
			},
		imageClickAction: 'toggle-controls',
		tapAction: 'toggle-controls',
		doubleTapAction: 'zoom',
		bgOpacity: 1,
		showHideAnimationType: 'fade',
		showAnimationDuration: 100,
		hideAnimationDuration: 100,
		pswpModule: PhotoSwipe,
	});

	lightbox.on('itemData', (ev: any) => {
		const { itemData } = ev;

		// element is children
		const { element } = itemData;

		const id = element.dataset.id;
		const file = props.mediaList.find(media => media.id === id);
		if (!file) return;

		itemData.src = file.url;
		itemData.w = Number(file.properties.width);
		itemData.h = Number(file.properties.height);
		if (file.properties.orientation != null && file.properties.orientation >= 5) {
			[itemData.w, itemData.h] = [itemData.h, itemData.w];
		}
		itemData.msrc = file.thumbnailUrl;
		itemData.alt = file.comment ?? file.name;
		itemData.comment = file.comment ?? file.name;
		itemData.thumbCropped = true;
	});

	lightbox.on('uiRegister', () => {
		lightbox.pswp.ui.registerElement({
			name: 'altText',
			className: 'pwsp__alt-text-container',
			appendTo: 'wrapper',
			onInit: (el: HTMLElement, pwsp: PhotoSwipe) => {
				const textBox = document.createElement('div');
				const textBoxInner = document.createElement('div');

				textBox.classList.add('pwsp__alt-text', '_shadow', '_noSelect');
				textBoxInner.classList.add('pwsp__alt-text-inner');

				textBox.appendChild(textBoxInner);
				el.appendChild(textBox);

				pwsp.on('change', () => {
					textBoxInner.textContent = (pwsp.currSlide?.data?.comment as string | undefined) ?? null;
				});
			},
		});
	});

	lightbox.init();

	window.addEventListener('popstate', popstateHandler);

	lightbox.on('beforeOpen', () => {
		history.pushState(null, '', '#pswp');
	});

	lightbox.on('close', () => {
		if (window.location.hash === '#pswp') {
			history.back();
		}
	});
});

onUnmounted(() => {
	window.removeEventListener('popstate', popstateHandler);
	lightbox?.destroy();
	lightbox = null;
});

const previewable = (file: Misskey.entities.DriveFile): boolean => {
	if (file.type === 'image/svg+xml') return true; // svgのwebpublic/thumbnailはpngなのでtrue
	// FILE_TYPE_BROWSERSAFEに適合しないものはブラウザで表示するのに不適切
	return (file.type.startsWith('video') || file.type.startsWith('image')) && FILE_TYPE_BROWSERSAFE.includes(file.type);
};
</script>

<style lang="scss" module>
.container {
	container-type: inline-size;
	position: relative;
	width: 100%;
	margin-top: 4px;
}

.medias {
	display: grid;
	gap: 8px;

	width: 100%;
	height: 100%;

	&.n1 {
		grid-template-rows: 1fr;

		// default but fallback (expand)
		min-height: v-bind("`${EXPANDED_MIN_HEIGHT}px`");
		max-height: clamp(v-bind("`${EXPANDED_MIN_HEIGHT}px`"), 50vh, min(360px, 50vh)); // fallback (cqh units)
		max-height: clamp(v-bind("`${EXPANDED_MIN_HEIGHT}px`"), 50cqh, min(360px, 50vh));

		&.n1_16_9 {
			min-height: initial;
			max-height: initial;
			aspect-ratio: 16 / 9; // fallback
		}

		&.n1_1_1{
			min-height: initial;
			max-height: initial;
			aspect-ratio: 1 / 1; // fallback
		}

		&.n1_2_3 {
			min-height: initial;
			max-height: initial;
			aspect-ratio: 2 / 3; // fallback
		}
	}

	&.n2 {
		aspect-ratio: 16 / 9;
		grid-template-columns: 1fr 1fr;
		grid-template-rows: 1fr;
	}

	&.n3 {
		aspect-ratio: 16 / 9;
		grid-template-columns: 1fr 1fr;
		grid-template-rows: 1fr 1fr;

		> .media:nth-child(1) {
			grid-row: 1 / 3;
		}

		> .media:nth-child(3) {
			grid-column: 2 / 3;
			grid-row: 2 / 3;
		}
	}

	&.n4 {
		aspect-ratio: 16 / 9;
		grid-template-columns: 1fr 1fr;
		grid-template-rows: 1fr 1fr;
	}

	&.nMany {
		grid-template-columns: 1fr 1fr;

		> .media {
			aspect-ratio: 16 / 9;
		}
	}

	&:not(.n1):global(.max-width_320px) {
		aspect-ratio: auto !important;
		grid-template-columns: 1fr !important;
		grid-template-rows: none !important;

		> .media {
			aspect-ratio: 16 / 9 !important;
			grid-column: auto !important;
			grid-row: auto !important
		}
	}
}

.media {
	overflow: hidden; // clipにするとバグる
	border-radius: 8px;
}

:global(.pswp) {
	--pswp-root-z-index: var(--mk-pswp-root-z-index, 2000700) !important;
	--pswp-bg: var(--modalBg) !important;
}

// :global(.pswp__bg) {
// 	background: var(--modalBg);
// }

:global(.pwsp__alt-text-container) {
	position: absolute;
	right: 8px;
	bottom: max(12px, var(--safeAreaInsetBottom));
	left: 8px;
	margin: 0 auto;
	width: max-content;
	max-width: min(calc(100% - 16px), 800px);
}

:global(.pwsp__alt-text) {
	background-color: rgba(0, 0, 0, 0.7);
	-webkit-backdrop-filter: var(--blur, blur(15px));
	backdrop-filter: var(--blur, blur(15px));
	color: #fff;
	text-align: center;
	padding: var(--margin);
	border-radius: var(--radius);
}

:global(.pwsp__alt-text-inner) {
	display: -webkit-box;
	-webkit-line-clamp: 3;
	-webkit-box-orient: vertical;
	overflow: hidden; // fallback (overflow: clip)
	overflow: clip;
	white-space: pre-line;
}
</style>
