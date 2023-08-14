<template>
<button ref="buttonRef" class="eddddedb _button" :class="{ canRenote, canPakuru }" @click="renote()">
	<template v-if="canRenote">
		<i class="ti ti-repeat"></i>
		<p v-if="count > 0" class="count">{{ count }}</p>
	</template>
	<i v-else class="ti ti-ban"></i>
</button>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import * as Misskey from 'misskey-js';
import XDetails from '@/components/MkUsersTooltip.vue';
import MkRippleEffect from '@/components/MkRippleEffect.vue';
import { pleaseLogin } from '@/scripts/please-login';
import * as os from '@/os';
import { $i } from '@/account';
import { useTooltip } from '@/scripts/use-tooltip';
import { i18n } from '@/i18n';
import { pakuru, numberquote } from '@/scripts/tms/pakuru';
import { tmsStore } from '@/tms/store';
import { MenuItem } from '@/types/menu';
import { enqueuePendingPost } from '@/scripts/tms/post';

const props = defineProps<{
	note: Misskey.entities.Note;
	count: number;
}>();

const buttonRef = ref<HTMLElement>();

const canRenote = computed(() => ['public', 'home'].includes(props.note.visibility) || props.note.userId === $i?.id);
const canPakuru = computed(() => tmsStore.state.usePakuru || tmsStore.state.useNumberquote);

const renoteAnime = (): void => {
	const el = buttonRef.value;
	if (el) {
		const rect = el.getBoundingClientRect();
		const x = rect.left + (el.offsetWidth / 2);
		const y = rect.top + (el.offsetHeight / 2);
		os.popup(MkRippleEffect, { x, y }, {}, 'end');
	}
};

useTooltip(buttonRef, async (showing) => {
	if (!canRenote.value) return;

	const renotes = await os.api('notes/renotes', {
		noteId: props.note.id,
		limit: 11,
	});

	const users = renotes.map(x => x.user);

	if (users.length < 1) return;

	os.popup(XDetails, {
		showing,
		users,
		count: props.count,
		targetElement: buttonRef.value,
	}, {}, 'closed');
});

const renote = (viaKeyboard = false): void => {
	pleaseLogin();

	const menuList: MenuItem[][] = [];

	// チャンネル
	if ((props.note as any).channel) {
		menuList.push([
			// チャンネル内Renote
			{
				text: i18n.ts.inChannelRenote,
				icon: 'ti ti-repeat',
				action: async (): Promise<void> => {
					renoteAnime();

					const { canceled } = await enqueuePendingPost({
						renoteId: props.note.id,
						channelId: (props.note as any).channelId,
					});
					if (!canceled) os.toast(i18n.ts.renoted);
				},
			},
			// チャンネル内引用
			{
				text: i18n.ts.inChannelQuote,
				icon: 'ti ti-quote',
				action: (): void => {
					os.post({
						renote: props.note,
						channel: (props.note as any).channel,
					});
				},
			},
		]);
	}

	// Renote
	if (canRenote.value) {
		menuList.push([
			// Renote
			{
				text: i18n.ts.renote,
				icon: 'ti ti-repeat',
				action: async (): Promise<void> => {
					renoteAnime();

					const { canceled } = await enqueuePendingPost({
						renoteId: props.note.id,
					});
					if (!canceled) os.toast(i18n.ts.renoted);
				},
			},
			// 引用
			{
				text: i18n.ts.quote,
				icon: 'ti ti-quote',
				action: (): void => {
					os.post({
						renote: props.note,
					});
				},
			},
		]);
	}

	// パクる
	if (canPakuru.value) {
		menuList.push([
			// パクる
			tmsStore.state.usePakuru ? {
				text: i18n.ts._tms.pakuru,
				icon: 'ti ti-swipe',
				action: async (): Promise<void> => {
					renoteAnime();

					const { canceled } = await pakuru(props.note);
					if (!canceled) os.toast(i18n.ts._tms.pakured);
				},
			} : undefined,
			// 数字引用
			tmsStore.state.useNumberquote ? {
				text: i18n.ts._tms.numberquote,
				icon: 'ti ti-exposure-plus-1',
				action: async (): Promise<void> => {
					renoteAnime();

					const { canceled } = await numberquote(props.note);
					if (!canceled) os.toast(i18n.ts._tms.numberquoted);
				},
			} : undefined,
		]);
	}

	const menu = menuList
		.map(m => m.filter(v => typeof v !== 'undefined'))
		.filter(m => m.filter(v => v != null).length !== 0)
		.flatMap((m, i) => i === 0 ? m : [null, ...m]);

	if (menu.length === 0) return;

	os.popupMenu(menu, buttonRef.value, { viaKeyboard });
};

defineExpose({
	renote,
});
</script>

<style lang="scss" scoped>
.eddddedb {
	display: inline-block;
	height: 32px;
	margin: 2px;
	padding: 0 6px;
	border-radius: 4px;

	&:not(.canRenote):not(.canPakuru) {
		cursor: default;
	}

	&.renoted {
		background: var(--accent);
	}

	> .count {
		display: inline;
		margin-left: 8px;
		opacity: 0.7;
	}
}
</style>
