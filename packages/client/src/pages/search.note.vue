<template>
<div class="_gaps">
	<div class="_gaps">
		<FormInput v-model="searchQuery" large autofocus type="search" @enter="searchEnabled ? search() : null">
			<template #prefix><i class="ti ti-search"></i></template>
		</FormInput>
		<MkFolder>
			<template #label>{{ i18n.ts.options }}</template>
			<div class="_gaps_s">
				<div class="_gaps_s">
					<div>{{ i18n.ts.specifyUser }}</div>
					<div class="_buttonsCenter">
						<MkButton v-if="searchUser" danger rounded inline @click="searchUser = null">{{ i18n.ts.remove }}</MkButton>
						<MkButton v-else rounded inline @click="selectUser">{{ i18n.ts.selectUser }}</MkButton>
					</div>
					<div v-if="searchUser" :class="$style.searchUser">
						<MkAvatar :user="searchUser" :class="$style.searchUserAvatar" indicator/>
						<div :class="$style.searchUserBody">
							<MkUserName :user="searchUser" :class="['_nowrap', $style.searchUserName]"/>
							<MkAcct :user="searchUser" :class="['_nowrap', $style.searchUserAcct]" detail/>
						</div>
					</div>
				</div>
			</div>
		</MkFolder>
		<div class="_buttonsCenter">
			<MkButton large primary gradate rounded :disabled="!searchEnabled" @click="search">{{ i18n.ts.search }}</MkButton>
		</div>
	</div>

	<MkFoldableSection v-if="notePagination">
		<template #header>{{ i18n.ts.searchResult }}</template>
		<MkNotes :key="`search.note:${counter}`" :pagination="notePagination"/>
	</MkFoldableSection>
</div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import * as Misskey from 'misskey-js';
import FormInput from '@/components/form/input.vue';
import MkButton from '@/components/MkButton.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkFoldableSection from '@/components/MkFoldableSection.vue';
import MkNotes from '@/components/MkNotes.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { useRouter } from '@/router';

useRouter();

const counter = ref(0);

const searchQuery = ref('');
const searchUser = ref<Misskey.entities.UserDetailed | null>(null);

// TODO: 重複チェックは必要か？
// const prevSearchQuery = ref<string | null>(null);
// const prevSearchUserId = ref<string | null>(null);

const searchEnabled = computed<boolean>(() => {
	// 入力されていなければ無効
	if (!searchQuery.value) return false;

	// // 初期状態なら有効
	// if (prevSearchQuery.value == null) return true;

	// // 入力内容が同じなら無効
	// if (searchQuery.value === prevSearchQuery.value && searchUser.value?.id === prevSearchUserId.value) return false;

	return true;
});

const notePagination = ref<{
	endpoint: 'notes/search';
	limit: 10;
	params: {
		query: string;
		userId: string | null;
	};
} | null>(null);

const selectUser = (): void => {
	os.selectUser().then(_user => {
		searchUser.value = _user;
	});
};

const search = async (): Promise<void> => {
	const query = searchQuery.toString().trim();
	const userId = searchUser.value?.id ?? null;

	if (!query) {
		notePagination.value = null;
	}

	notePagination.value = {
		endpoint: 'notes/search',
		limit: 10,
		params: {
			query,
			userId,
		},
	};

	counter.value++;
};
</script>

<style lang="scss" module>
.searchUser {
	display: flex;
	gap: 8px;
	align-items: center;
	padding: 8px;
	font-size: 14px;
}

.searchUserBody {
	min-width: 0;
}

.searchUserAvatar {
	width: 45px;
	height: 45px;
}

.searchUserName {
	display: block;
	font-weight: bold;
}

.searchUserAcct {
	display: block;
	opacity: 0.5;
}
</style>
