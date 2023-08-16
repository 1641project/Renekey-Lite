import { Ref, computed, ref } from 'vue';

export const stopPageTransition = computed(() => stopPageTransitionFlags.value.some(flag => flag.value === true));
export const stopPageTransitionFlags = ref<Ref<boolean>[]>([]);
