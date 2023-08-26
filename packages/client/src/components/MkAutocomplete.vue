<template>
<div ref="rootEl" :class="$style.root" class="swhvrteh _popup _shadow" :style="{ zIndex }" @contextmenu.prevent="() => {}">
	<ol v-if="type === 'user'" ref="suggests" :class="$style.list">
		<li v-for="user in users" tabindex="-1" :class="$style.item" @click="complete(type, user)" @keydown="onKeydown">
			<img :class="$style.avatar" :src="user.avatarUrl"/>
			<span :class="$style.userName">
				<MkUserName :key="user.id" :user="user"/>
			</span>
			<span>@{{ acct(user) }}</span>
		</li>
		<li tabindex="-1" :class="$style.item" @click="chooseUser()" @keydown="onKeydown">{{ i18n.ts.selectUser }}</li>
	</ol>
	<ol v-else-if="hashtags.length > 0" ref="suggests" :class="$style.list">
		<li v-for="hashtag in hashtags" tabindex="-1" :class="$style.item" @click="complete(type, hashtag)" @keydown="onKeydown">
			<span class="name">{{ hashtag }}</span>
		</li>
	</ol>
	<ol v-else-if="emojis.length > 0" ref="suggests" :class="$style.list">
		<li v-for="emoji in emojis" :key="emoji.emoji" :class="$style.item" tabindex="-1" @click="complete(type, emoji.emoji)" @keydown="onKeydown">
			<img
				v-if="emoji.isCustomEmoji && emoji.url"
				:class="$style.emoji"
				:src="defaultStore.state.disableShowingAnimatedImages ? getStaticImageUrl(emoji.url) : emoji.url"
				:alt="emoji.emoji"
				decoding="async"
			/>
			<img
				v-else-if="!defaultStore.state.useOsNativeEmojis && emoji.url"
				:class="$style.emoji"
				:src="emoji.url"
				:alt="emoji.emoji"
				decoding="async"
			/>
			<MkCondensedLine v-else :class="$style.emoji" :min-scale="2 / 3">{{ emoji.emoji }}</MkCondensedLine>

			<!-- eslint-disable-next-line vue/no-v-html -->
			<span v-if="q" :class="$style.emojiName" v-html="sanitizeHtml(emoji.name.replace(q, `<b>${q}</b>`))"></span>
			<span v-else>{{ emoji.name }}</span>

			<span v-if="emoji.aliasOf" :class="$style.emojiAlias">({{ emoji.aliasOf }})</span>
		</li>
	</ol>
	<ol v-else-if="mfmTags.length > 0" ref="suggests" :class="$style.list">
		<li v-for="tag in mfmTags" tabindex="-1" :class="$style.item" @click="complete(type, tag)" @keydown="onKeydown">
			<span>{{ tag }}</span>
		</li>
	</ol>
</div>
</template>

<script lang="ts">
import { markRaw, ref, shallowRef, computed, onUpdated, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import sanitizeHtml from 'sanitize-html';
import * as os from '@/os';
import { defaultStore } from '@/store';
import { instance } from '@/instance';
import { i18n } from '@/i18n';
import contains from '@/scripts/contains';
import { char2filePath } from '@/scripts/twemoji-base';
import { getStaticImageUrl } from '@/scripts/get-static-image-url';
import { MFM_TAGS } from '@/scripts/mfm-tags';
import { emojilist } from '@/scripts/emojilist';
import { parseArray } from '@/scripts/tms/parse';
import { acct } from '@/filters/user';

type EmojiDef = {
	emoji: string;
	name: string;
	aliasOf?: string;
	url: string;
	isCustomEmoji: false;
} | {
	emoji: string;
	name: string;
	aliasOf?: string;
	url: string;
	isCustomEmoji: true;
};

const lib = emojilist.filter(x => x.category !== 'flags');

const emojiDb = computed(() => {
	//#region Unicode Emoji
	const unicodeEmojiDB: EmojiDef[] = lib.map(x => ({
		emoji: x.char,
		name: x.name,
		url: char2filePath(x.char),
		isCustomEmoji: false,
	}));

	for (const x of lib) {
		if (x.keywords) {
			for (const k of x.keywords) {
				unicodeEmojiDB.push({
					emoji: x.char,
					name: k,
					aliasOf: x.name,
					url: char2filePath(x.char),
					isCustomEmoji: false,
				});
			}
		}
	}

	unicodeEmojiDB.sort((a, b) => a.name.length - b.name.length);
	//#endregion

	//#region Custom Emoji
	const customEmojis = instance.emojis ?? [];
	const customEmojiDB: EmojiDef[] = [];

	for (const x of customEmojis) {
		customEmojiDB.push({
			emoji: `:${x.name}:`,
			name: x.name,
			url: x.url,
			isCustomEmoji: true,
		});

		if (x.aliases) {
			for (const alias of x.aliases) {
				customEmojiDB.push({
					emoji: `:${x.name}:`,
					name: alias,
					aliasOf: x.name,
					url: x.url,
					isCustomEmoji: true,
				});
			}
		}
	}

	customEmojiDB.sort((a, b) => a.name.length - b.name.length);
	//#endregion

	return markRaw([...customEmojiDB, ...unicodeEmojiDB]);
});

export default {
	emojiDb,
	emojilist,
};
</script>

<script lang="ts" setup>
const props = defineProps<{
	type: string;
	q: string | null;
	textarea: HTMLTextAreaElement;
	close: () => void;
	x: number;
	y: number;
}>();

const emit = defineEmits<{
	(event: 'done', value: { type: string; value: any }): void;
	(event: 'closed'): void;
}>();

const suggests = ref<Element>();
const rootEl = shallowRef<HTMLDivElement>();

const fetching = ref(true);
const users = ref<any[]>([]);
const hashtags = ref<any[]>([]);
const emojis = ref<(EmojiDef)[]>([]);
const items = ref<Element[] | HTMLCollection>([]);
const mfmTags = ref<string[]>([]);
const select = ref(-1);
const zIndex = os.claimZIndex('high');

const complete = (type: string, value: any): void => {
	emit('done', { type, value });
	emit('closed');
	if (type === 'emoji') {
		let recents = defaultStore.state.recentlyUsedEmojis;
		recents = recents.filter((emoji: any) => emoji !== value);
		recents.unshift(value);
		defaultStore.set('recentlyUsedEmojis', recents.splice(0, 32));
	}
};

const setPosition = (): void => {
	if (!rootEl.value) return;
	if (props.x + rootEl.value.offsetWidth > window.innerWidth) {
		rootEl.value.style.left = `${window.innerWidth - rootEl.value.offsetWidth}px`;
	} else {
		rootEl.value.style.left = `${props.x}px`;
	}
	if (props.y + rootEl.value.offsetHeight > window.innerHeight) {
		rootEl.value.style.top = `${props.y - rootEl.value.offsetHeight}px`;
		rootEl.value.style.marginTop = '0';
	} else {
		rootEl.value.style.top = `${props.y}px`;
		rootEl.value.style.marginTop = 'calc(1em + 8px)';
	}
};

const exec = (): void => {
	select.value = -1;
	if (suggests.value) {
		for (const el of Array.from(items.value)) {
			el.removeAttribute('data-selected');
		}
	}
	if (props.type === 'user') {
		if (!props.q) {
			users.value = [];
			fetching.value = false;
			return;
		}

		const cacheKey = `autocomplete:user:${props.q}`;
		const cache = sessionStorage.getItem(cacheKey);

		if (cache) {
			users.value = parseArray<any[]>(cache);
			fetching.value = false;
		} else {
			os.api('users/search-by-username-and-host', {
				username: props.q,
				limit: 10,
				detail: false,
			}).then(searchedUsers => {
				users.value = searchedUsers as any[];
				fetching.value = false;
				// キャッシュ
				sessionStorage.setItem(cacheKey, JSON.stringify(searchedUsers));
			});
		}
	} else if (props.type === 'hashtag') {
		if (!props.q || props.q === '') {
			hashtags.value = parseArray<any[]>(localStorage.getItem('hashtags'));
			fetching.value = false;
		} else {
			const cacheKey = `autocomplete:hashtag:${props.q}`;
			const cache = sessionStorage.getItem(cacheKey);
			if (cache) {
				hashtags.value = parseArray<any[]>(cache);
				fetching.value = false;
			} else {
				os.api('hashtags/search', {
					query: props.q,
					limit: 30,
				}).then(searchedHashtags => {
					hashtags.value = searchedHashtags as any[];
					fetching.value = false;
					// キャッシュ
					sessionStorage.setItem(cacheKey, JSON.stringify(searchedHashtags));
				});
			}
		}
	} else if (props.type === 'emoji') {
		if (!props.q || props.q === '') {
			// 最近使った絵文字をサジェスト
			emojis.value = defaultStore.state.recentlyUsedEmojis.map(emoji => emojiDb.value.find(dbEmoji => dbEmoji.emoji === emoji)).filter(x => x) as EmojiDef[];
			return;
		}

		const matched: EmojiDef[] = [];
		const max = 30;

		emojiDb.value.some(x => {
			if (x.name.startsWith(props.q ?? '') && !x.aliasOf && !matched.some(y => y.emoji === x.emoji)) matched.push(x);
			return matched.length === max;
		});

		if (matched.length < max) {
			emojiDb.value.some(x => {
				if (x.name.startsWith(props.q ?? '') && !matched.some(y => y.emoji === x.emoji)) matched.push(x);
				return matched.length === max;
			});
		}

		if (matched.length < max) {
			emojiDb.value.some(x => {
				if (x.name.includes(props.q ?? '') && !matched.some(y => y.emoji === x.emoji)) matched.push(x);
				return matched.length === max;
			});
		}

		emojis.value = matched;
	} else if (props.type === 'mfmTag') {
		if (!props.q || props.q === '') {
			mfmTags.value = MFM_TAGS;
			return;
		}

		mfmTags.value = MFM_TAGS.filter(tag => tag.startsWith(props.q ?? ''));
	}
};

const onMousedown = (event: Event): void => {
	if (!contains(rootEl.value, event.target) && (rootEl.value !== event.target)) props.close();
};

const onKeydown = (event: KeyboardEvent): void => {
	const cancel = () => {
		event.preventDefault();
		event.stopPropagation();
	};

	switch (event.key) {
		case 'Enter':
			if (select.value !== -1) {
				cancel();
				(items.value[select.value] as any).click();
			} else {
				props.close();
			}
			break;

		case 'Escape':
		case 'Esc':
			cancel();
			props.close();
			break;

		case 'ArrowUp':
			if (select.value !== -1) {
				cancel();
				selectPrev();
			} else {
				props.close();
			}
			break;

		case 'Tab':
		case 'ArrowDown':
			cancel();
			selectNext();
			break;

		default:
			event.stopPropagation();
			props.textarea.focus();
	}
};

const selectNext = (): void => {
	if (++select.value >= items.value.length) select.value = 0;
	if (items.value.length === 0) select.value = -1;
	applySelect();
};

const selectPrev = (): void => {
	if (--select.value < 0) select.value = items.value.length - 1;
	applySelect();
};

const applySelect = (): void => {
	for (const el of Array.from(items.value)) {
		el.removeAttribute('data-selected');
	}

	if (select.value !== -1) {
		items.value[select.value].setAttribute('data-selected', 'true');
		(items.value[select.value] as any).focus();
	}
};

const chooseUser = (): void => {
	props.close();
	os.selectUser().then(user => {
		complete('user', user);
		props.textarea.focus();
	});
};

onUpdated(() => {
	setPosition();
	items.value = suggests.value?.children ?? [];
});

onMounted(() => {
	setPosition();

	props.textarea.addEventListener('keydown', onKeydown);

	document.body.addEventListener('mousedown', onMousedown);

	nextTick(() => {
		exec();

		watch(() => props.q, () => {
			nextTick(() => {
				exec();
			});
		});
	});
});

onBeforeUnmount(() => {
	props.textarea.removeEventListener('keydown', onKeydown);

	document.body.removeEventListener('mousedown', onMousedown);
});
</script>

<style lang="scss" module>
.root {
	position: fixed;
	max-width: 100%;
	margin-top: calc(1em + 8px);
	overflow: hidden; // fallback (overflow: clip)
	overflow: clip;
	transition: top 0.1s ease, left 0.1s ease;
}

.list {
	display: block;
	margin: 0;
	padding: 4px 0;
	max-height: 190px;
	max-width: 500px;
	overflow: auto;
	list-style: none;
}

.item {
	display: flex;
	align-items: center;
	padding: 4px 12px;
	white-space: nowrap;
	overflow: hidden; // fallback (overflow: clip)
	overflow: clip;
	font-size: 0.9em;
	cursor: default;
	-webkit-user-select: none;
	user-select: none;
	text-overflow: ellipsis;

	&:hover {
		background: var(--X3);
	}

	&[data-selected='true'] {
		background: var(--accent);
		color: #fff !important;
	}

	&:active {
		background: var(--accentDarken);
		color: #fff !important;
	}
}

.avatar {
	min-width: 28px;
	min-height: 28px;
	max-width: 28px;
	max-height: 28px;
	margin: 0 8px 0 0;
	border-radius: 100%;
}

.userName {
	margin: 0 8px 0 0;
}

.emoji {
	flex-shrink: 0 !important;
	display: flex !important;
	margin: 0 4px 0 0 !important;
	height: 24px !important;
	width: 24px !important;
	justify-content: center !important;
	align-items: center !important;
	font-size: 20px !important;
	pointer-events: none !important;
}

.emojiImg {
	height: 24px;
	width: 24px;
	object-fit: scale-down;
}

.emojiName {
	flex-shrink: 1;
}

.emojiAlias {
	flex-shrink: 9999999;
	margin: 0 0 0 8px;
}
</style>
