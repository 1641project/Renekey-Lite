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

	<MkFoldableSection v-if="userPagination">
		<template #header>{{ i18n.ts.searchResult }}</template>
		<MkUserList :key="`search.user:${counter}`" :pagination="userPagination"/>
	</MkFoldableSection>
</div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import FormInput from '@/components/form/input.vue';
import FormRadios from '@/components/form/radios.vue';
import MkButton from '@/components/MkButton.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkFoldableSection from '@/components/MkFoldableSection.vue';
import MkUserList from '@/components/MkUserList.vue';
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

	if (!query) {
		userPagination.value = null;
		return;
	}

	userPagination.value = {
		endpoint: 'users/search',
		limit: 10,
		params: {
			query,
			origin,
		},
	};

	counter.value++;

	searched.value = true;
	window.setTimeout(() => searched.value = false, 2000);
};
</script>
