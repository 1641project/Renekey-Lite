<template>
<MkStickyContainer>
	<template #header><XHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :content-max="900">
		<div class="_gaps_m">
			<section v-for="announcement in announcements" :key="announcement.id" :class="{ [$style.isEditing]: announcement[isEditing] }">
				<div class="_panel _gaps_m" style="padding: 24px;">
					<MkInput v-model="announcement.title">
						<template #label>{{ i18n.ts.title }}</template>
					</MkInput>
					<MkTextarea v-model="announcement.text">
						<template #label>{{ i18n.ts.text }}</template>
					</MkTextarea>
					<MkInput v-model="announcement.imageUrl">
						<template #label>{{ i18n.ts.imageUrl }}</template>
					</MkInput>
					<p v-if="'reads' in announcement && announcement.reads !== 0">{{ i18n.t('nUsersRead', { n: announcement.reads }) }}</p>
					<div class="_buttons">
						<MkButton inline primary :disabled="announcement.title === '' || announcement.text === ''" @click="save(announcement)"><i class="ti ti-check"></i> {{ i18n.ts.save }}</MkButton>
						<MkButton inline danger @click="remove(announcement)"><i class="ti ti-trash"></i> {{ i18n.ts.remove }}</MkButton>
					</div>
				</div>
			</section>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { watch } from 'vue';
import { v4 as uuid } from 'uuid';
import XHeader from './_header_.vue';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/form/input.vue';
import MkTextarea from '@/components/form/textarea.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

const isEditing = Symbol();
const isNew = Symbol();

type AnnouncementResponse = {
	id: string;
	createdAt: string;
	updatedAt: string | null;
	text: string;
	title: string;
	imageUrl: string | null;
	reads: number;
};

type Announcement = {
	id: string;
	createdAt: string;
	updatedAt: string | null;
	text: string;
	title: string;
	imageUrl: string;
	reads: number;
	[isEditing]: boolean;
	[isNew]: false;
};

type EditedAnnouncement = {
	id: string;
	text: string;
	title: string;
	imageUrl: string;
	[isEditing]: boolean;
	[isNew]: true;
};

let announcements: (Announcement | EditedAnnouncement)[] = $ref([]);

// 変更を検知
watch(() => announcements.map(({ id, text, title, imageUrl }) => ({ id, text, title, imageUrl })), (newAnnouncements, oldAnnouncements) => {
	for (const newAnnouncement of newAnnouncements) {
		const announcementId = newAnnouncement.id;
		const oldAnnouncement = oldAnnouncements.find(({ id }) => announcementId === id) ?? null;
		if (
			oldAnnouncement && (
				newAnnouncement.text !== oldAnnouncement.text ||
				newAnnouncement.title !== oldAnnouncement.title ||
				newAnnouncement.imageUrl !== oldAnnouncement.imageUrl
			)
		) {
			const announcement = announcements.find(({ id }) => announcementId === id) ?? null;
			if (announcement) {
				announcement[isEditing] = true;
			}
		}
	}
}, { deep: true });

// 新規追加
const add = (): void => {
	announcements.unshift({
		id: uuid(),
		title: '',
		text: '',
		imageUrl: '',
		[isEditing]: false,
		[isNew]: true,
	});
};

// 削除
const remove = (announcement: Announcement | EditedAnnouncement): void => {
	// 新規作成で未編集の場合
	if (announcement[isNew] && !announcement[isEditing]) {
		announcements = announcements.filter(x => x !== announcement);
		return;
	}
	os.confirm({
		type: 'warning',
		text: i18n.t('removeAreYouSure', { x: announcement.title }),
	}).then(({ canceled }) => {
		if (canceled) return;
		announcements = announcements.filter(x => x !== announcement);
		if (!announcement[isNew]) {
			os.api('admin/announcements/delete', announcement);
		}
	});
};

// 保存
const save = (announcement: Announcement | EditedAnnouncement): void => {
	// 新規作成の場合
	if (announcement[isNew]) {
		const { text, title, imageUrl } = announcement;
		os.api('admin/announcements/create', {
			title,
			text,
			imageUrl: imageUrl || null,
		}).then(() => {
			remove(announcement);
			refresh();
			os.alert({
				type: 'success',
				text: i18n.ts.saved,
			});
		}).catch(err => {
			os.alert({
				type: 'error',
				text: err,
			});
		});
	} else {
		const { id, text, title, imageUrl } = announcement;
		os.api('admin/announcements/update', {
			id,
			title,
			text,
			imageUrl: imageUrl || null,
		}).then(() => {
			announcement[isEditing] = false;
			refresh();
			os.alert({
				type: 'success',
				text: i18n.ts.saved,
			});
		}).catch(err => {
			os.alert({
				type: 'error',
				text: err,
			});
		});
	}
};

// 更新
const refresh = (): void => {
	const editingAnnouncements = announcements.flatMap(announcement => {
		return announcement[isEditing] || announcement[isNew] ? [announcement] : [];
	});
	os.api('admin/announcements/list').then(announcementResponse => {
		const typedAnnouncementResponse = (announcementResponse as AnnouncementResponse[]);
		const refreshedAnnouncements = typedAnnouncementResponse.map<Announcement | EditedAnnouncement>(({ id, createdAt, updatedAt, text, title, imageUrl, reads }) => {
			return {
				id,
				createdAt,
				updatedAt,
				text,
				title,
				imageUrl: imageUrl || '',
				reads,
				[isEditing]: false,
				[isNew]: false,
			};
		});
		editingAnnouncements.forEach(itemA => {
			const index = refreshedAnnouncements.findIndex(({ id }) => itemA.id === id);
			if (index !== -1) {
				refreshedAnnouncements[index] = itemA;
			} else {
				refreshedAnnouncements.unshift(itemA);
			}
		});
		announcements = [...refreshedAnnouncements];
	});
};

refresh();

const headerActions = $computed(() => [{
	asFullButton: true,
	icon: 'ti ti-plus',
	text: i18n.ts.add,
	handler: add,
}]);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.announcements,
	icon: 'ti ti-speakerphone',
});
</script>

<style lang="scss" module>
.isEditing {
	outline: solid 2px var(--divider);
}
</style>
