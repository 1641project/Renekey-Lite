<template>
<XColumn :menu="menu" :naked="true" :column="column" :is-stacked="isStacked" :is-mobile="isMobile">
	<template #icon><i class="ti ti-apps"></i></template>
	<template #header>{{ column.name }}</template>

	<div :class="$style.root">
		<div v-if="!(column.widgets && column.widgets.length > 0) && !edit" :class="$style.intro">{{ i18n.ts._deck.widgetsIntroduction }}</div>
		<MkWidgets :edit="edit" :widgets="column.widgets ?? []" @add-widget="addWidget" @remove-widget="removeWidget" @update-widget="updateWidget" @update-widgets="updateWidgets" @exit="edit = false"/>
	</div>
</XColumn>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import XColumn from './column.vue';
import { addColumnWidget, Column, removeColumnWidget, setColumnWidgets, updateColumnWidget } from './deck-store';
import MkWidgets, { Widget, EditedWidget } from '@/components/MkWidgets.vue';
import { i18n } from '@/i18n';

const props = defineProps<{
	column: Column;
	isStacked: boolean;
	isMobile: boolean;
}>();

const edit = ref(false);

const addWidget = (widget: Widget): void => {
	addColumnWidget(props.column.id, widget);
};

const removeWidget = (widget: Widget): void => {
	removeColumnWidget(props.column.id, widget);
};

const updateWidget = ({ id, data }: EditedWidget): void => {
	updateColumnWidget(props.column.id, id, data);
};

const updateWidgets = (widgets: Widget[]): void => {
	setColumnWidgets(props.column.id, widgets);
};

const toggleWidgetEdit = (): void => {
	edit.value = !edit.value;
};

const menu = [
	{
		icon: 'ti ti-pencil',
		text: i18n.ts.editWidgets,
		action: toggleWidgetEdit,
	},
];
</script>

<style lang="scss" module>
.root {
	--margin: 8px;
	--panelBorder: none;

	padding: 0 var(--margin);
}

.intro {
	padding: 16px;
	text-align: center;
}
</style>
