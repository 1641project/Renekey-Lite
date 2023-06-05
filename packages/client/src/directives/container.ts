import { Directive } from 'vue';

const map = new WeakMap<HTMLElement, ResizeObserver>();

// eslint-disable-next-line import/no-default-export
export default {
	mounted(src) {
		const ro = new ResizeObserver(() => {
			src.style.setProperty('--containerHeight', `${src.offsetHeight}px`);
		});
		ro.observe(src);
		map.set(src, ro);
	},

	unmounted(src) {
		const ro = map.get(src);
		if (ro) {
			ro.disconnect();
			map.delete(src);
		}
	},
} as Directive<HTMLElement>;
