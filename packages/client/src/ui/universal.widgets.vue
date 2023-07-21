<template>
<div ref="rootEl">
	<MkWidgets :edit="editMode" :widgets="widgets" @add-widget="addWidget" @remove-widget="removeWidget" @update-widget="updateWidget" @update-widgets="updateWidgets" @exit="editMode = false"/>

	<div :class="$style.edit">
		<button v-if="editMode" :class="$style.editButton" class="_textButton" style="font-size: 0.9em;" @click="editMode = false"><i class="ti ti-check"></i> {{ i18n.ts.editWidgetsExit }}</button>
		<button v-else :class="$style.editButton" class="_textButton mk-widget-edit" data-cy-widget-edit style="font-size: 0.9em;" @click="editMode = true"><i class="ti ti-pencil"></i> {{ i18n.ts.editWidgets }}</button>
	</div>
</div>
</template>

<script lang="ts" setup>
import { onMounted, ref, shallowRef } from 'vue';
import MkWidgets, { Widget, EditedWidget } from '@/components/MkWidgets.vue';
import { i18n } from '@/i18n';
import { defaultStore } from '@/store';

const props = withDefaults(defineProps<{
	// null = 全てのウィジェットを表示
	// left = place: leftだけを表示
	// right = rightとnullを表示
	place?: 'left' | null | 'right';
}>(), {
	place: null,
});

const emit = defineEmits<{
	(ev: 'mounted', el: HTMLElement): void;
}>();

const rootEl = shallowRef<HTMLElement>();

onMounted(() => {
	if (rootEl.value) emit('mounted', rootEl.value);
});

const editMode = ref(false);

const widgets = $computed(() => {
	if (props.place === null) return defaultStore.reactiveState.widgets.value;
	if (props.place === 'left') return defaultStore.reactiveState.widgets.value.filter(w => w.place === 'left');
	return defaultStore.reactiveState.widgets.value.filter(w => w.place !== 'left');
});

const addWidget = (widget: Widget): void => {
	defaultStore.set('widgets', [{
		...widget,
		place: props.place,
	}, ...defaultStore.state.widgets]);
};

const removeWidget = (widget: Widget): void => {
	defaultStore.set('widgets', defaultStore.state.widgets.filter(w => w.id !== widget.id));
};

const updateWidget = ({ id, data }: EditedWidget): void => {
	defaultStore.set('widgets', defaultStore.state.widgets.map(w => w.id === id ? {
		...w,
		data,
		place: props.place,
	} : w));
};

const updateWidgets = (thisWidgets: Widget[]): void => {
	if (props.place === null) {
		defaultStore.set('widgets', thisWidgets);
		return;
	}
	if (props.place === 'left') {
		defaultStore.set('widgets', [
			...thisWidgets.map(w => ({ ...w, place: 'left' })),
			...defaultStore.state.widgets.filter(w => w.place !== 'left' && !thisWidgets.some(t => w.id === t.id)),
		]);
		return;
	}
	defaultStore.set('widgets', [
		...defaultStore.state.widgets.filter(w => w.place === 'left' && !thisWidgets.some(t => w.id === t.id)),
		...thisWidgets.map(w => ({ ...w, place: 'right' })),
	]);
};
</script>

<style lang="scss" module>
.edit {
	display: grid;
	place-items: center;
	width: 100%;
}

.editButton {
	padding: 8px;
}
</style>
