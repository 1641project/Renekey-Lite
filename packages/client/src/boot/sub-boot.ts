import { createApp, defineAsyncComponent } from 'vue';
import { common } from './common';

export const subBoot = async (): Promise<void> => {
	const { isClientUpdated } = await common(() => createApp(
		defineAsyncComponent(() => import('@/ui/minimum.vue')),
	));
};
