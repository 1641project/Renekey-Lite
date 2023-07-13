<template>
<MkStickyContainer>
	<template #header>
		<MkPageHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs"/>
	</template>

	<MkSpacer v-if="tab === 'note'" :content-max="800">
		<XNote/>
	</MkSpacer>

	<MkSpacer v-else-if="tab === 'user'" :content-max="800">
		<XUser/>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent } from 'vue';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

const XNote = defineAsyncComponent(() => import('./search.note.vue'));
const XUser = defineAsyncComponent(() => import('./search.user.vue'));

let tab = $ref('note');

const headerActions = $computed(() => []);

const headerTabs = $computed(() => [{
	key: 'note',
	title: i18n.ts.notes,
	icon: 'ti ti-pencil',
}, {
	key: 'user',
	title: i18n.ts.users,
	icon: 'ti ti-users',
}]);

definePageMetadata(computed(() => ({
	title: i18n.ts.search,
	icon: 'ti ti-search',
})));
</script>
