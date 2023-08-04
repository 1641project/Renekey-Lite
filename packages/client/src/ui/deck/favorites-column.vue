<template>
<XColumn :column="column" :is-stacked="isStacked" :indicated="indicated">
	<template #icon><i class="ti ti-star"></i></template>
	<template #header>{{ column.name }}</template>

	<MkPagination ref="pagingComponent" :pagination="pagination" @queue="queueUpdated">
		<template #empty>
			<div class="_fullinfo">
				<img src="https://xn--931a.moe/assets/info.jpg" class="_ghost"/>
				<div>{{ i18n.ts.noNotes }}</div>
			</div>
		</template>

		<template #default="{ items }">
			<div :class="$style.notes">
				<MkDateSeparatedList v-slot="{ item }" :items="items" :direction="'down'" :no-gap="true" :ad="false">
					<MkNote :key="item.id" :note="item.note"/>
				</MkDateSeparatedList>
			</div>
		</template>
	</MkPagination>
</XColumn>
</template>

<script lang="ts" setup>
import { ref, shallowRef } from 'vue';
import XColumn from './column.vue';
import { Column } from './deck-store';
import MkPagination from '@/components/MkPagination.vue';
import MkNote from '@/components/MkNote.vue';
import MkDateSeparatedList from '@/components/MkDateSeparatedList.vue';
import { i18n } from '@/i18n';

defineProps<{
	column: Column;
	isStacked: boolean;
}>();

const indicated = ref(false);

const queueUpdated = (q: number): void => {
	indicated.value = q !== 0;
};

const pagingComponent = shallowRef<InstanceType<typeof MkPagination>>();

const pagination = {
	endpoint: 'i/favorites' as const,
	limit: 10,
};
</script>

<style lang="scss" module>
.notes {
	background: var(--panel);
}
</style>
