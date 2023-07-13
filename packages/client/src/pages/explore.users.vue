<template>
<MkSpacer :content-max="1200">
	<MkTab v-model="origin" style="margin-bottom: var(--margin);">
		<option value="local">{{ i18n.ts.local }}</option>
		<option value="remote">{{ i18n.ts.remote }}</option>
	</MkTab>
	<div v-if="origin === 'local'">
		<template v-if="tag == null">
			<MkFoldableSection class="_margin" persist-key="explore-pinned-users">
				<template #header><i class="ti ti-bookmark ti-fw" style="margin-right: 0.5em;"></i>{{ i18n.ts.pinnedUsers }}</template>
				<MkUserList :pagination="pinnedUsers"/>
			</MkFoldableSection>
			<MkFoldableSection class="_margin" persist-key="explore-popular-users">
				<template #header><i class="ti ti-chart-line ti-fw" style="margin-right: 0.5em;"></i>{{ i18n.ts.popularUsers }}</template>
				<MkUserList :pagination="popularUsers"/>
			</MkFoldableSection>
			<MkFoldableSection class="_margin" persist-key="explore-recently-updated-users">
				<template #header><i class="ti ti-message ti-fw" style="margin-right: 0.5em;"></i>{{ i18n.ts.recentlyUpdatedUsers }}</template>
				<MkUserList :pagination="recentlyUpdatedUsers"/>
			</MkFoldableSection>
			<MkFoldableSection class="_margin" persist-key="explore-recently-registered-users">
				<template #header><i class="ti ti-plus ti-fw" style="margin-right: 0.5em;"></i>{{ i18n.ts.recentlyRegisteredUsers }}</template>
				<MkUserList :pagination="recentlyRegisteredUsers"/>
			</MkFoldableSection>
		</template>
	</div>
	<div v-else>
		<MkFoldableSection ref="tagsEl" :foldable="true" :expanded="false" class="_margin">
			<template #header><i class="ti ti-hash ti-fw" style="margin-right: 0.5em;"></i>{{ i18n.ts.popularTags }}</template>

			<div>
				<MkA v-for="tagLocal in tagsLocal" :key="`local:${tagLocal.tag}`" :to="`/explore/tags/${tagLocal.tag}`" style="margin-right: 16px; font-weight: bold;">{{ tagLocal.tag }}</MkA>
				<MkA v-for="tagRemote in tagsRemote" :key="`remote:${tagRemote.tag}`" :to="`/explore/tags/${tagRemote.tag}`" style="margin-right: 16px;">{{ tagRemote.tag }}</MkA>
			</div>
		</MkFoldableSection>

		<MkFoldableSection v-if="tag != null" :key="`${tag}`" class="_margin">
			<template #header><i class="ti ti-hash ti-fw" style="margin-right: 0.5em;"></i>{{ tag }}</template>
			<MkUserList :pagination="tagUsers"/>
		</MkFoldableSection>

		<template v-if="tag == null">
			<MkFoldableSection class="_margin">
				<template #header><i class="ti ti-chart-line ti-fw" style="margin-right: 0.5em;"></i>{{ i18n.ts.popularUsers }}</template>
				<MkUserList :pagination="popularUsersF"/>
			</MkFoldableSection>
			<MkFoldableSection class="_margin">
				<template #header><i class="ti ti-message ti-fw" style="margin-right: 0.5em;"></i>{{ i18n.ts.recentlyUpdatedUsers }}</template>
				<MkUserList :pagination="recentlyUpdatedUsersF"/>
			</MkFoldableSection>
			<MkFoldableSection class="_margin">
				<template #header><i class="ti ti-rocket ti-fw" style="margin-right: 0.5em;"></i>{{ i18n.ts.recentlyDiscoveredUsers }}</template>
				<MkUserList :pagination="recentlyRegisteredUsersF"/>
			</MkFoldableSection>
		</template>
	</div>
</MkSpacer>
</template>

<script lang="ts" setup>
import { } from 'vue';
import MkUserList from '@/components/MkUserList.vue';
import MkFoldableSection from '@/components/MkFoldableSection.vue';
import MkTab from '@/components/MkTab.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';

const props = defineProps<{
	tag?: string;
}>();

let origin = $ref('local');

let tagsLocal = $ref<TagEntity[]>([]);
let tagsRemote = $ref<TagEntity[]>([]);

type TagEntity = {
	tag: string;
	mentionedUsersCount: number;
	mentionedLocalUsersCount: number;
	mentionedRemoteUsersCount: number;
	attachedUsersCount: number;
	attachedLocalUsersCount: number;
	attachedRemoteUsersCount: number;
};

const tagUsers = $computed(() => ({
	endpoint: 'hashtags/users' as const,
	limit: 30,
	params: {
		tag: props.tag,
		origin: 'combined',
		sort: '+follower',
	},
}));

const pinnedUsers = {
	endpoint: 'pinned-users' as const,
	noPaging: true,
};

const popularUsers = {
	endpoint: 'users' as const,
	limit: 10,
	noPaging: true,
	params: {
		state: 'alive',
		origin: 'local',
		sort: '+follower',
	},
};

const recentlyUpdatedUsers = {
	endpoint: 'users' as const,
	limit: 10,
	noPaging: true,
	params: {
		origin: 'local',
		sort: '+updatedAt',
	},
};

const recentlyRegisteredUsers = {
	endpoint: 'users' as const,
	limit: 10,
	noPaging: true,
	params: {
		origin: 'local',
		state: 'alive',
		sort: '+createdAt',
	},
};

const popularUsersF = {
	endpoint: 'users' as const,
	limit: 10,
	noPaging: true,
	params: {
		state: 'alive',
		origin: 'remote',
		sort: '+follower',
	},
};

const recentlyUpdatedUsersF = {
	endpoint: 'users' as const,
	limit: 10,
	noPaging: true,
	params: {
		origin: 'combined',
		sort: '+updatedAt',
	},
};

const recentlyRegisteredUsersF = {
	endpoint: 'users' as const,
	limit: 10,
	noPaging: true,
	params: {
		origin: 'combined',
		sort: '+createdAt',
	},
};

os.api('hashtags/list', {
	sort: '+attachedLocalUsers',
	attachedToLocalUserOnly: true,
	limit: 30,
}).then(tags => {
	const typedTags = tags as TagEntity[];
	tagsLocal = typedTags;
});

os.api('hashtags/list', {
	sort: '+attachedRemoteUsers',
	attachedToRemoteUserOnly: true,
	limit: 30,
}).then(tags => {
	const typedTags = tags as TagEntity[];
	tagsRemote = typedTags;
});
</script>
