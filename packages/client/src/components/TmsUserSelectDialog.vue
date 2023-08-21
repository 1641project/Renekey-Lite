<template>
<MkModalWindow
	ref="dialogEl"
	@click="cancel()"
	@close="cancel()"
	@closed="emit('closed')"
>
	<template #header>{{ i18n.ts.selectUser }}</template>
	<div class="_gaps">
		<div :class="$style.form">
			<FormSplit :min-width="170">
				<FormInput v-model="inputUserName" :autofocus="true" @update:model-value="search">
					<template #label>{{ i18n.ts.username }}</template>
					<template #prefix>@</template>
				</FormInput>
				<FormInput v-model="inputHostName" :datalist="[hostname]" @update:model-value="search">
					<template #label>{{ i18n.ts.host }}</template>
					<template #prefix>@</template>
				</FormInput>
			</FormSplit>
		</div>
		<div class="_gaps">
			<div :class="['_button', $style.matchUser]" @click="showMatchUser ? matchUserOk : lookupUser">
				<template v-if="showMatchUser">
					<div>{{ i18n.ts.lookup }}:</div>
					<div><MkAcct :user="matchUser" detail/></div>
				</template>
				<template v-else>
					<div>{{ i18n.ts.lookup }}</div>
				</template>
			</div>
			<div v-if="showSearchUsers">
				<XUser v-for="searchUser in searchUsers" :key="searchUser.id" :user="searchUser" @select="ok"/>
			</div>
			<div v-if="showRecentUsers">
				<XUser v-for="recentUser in recentUsers" :key="recentUser.id" :user="recentUser" @select="ok"/>
			</div>
			<div v-if="!showSearchUsers && !showRecentUsers" class="_fullinfo">
				<img src="https://xn--931a.moe/assets/info.jpg" class="_ghost"/>
				<div>{{ i18n.ts.nothing }}</div>
			</div>
		</div>
	</div>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { Ref, computed, onMounted, ref, shallowRef } from 'vue';
import * as Acct from 'misskey-js/built/acct';
import { UserDetailed } from 'misskey-js/built/entities';
import * as os from '@/os';
import { defaultStore } from '@/store';
import { i18n } from '@/i18n';
import { $i } from '@/account';
import { hostname } from '@/config';
import FormInput from '@/components/form/input.vue';
import FormSplit from '@/components/form/split.vue';
import MkModalWindow from '@/components/MkModalWindow.vue';
import XUser from '@/components/TmsUserSelectDialog.user.vue';

const props = defineProps<{
	includeSelf?: boolean;
}>();

const emit = defineEmits<{
	(ev: 'ok', selected: UserDetailed): void;
	(ev: 'cancel'): void;
	(ev: 'closed'): void;
}>();

const dialogEl = shallowRef<InstanceType<typeof MkModalWindow>>();
const isSelected = ref(false);

const ok = (newUser: UserDetailed, force?: boolean): void => {
	if (!force && isSelected.value) return;
	isSelected.value = true;

	emit('ok', newUser);
	dialogEl.value?.close();
	updateRecentlyUsedUsers(newUser);
};

const cancel = (): void => {
	emit('cancel');
	dialogEl.value?.close();
};

//#region matchUser
const matchUser = computed(() => {
	return {
		username: inputUserName.value,
		host: inputHostName.value || null,
	};
});
const showMatchUser = computed(() => {
	return inputUserName.value !== '' && inputHostName.value !== '';
});

const onRejected = (err: unknown): void => {
	const { id, message } = err as {
		id: string;
		message: string;
	};

	isSelected.value = false;

	os.alert({
		type: 'error',
		text: `${message}\n${id}`,
	});
};

const matchUserOk = async (): Promise<void> => {
	if (isSelected.value) return;
	isSelected.value = true;

	const { username, host } = matchUser.value;
	os.api('users/show', { username, host: host ?? undefined }).then(matchedUser => {
		ok(matchedUser, true);
	}).catch(onRejected);
};

const lookupUser = async (): Promise<void> => {
	if (isSelected.value) return;

	const { canceled, result } = await os.inputText({
		title: i18n.ts.usernameOrUserId,
	});
	if (canceled) return;
	if (result === '') return;

	isSelected.value = true;

	if (result.startsWith('http://') || result.startsWith('https://')) {
		os.api('ap/show', {
			uri: result,
		}).then(res => {
			if (res.type === 'User') {
				ok(res.object, true);
			} else {
				isSelected.value = false;

				os.alert({
					type: 'error',
					text: `${result} is not User.`,
				});
			}
		}).catch(onRejected);
	} else {
		let resolved = false;
		const { username, host } = Acct.parse(result);
		const userId = result;
		const usernamePromise = os.api('users/show', { username, host: host ?? undefined });
		const userIdPromise = os.api('users/show', { userId });
		usernamePromise.then(user => {
			if (!resolved) {
				resolved = true;
				ok(user, true);
			}
		}).catch(onRejected);
		userIdPromise.then(user => {
			if (!resolved) {
				resolved = true;
				ok(user, true);
			}
		}).catch(onRejected);
	}
};
//#endregion

//#region searchUsers
const searchUsers: Ref<UserDetailed[]> = ref([]);
const showSearchUsers = computed(() => {
	return searchUsers.value.length !== 0;
});

const inputUserName = ref('');
const inputHostName = ref('');

const search = (): void => {
	if (inputUserName.value === '' && inputHostName.value === '') {
		searchUsers.value = [];
		return;
	}

	os.api('users/search-by-username-and-host', {
		username: inputUserName.value,
		host: inputHostName.value,
		limit: 16,
		detail: true,
	}).then(users => {
		searchUsers.value = (users as UserDetailed[]);
	});
};
//#endregion

//#region recentUsers
const recentUsers: Ref<UserDetailed[]> = ref([]);
const showRecentUsers = computed(() => {
	return searchUsers.value.length === 0 && recentUsers.value.length !== 0;
});

onMounted(() => {
	os.api('users/show', {
		userIds: defaultStore.state.recentlyUsedUsers,
	}).then(users => {
		if (props.includeSelf && $i && !users.some(x => x.id === $i?.id)) {
			recentUsers.value = [$i, ...users];
		} else {
			recentUsers.value = users;
		}
	});
});

const updateRecentlyUsedUsers = (newUser: UserDetailed): string[] => {
	const userIds = [...new Set([newUser.id, ...defaultStore.state.recentlyUsedUsers])].splice(0, 16);
	defaultStore.set('recentlyUsedUsers', userIds);
	return userIds;
};
//#endregion
</script>

<style lang="scss" module>
.matchUser {
	display: flex;
	flex-direction: column;
	margin: 0px var(--root-margin) 8px;
	padding: 8px 16px;
	border-radius: var(--radius);
	background-color: var(--infoBg);
	color: var(--infoFg);
	font-size: 14px;
}
</style>
