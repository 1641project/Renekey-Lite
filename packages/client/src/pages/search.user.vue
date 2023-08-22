<template>
<div class="_gaps">
	<div class="_gaps">
		<FormInput v-model="searchQuery" large autofocus type="search" @enter="searchEnabled ? search() : null">
			<template #prefix><i class="ti ti-search"></i></template>
		</FormInput>
		<MkFolder>
			<template #label>{{ i18n.ts.options }}</template>
			<div>
				<FormSection first>
					<FormRadios v-model="searchOrigin">
						<option value="combined">{{ i18n.ts.all }}</option>
						<option value="local">{{ i18n.ts.local }}</option>
						<option value="remote">{{ i18n.ts.remote }}</option>
					</FormRadios>
				</FormSection>
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
import FormSection from '@/components/form/section.vue';
import MkButton from '@/components/MkButton.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkFoldableSection from '@/components/MkFoldableSection.vue';
import MkUserList from '@/components/MkUserList.vue';
import { i18n } from '@/i18n';
import { useRouter } from '@/router';

useRouter();

type SearchOrigin = 'combined' | 'local' | 'remote';

const counter = ref(0);

const searchQuery = ref<string>('');
const searchOrigin = ref<SearchOrigin>('combined');

// TODO: 重複チェックは必要か？
// const prevSearchQuery = ref<string | null>(null);
// const prevSearchOrigin = ref<SearchOrigin | null>(null);

const searchEnabled = computed<boolean>(() => {
	// 入力されていなければ無効
	if (!searchQuery.value) return false;

	// // 初期状態なら有効
	// if (prevSearchQuery.value == null || prevSearchOrigin.value == null) return true;

	// // 入力内容が同じなら無効
	// if (searchQuery.value === prevSearchQuery.value && searchOrigin.value === prevSearchOrigin.value) return false;

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
	const query = searchQuery.toString().trim();
	const origin = searchOrigin.value;

	if (!query) {
		userPagination.value = null;
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
};
</script>
