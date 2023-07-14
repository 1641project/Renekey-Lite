<template>
<div class="_gaps">
	<div class="_gaps">
		<MkInput v-model="searchQuery" :large="true" :autofocus="true" type="search" @enter="searchEnabled ? search() : null">
			<template #prefix><i class="ti ti-search"></i></template>
		</MkInput>
		<MkFolder>
			<template #label>{{ i18n.ts.options }}</template>

			<MkRadios v-model="searchOrigin">
				<option value="combined">{{ i18n.ts.all }}</option>
				<option value="local">{{ i18n.ts.local }}</option>
				<option value="remote">{{ i18n.ts.remote }}</option>
			</MkRadios>
		</MkFolder>
		<MkButton large primary gradate rounded style="margin: 0 auto;" :disabled="!searchEnabled" @click="search">{{ i18n.ts.search }}</MkButton>
	</div>

	<MkFoldableSection v-if="userPagination">
		<template #header>{{ i18n.ts.searchResult }}</template>
		<MkUserList :key="`search.user:${counter}`" :pagination="userPagination"/>
	</MkFoldableSection>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import MkInput from '@/components/form/input.vue';
import MkRadios from '@/components/form/radios.vue';
import MkButton from '@/components/MkButton.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkFoldableSection from '@/components/MkFoldableSection.vue';
import MkUserList from '@/components/MkUserList.vue';
import { i18n } from '@/i18n';
import { useRouter } from '@/router';

useRouter();

type SearchOrigin = 'combined' | 'local' | 'remote';

let counter = $ref(0);

let searchQuery = $ref<string>('');
let searchOrigin = $ref<SearchOrigin>('combined');

let prevSearchQuery = $ref<string | null>(null);
let prevSearchOrigin = $ref<SearchOrigin | null>(null);

const searchEnabled = computed<boolean>(() => {
	// 入力されていなければ無効
	if (!searchQuery) return false;

	// 初期状態なら有効
	if (prevSearchQuery == null || prevSearchOrigin == null) return true;

	// 入力内容が同じなら無効
	if (searchQuery === prevSearchQuery && searchOrigin === prevSearchOrigin) return false;

	return true;
});

let userPagination = $ref<{
	endpoint: 'users/search';
	limit: 10;
	params: {
		query: string;
		origin: SearchOrigin;
	};
} | null>(null);

const search = async (): Promise<void> => {
	const query = searchQuery.toString().trim();
	const origin = searchOrigin;

	if (!query) {
		userPagination = null;
	}

	userPagination = {
		endpoint: 'users/search',
		limit: 10,
		params: {
			query,
			origin,
		},
	};

	counter++;
};
</script>
