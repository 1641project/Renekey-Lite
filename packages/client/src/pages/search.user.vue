<template>
<div class="_gaps">
	<div class="_gaps">
		<FormInput v-model="searchQuery" large autofocus type="search" @enter="search">
			<template #prefix><i class="ti ti-search"></i></template>
		</FormInput>
		<MkFolder>
			<template #label>{{ i18n.ts.options }}</template>
			<div class="_gaps_s">
				<FormRadios v-model="searchOrigin">
					<option value="combined">{{ i18n.ts.all }}</option>
					<option value="local">{{ i18n.ts.local }}</option>
					<option value="remote">{{ i18n.ts.remote }}</option>
				</FormRadios>
			</div>
		</MkFolder>
		<div class="_buttonsCenter">
			<MkButton large primary gradate rounded :disabled="!searchEnabled" @click="search">{{ i18n.ts.search }}</MkButton>
		</div>
	</div>

	<MkFoldableSection v-if="pickupUser">
		<template #header>{{ i18n.ts._tms.pickup }}</template>
		<div :class="$style.pickupUser">
			<MkUserInfo :key="pickupUser.id" :user="pickupUser"/>
		</div>
	</MkFoldableSection>

	<MkFoldableSection v-if="userPagination">
		<template #header>{{ i18n.ts.searchResult }}</template>
		<MkUserList :key="`search.user:${searchedCounter}`" :pagination="userPagination"/>
	</MkFoldableSection>
</div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import * as Acct from 'misskey-js/built/acct';
import { UserDetailed } from 'misskey-js/built/entities';
import FormInput from '@/components/form/input.vue';
import FormRadios from '@/components/form/radios.vue';
import MkButton from '@/components/MkButton.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkFoldableSection from '@/components/MkFoldableSection.vue';
import MkUserInfo from '@/components/MkUserInfo.vue';
import MkUserList from '@/components/MkUserList.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { useRouter } from '@/router';
import { checkHttpOrHttps } from '@/scripts/tms/check-url';
import { delayedPromise } from '@/scripts/tms/promise';
import { isMisskeyId } from '@/scripts/tms/is-misskey-id';

export type SearchOrigin = 'combined' | 'local' | 'remote';

const props = defineProps<{
	initialQuery?: string | null;
	initialOrigin?: SearchOrigin | null;
}>();

const emit = defineEmits<{
	(ev: 'searched', queries: {
		query: string;
		origin: SearchOrigin;
	}): void;
}>();

useRouter();

const inited = ref(false);

const searched = ref(false);
const searchedCounter = ref(0);

const searchQuery = ref<string>('');
const searchOrigin = ref<SearchOrigin>('combined');

const init = async () => {
	inited.value = false;

	const {
		initialQuery: query,
		initialOrigin: origin,
	} = props;

	if (query) {
		searchQuery.value = query.trim();
	}
	if (origin) {
		searchOrigin.value = origin;
	}

	inited.value = true;
};

init();

const searchEnabled = computed<boolean>(() => {
	// 初期化が完了していなければ無効
	if (!inited.value) return false;

	// 検索済みであれば無効
	if (searched.value) return false;

	// 入力されていなければ無効
	if (!searchQuery.value.trim()) return false;

	return true;
});

const pickupUser = ref<UserDetailed | null>(null);
const userPagination = ref<{
	endpoint: 'users/search';
	limit: 10;
	params: {
		query: string;
		origin: SearchOrigin;
	};
} | null>(null);

const search = async (): Promise<void> => {
	if (!searchEnabled.value) return;

	const query = searchQuery.value.trim();
	const origin = searchOrigin.value;

	emit('searched', { query, origin });

	pickupUser.value = null;
	userPagination.value = null;

	searched.value = true;
	searchedCounter.value++;

	userPagination.value = {
		endpoint: 'users/search' as const,
		limit: 10,
		params: {
			query,
			origin,
		},
	};

	const promiseFromPickup = pickup(query);
	const delayedPromiseFromPickup = delayedPromise(promiseFromPickup, 2000);

	pickupUser.value = await promiseFromPickup;
	await delayedPromiseFromPickup;

	searched.value = false;
};

const pickup = async (query: string): Promise<UserDetailed | null> => {
	const fetchFromAp = async (q: string): Promise<UserDetailed | null> => {
		const result = await os.api('ap/show', {
			uri: q,
		}).catch(() => null);
		return result?.type === 'User' ? result.object : null;
	};

	const fetchFromUserId = async (q: string): Promise<UserDetailed | null> => {
		return os.api('users/show', {
			userId: q,
		}).catch(() => null);
	};

	const fetchFromUsername = async (q: string): Promise<UserDetailed | null> => {
		const { username, host } = Acct.parse(q);
		if (!username) return null;
		return os.api('users/show', {
			username,
			host: host ?? undefined,
		}).catch(() => null);
	};

	if (checkHttpOrHttps(query)) {
		return fetchFromAp(query);
	}
	if (isMisskeyId(query)) {
		return fetchFromUserId(query);
	}
	return fetchFromUsername(query);
};
</script>

<style lang="scss" module>
.pickupUser {
	background: var(--panel);
	border-radius: var(--radius);
	overflow: hidden; // fallback (overflow: clip)
	overflow: clip;
}
</style>
