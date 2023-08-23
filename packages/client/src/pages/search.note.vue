<template>
<div class="_gaps">
	<div class="_gaps">
		<FormInput v-model="searchQuery" large autofocus type="search" @enter="search">
			<template #prefix><i class="ti ti-search"></i></template>
		</FormInput>
		<MkFolder>
			<template #label>{{ i18n.ts.options }}</template>
			<div class="_gaps_s">
				<TmsBorderSection :active="searchUser != null">
					<template #label>{{ i18n.ts.specifyUser }}</template>
					<template #button>
						<MkButton v-if="searchUser != null" danger rounded inline @click="searchUser = null">{{ i18n.ts.remove }}</MkButton>
						<MkButton v-else rounded inline @click="selectUser">{{ i18n.ts.selectUser }}</MkButton>
					</template>
					<div v-if="searchUser != null" :class="$style.searchUser">
						<MkAvatar :user="searchUser" :class="$style.searchUserAvatar" indicator/>
						<div :class="$style.searchUserBody">
							<MkUserName :user="searchUser" :class="['_nowrap', $style.searchUserName]"/>
							<MkAcct :user="searchUser" :class="['_nowrap', $style.searchUserAcct]" detail/>
						</div>
					</div>
				</TmsBorderSection>
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
import TmsBorderSection from '@/components/TmsBorderSection.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { useRouter } from '@/router';

useRouter();

const counter = ref(0);
const searched = ref(false);

const searchQuery = ref('');
const searchUser = ref<Misskey.entities.UserDetailed | null>(null);

const searchEnabled = computed<boolean>(() => {
	// 検索済みであれば無効
	if (searched.value) return false;

	// 入力されていなければ無効
	if (!searchQuery.value) return false;

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
	if (!searchEnabled.value) return;

	const query = searchQuery.value.trim();
	const userId = searchUser.value?.id ?? null;

	if (!query) {
		notePagination.value = null;
		return;
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

	searched.value = true;
	window.setTimeout(() => searched.value = false, 2000);
};
</script>

<style lang="scss" module>
.searchUser {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px;
	font-size: 14px;
}

.searchUserBody {
	min-width: 0; // SEE: https://johnykei.net/front-end/css/flex-item-with-min-width-0-to-fix-overflowed-flexbox/
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
