<template>
<MkStickyContainer>
	<template #header>
		<MkPageHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs"/>
	</template>
	<div>
		<div v-if="tab === 'featured'">
			<XFeatured/>
		</div>
		<div v-else-if="tab === 'users'">
			<XUsers/>
		</div>
	</div>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, computed } from 'vue';
import { definePageMetadata } from '@/scripts/page-metadata';
import { i18n } from '@/i18n';

const XFeatured = defineAsyncComponent(() => import('./explore.featured.vue'));
const XUsers = defineAsyncComponent(() => import('./explore.users.vue'));

const props = withDefaults(defineProps<{
	tag?: string;
	initialTab?: string;
}>(), {
	tag: undefined,
	initialTab: 'featured',
});

let tab = $ref(props.initialTab);

const headerActions = $computed(() => []);

const headerTabs = $computed(() => [{
	key: 'featured',
	icon: 'ti ti-bolt',
	title: i18n.ts.featured,
}, {
	key: 'users',
	icon: 'ti ti-users',
	title: i18n.ts.users,
}]);

definePageMetadata(computed(() => ({
	title: i18n.ts.explore,
	icon: 'ti ti-hash',
})));
</script>
