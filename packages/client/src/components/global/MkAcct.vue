<template>
<span class="mk-acct">
	<span class="name">@{{ user.username }}</span>
	<span v-if="user.host || detail || defaultStore.state.showFullAcct" class="host" style="opacity: 0.5;">@{{ user.host || host }}</span>
</span>
</template>

<script lang="ts" setup>
import { User, UserLite, UserDetailed } from 'misskey-js/built/entities';
import { toUnicode } from 'punycode/';
import { host as hostRaw } from '@/config';
import { defaultStore } from '@/store';

defineProps<{
	user: User | UserLite | UserDetailed;
	detail?: boolean;
}>();

const host = toUnicode(hostRaw);
</script>
