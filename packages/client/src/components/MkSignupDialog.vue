<template>
<MkModalWindow
	ref="dialog"
	:width="500"
	:height="600"
	@close="dialog?.close()"
	@closed="emit('closed')"
>
	<template #header>{{ i18n.ts.signup }}</template>

	<div :class="$style.root">
		<Transition
			mode="out-in"
			:enter-active-class="$style.transition_x_enterActive"
			:leave-active-class="$style.transition_x_leaveActive"
			:enter-from-class="$style.transition_x_enterFrom"
			:leave-to-class="$style.transition_x_leaveTo"
		>
			<template v-if="!isAcceptedServerRule">
				<XServerRules @done="isAcceptedServerRule = true" @cancel="dialog?.close()"/>
			</template>
			<template v-else>
				<XSignupForm :auto-set="autoSet" @signup="onSignup" @signup-email-pending="onSignupEmailPending"/>
			</template>
		</Transition>
	</div>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { } from 'vue';
import XSignupForm from '@/components/MkSignupDialog.form.vue';
import XServerRules from '@/components/MkSignupDialog.rules.vue';
import MkModalWindow from '@/components/MkModalWindow.vue';
import { i18n } from '@/i18n';

withDefaults(defineProps<{
	autoSet?: boolean;
}>(), {
	autoSet: false,
});

const emit = defineEmits<{
	(ev: 'done', v: any): void;
	(ev: 'closed'): void;
}>();

const dialog = $shallowRef<InstanceType<typeof MkModalWindow>>();

const isAcceptedServerRule = $ref(false);

const onSignup = (res: any): void => {
	emit('done', res);
	dialog?.close();
};

const onSignupEmailPending = (): void => {
	dialog?.close();
};
</script>

<style lang="scss" module>
.transition_x_enterActive,
.transition_x_leaveActive {
	transition: opacity 0.3s cubic-bezier(0, 0, 0.35, 1), transform 0.3s cubic-bezier(0, 0, 0.35, 1);
}
.transition_x_enterFrom {
	opacity: 0;
	transform: translateX(50px);
}
.transition_x_leaveTo {
	opacity: 0;
	transform: translateX(-50px);
}

.root {
	overflow: hidden; // fallback (overflow: clip)
	overflow: clip;
}
</style>
