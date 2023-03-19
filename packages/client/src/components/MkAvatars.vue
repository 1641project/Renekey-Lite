<template>
<div>
	<div v-for="user in users" :key="user.id" :style="$style.avatar">
		<MkAvatar :user="user" :style="$style.inner" :show-indicator="true"/>
	</div>
</div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { UserDetailed } from 'misskey-js/built/entities';
import * as os from '@/os';

const props = defineProps<{
	userIds: string[];
}>();

const users = ref<UserDetailed[]>([]);

onMounted(async () => {
	users.value = await os.api('users/show', {
		userIds: props.userIds,
	});
});
</script>

<style lang="scss" module>
.avatar {
	display: inline-block;
	width: 32px;
	height: 32px;
	margin-right: 8px;
}

.inner {
	width: 32px;
	height: 32px;
}
</style>
