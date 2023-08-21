<template>
<div
	:class="['_button', $style.user]"
	@click="select()"
>
	<MkAvatar :user="user" :class="$style.avatar" indicator/>
	<div :class="$style.userBody">
		<MkUserName :user="user" :class="['_nowrap', $style.userName]"/>
		<MkAcct :user="user" :class="['_nowrap', $style.userAcct]" detail/>
	</div>
</div>
</template>

<script lang="ts" setup>
import { UserDetailed } from 'misskey-js/built/entities';

const props = defineProps<{
	user: UserDetailed;
}>();

const emit = defineEmits<{
	(ev: 'select', user: UserDetailed): void;
}>();

const select = (): void => {
	emit('select', props.user);
};
</script>

<style lang="scss" module>
.user {
	display: flex;
	gap: 8px;
	align-items: center;
	padding: 8px var(--root-margin);
	font-size: 14px;

	&:hover {
		background: var(--X7);
	}
}

.userBody {
	min-width: 0;
}

.avatar {
	width: 45px;
	height: 45px;
}

.userName {
	display: block;
	font-weight: bold;
}

.userAcct {
	display: block;
	opacity: 0.5;
}
</style>
