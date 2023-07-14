<template>
<div class="_gaps">
	<div class="_gaps">
		<MkInput v-model="searchQuery" :large="true" :autofocus="true" type="search" @enter="searchEnabled ? search() : null">
			<template #prefix><i class="ti ti-search"></i></template>
		</MkInput>
		<MkFolder>
			<template #label>{{ i18n.ts.options }}</template>

			<MkFolder :default-open="true">
				<template #label>{{ i18n.ts.specifyUser }}</template>
				<template v-if="user" #suffix><MkUserName :user="user"/></template>
				<div style="text-align: center;" class="_gaps">
					<div v-if="user"><MkUserName :user="user"/></div>
					<div>
						<MkButton v-if="user == null" primary rounded inline @click="selectUser">{{ i18n.ts.selectUser }}</MkButton>
						<MkButton v-else danger rounded inline @click="user = null">{{ i18n.ts.remove }}</MkButton>
					</div>
				</div>
			</MkFolder>
		</MkFolder>
		<MkButton large primary gradate rounded style="margin: 0 auto;" :disabled="!searchEnabled" @click="search">{{ i18n.ts.search }}</MkButton>
	</div>

	<MkFoldableSection v-if="notePagination">
		<template #header>{{ i18n.ts.searchResult }}</template>
		<MkNotes :key="`search.note:${counter}`" :pagination="notePagination"/>
	</MkFoldableSection>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import * as Misskey from 'misskey-js';
import MkInput from '@/components/form/input.vue';
import MkButton from '@/components/MkButton.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkFoldableSection from '@/components/MkFoldableSection.vue';
import MkNotes from '@/components/MkNotes.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { useRouter } from '@/router';

useRouter();

let counter = $ref(0);

let searchQuery = $ref('');
let user = $ref<Misskey.entities.UserDetailed | null>(null);

let prevSearchQuery = $ref<string | null>(null);
let prevUserId = $ref<string | null>(null);

const searchEnabled = computed<boolean>(() => {
	// 入力されていなければ無効
	if (!searchQuery) return false;

	// 初期状態なら有効
	if (prevSearchQuery == null) return true;

	// 入力内容が同じなら無効
	if (searchQuery === prevSearchQuery && user?.id === prevUserId) return false;

	return true;
});

let notePagination = $ref<{
	endpoint: 'notes/search';
	limit: 10;
	params: {
		query: string;
		userId: string | null;
	};
} | null>(null);

const selectUser = (): void => {
	os.selectUser().then(_user => {
		user = _user;
	});
};

const search = async (): Promise<void> => {
	const query = searchQuery.toString().trim();
	const userId = user?.id ?? null;

	if (!query) {
		notePagination = null;
	}

	notePagination = {
		endpoint: 'notes/search',
		limit: 10,
		params: {
			query,
			userId,
		},
	};

	counter++;
};
</script>
