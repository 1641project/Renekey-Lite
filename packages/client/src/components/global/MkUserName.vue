<template>
<Mfm :text="user.name || user.username" :plain="true" :nowrap="nowrap" :custom-emojis="user.emojis"/>
</template>

<script lang="ts" setup>
import { } from 'vue';
import { User } from 'misskey-js/built/entities';

withDefaults(defineProps<{
	user: Pick<User, 'name' | 'username' | 'emojis'>;
	nowrap?: boolean;
}>(), {
	nowrap: true,
});
</script>
