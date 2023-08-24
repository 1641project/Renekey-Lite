<template>
<MkStickyContainer>
	<template #header>
		<MkPageHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs"/>
	</template>

	<MkSpacer v-if="tab === 'note'" :content-max="800">
		<XNote @searched="noteSearched"/>
	</MkSpacer>

	<MkSpacer v-else-if="tab === 'user'" :content-max="800">
		<XUser @searched="userSearched"/>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, ref, watch } from 'vue';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

const XNote = defineAsyncComponent(() => import('./search.note.vue'));
const XUser = defineAsyncComponent(() => import('./search.user.vue'));

const tab = ref<'note' | 'user'>('note');

const noteSearchedQuery = ref('');
const noteSearched = (q: {
	query: string;
}): void => {
	noteSearchedQuery.value = q.query;
};

const userSearchedQuery = ref('');
const userSearched = (q: {
	query: string;
}): void => {
	userSearchedQuery.value = q.query;
};

watch(tab, newTab => {
	if (newTab === 'note') {
		userSearchedQuery.value = '';
	}
	if (newTab === 'user') {
		noteSearchedQuery.value = '';
	}
});

const searchedQuery = computed(() => {
	if (tab.value === 'note') return noteSearchedQuery.value || null;
	if (tab.value === 'user') return userSearchedQuery.value || null;
	return null;
});

const headerActions = computed(() => []);

const headerTabs = computed(() => [{
	key: 'note' as const,
	title: i18n.ts.notes,
	icon: 'ti ti-pencil',
}, {
	key: 'user' as const,
	title: i18n.ts.users,
	icon: 'ti ti-users',
}]);

definePageMetadata(computed(() => ({
	title: searchedQuery.value
		? i18n.t('searchWith', { q: searchedQuery.value })
		: i18n.ts.search,
	icon: 'ti ti-search',
})));
</script>
