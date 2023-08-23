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
		<MkUserInfo :key="pickupUser.id" :user="pickupUser"/>
	</MkFoldableSection>

	<MkFoldableSection v-if="userPagination">
		<template #header>{{ i18n.ts.searchResult }}</template>
		<MkUserList :key="`search.user:${counter}`" :pagination="userPagination"/>
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

useRouter();

type SearchOrigin = 'combined' | 'local' | 'remote';

const counter = ref(0);
const searched = ref(false);

const searchQuery = ref<string>('');
const searchOrigin = ref<SearchOrigin>('combined');

const searchEnabled = computed<boolean>(() => {
	// 検索済みであれば無効
	if (searched.value) return false;

	// 入力されていなければ無効
	if (!searchQuery.value) return false;

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

	pickupUser.value = null;
	userPagination.value = null;

	if (!query) return;

	counter.value++;
	searched.value = true;

	userPagination.value = {
		endpoint: 'users/search' as const,
		limit: 10,
		params: {
			query,
			origin,
		},
	};

	const promiseFromPickup = pickup(query);
	await waitForPromiseAndDelay(promiseFromPickup, 2000);
	pickupUser.value = await promiseFromPickup;

	searched.value = false;
};

const pickup = async (query: string): Promise<UserDetailed | null> => {
	const fetchFromAp = async (): Promise<UserDetailed | null> => {
		if (!(query.startsWith('http://') || query.startsWith('https://'))) return null;
		const result = await os.api('ap/show', {
			uri: query,
		}).catch(() => null);
		return result?.type === 'User' ? result.object : null;
	};

	const fetchFromUsername = async (): Promise<UserDetailed | null> => {
		const { username, host } = Acct.parse(query);
		return os.api('users/show', {
			username,
			host: host ?? undefined,
		}).catch(() => null);
	};

	const fetchFromUserId = async (): Promise<UserDetailed | null> => {
		if (query.startsWith('@')) return null;
		return os.api('users/show', {
			userId: query,
		}).catch(() => null);
	};

	return await fetchFromAp() ?? await fetchFromUsername() ?? await fetchFromUserId();
};

const waitForPromiseAndDelay = (prom: Promise<unknown>, delay: number): Promise<void> => {
	return new Promise(r => window.setTimeout(() => prom.finally(r), delay));
};
</script>
