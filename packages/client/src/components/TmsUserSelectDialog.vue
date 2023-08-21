<template>
<MkModalWindow
	ref="dialogEl"
	:with-ok-button="true"
	:ok-button-disabled="selectedUser == null"
	@click="cancel()"
	@close="cancel()"
	@ok="ok()"
	@closed="emit('closed')"
>
	<template #header>{{ i18n.ts.selectUser }}</template>
	<div class="_gaps">
		<div :class="$style.form">
			<FormSplit :min-width="128">
				<FormInput v-model="inputUserName" :autofocus="true" :debounce="false" @update:model-value="debouncedSearch">
					<template #label>{{ i18n.ts.username }}</template>
					<template #prefix>@</template>
				</FormInput>
				<FormInput v-model="inputHostName" :debounce="false" :datalist="[hostname]" @update:model-value="debouncedSearch">
					<template #label>{{ i18n.ts.host }}</template>
					<template #prefix>@</template>
				</FormInput>
			</FormSplit>
		</div>
		<div class="_gaps">
			<div
				:class="['_button', $style.matchUser]"
				@click="showMatchUser ? matchUserSelect() : lookupUserSelect()"
			>
				<template v-if="showMatchUser">
					<div>{{ i18n.ts.lookup }}:</div>
					<div><MkAcct :user="matchUser" detail/></div>
				</template>
				<template v-else>
					<div>{{ i18n.ts.lookup }}<MkEllipsis static/></div>
				</template>
			</div>
			<div v-if="computedResult.type === 'empty'" class="_fullinfo">
				<img src="https://xn--931a.moe/assets/info.jpg" class="_ghost"/>
				<div>{{ i18n.ts.nothing }}</div>
			</div>
			<div v-else>
				<XUser
					v-if="selectedUser && !computedResult.users.some(resultUser => selectedUser?.id === resultUser.id)"
					:key="selectedUser.id"
					:user="selectedUser"
					:selected="true"
					@select="deselect"
				/>
				<XUser
					v-for="resultUser in computedResult.users"
					:key="resultUser.id"
					:user="resultUser"
					:selected="selectedUser?.id === resultUser.id"
					@select="select"
				/>
			</div>
		</div>
	</div>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { Ref, computed, defineAsyncComponent, onMounted, ref, shallowRef } from 'vue';
import * as Acct from 'misskey-js/built/acct';
import { UserDetailed } from 'misskey-js/built/entities';
import { debounce } from 'throttle-debounce';
import * as os from '@/os';
import { defaultStore } from '@/store';
import { i18n } from '@/i18n';
import { $i } from '@/account';
import { hostname } from '@/config';
import FormInput from '@/components/form/input.vue';
import FormSplit from '@/components/form/split.vue';
import MkModalWindow from '@/components/MkModalWindow.vue';

const XUser = defineAsyncComponent(() => import('@/components/TmsUserSelectDialog.user.vue'));

const props = withDefaults(defineProps<{
	includeSelf?: boolean;
}>(), {
	includeSelf: true,
});

const emit = defineEmits<{
	(ev: 'ok', selected: UserDetailed): void;
	(ev: 'cancel'): void;
	(ev: 'closed'): void;
}>();

const dialogEl = shallowRef<InstanceType<typeof MkModalWindow>>();

const selectedUser: Ref<UserDetailed | null> = ref(null);

const ok = (): void => {
	if (selectedUser.value == null) return;

	emit('ok', selectedUser.value);
	dialogEl.value?.close();
	updateRecentlyUsedUsers(selectedUser.value);
};

const select = (selectUser: UserDetailed): void => {
	selectedUser.value = selectUser;
};

const deselect = (): void => {
	selectedUser.value = null;
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
	return inputUserName.value !== '';
});

const onRejected = (err: unknown): void => {
	const { id, message } = err as {
		id: string;
		message: string;
	};
	os.alert({
		type: 'error',
		text: `${message}\n${id}`,
	});
};

const matchUserSelect = async (): Promise<void> => {
	const { username, host } = matchUser.value;
	os.api('users/show', {
		username,
		host: host ?? undefined,
	}).then(matchedUser => {
		select(matchedUser);
	}).catch(onRejected);
};

const lookupUserSelect = async (): Promise<void> => {
	const { canceled, result } = await os.inputText({
		title: i18n.ts.usernameOrUserId,
	});
	if (canceled) return;
	if (result === '') return;

	if (result.startsWith('http://') || result.startsWith('https://')) {
		os.api('ap/show', {
			uri: result,
		}).then(res => {
			if (res.type === 'User') {
				select(res.object);
			} else {
				os.alert({
					type: 'error',
					text: `${result} is not User.`,
				});
			}
		}).catch(onRejected);
	} else {
		const { username, host } = Acct.parse(result);
		const userId = result;
		const usernamePromise = os.api('users/show', { username, host: host ?? undefined });
		const userIdPromise = os.api('users/show', { userId });
		Promise.allSettled([usernamePromise, userIdPromise]).then(results => {
			let resolved = false;
			let rejected = false;
			for (const result of results) {
				if (!resolved && result.status === 'fulfilled') {
					resolved = true;
					select(result.value);
					break;
				}
			}
			if (!resolved) {
				for (const result of results) {
					if (!rejected && result.status === 'rejected') {
						rejected = true;
						onRejected(result.reason);
						break;
					}
				}
			}
		});
	}
};
//#endregion

//#region resultUsers
type ComputedResult = {
	type: 'search';
	users: UserDetailed[];
} | {
	type: 'recent';
	users: UserDetailed[];
} | {
	type: 'empty';
};
const computedResult = computed<ComputedResult>(() => {
	if (inputUserName.value !== '' || inputHostName.value !== '') {
		return {
			type: 'search',
			users: searchUsers.value,
		};
	}
	if (recentUsers.value.length !== 0) {
		return {
			type: 'recent',
			users: recentUsers.value,
		};
	}
	return {
		type: 'empty',
	};
});
//#endregion

//#region searchUsers
const searchUsers: Ref<UserDetailed[]> = ref([]);

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

const debouncedSearch = debounce(1000, search);
//#endregion

//#region recentUsers
const recentUsers: Ref<UserDetailed[]> = ref([]);

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
.form {
	padding: 0 var(--root-margin);
}

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
