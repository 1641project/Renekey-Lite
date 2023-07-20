import * as os from '@/os';
import { instance } from '@/instance';
import { host } from '@/config';
import { i18n } from '@/i18n';
import { getHtmlElementFromEvent } from '@/scripts/tms/utils';

export const openInstanceMenu = (ev: MouseEvent): void => {
	os.popupMenu([
		{
			text: instance.name ?? host,
			type: 'label',
		},
		{
			type: 'link',
			text: i18n.ts.instanceInfo,
			icon: 'ti ti-info-circle',
			to: '/about',
		},
		{
			type: 'link',
			text: i18n.ts.customEmojis,
			icon: 'ti ti-icons',
			to: '/about#emojis',
		},
		{
			type: 'link',
			text: i18n.ts.federation,
			icon: 'ti ti-whirl',
			to: '/about#federation',
		},
		{
			type: 'link',
			text: i18n.ts.charts,
			icon: 'ti ti-chart-line',
			to: '/about#charts',
		},
		null,
		{
			type: 'parent',
			text: i18n.ts.tools,
			icon: 'ti ti-tool',
			children: [
				{
					type: 'link',
					to: '/mfm-cheat-sheet',
					text: i18n.ts._mfm.cheatSheet,
					icon: 'ti ti-code',
				},
				{
					type: 'link',
					to: '/scratchpad',
					text: i18n.ts.scratchpad,
					icon: 'ti ti-terminal-2',
				},
				{
					type: 'link',
					to: '/api-console',
					text: 'API Console',
					icon: 'ti ti-terminal-2',
				},
			],
		},
		null,
		{
			text: i18n.ts.help,
			icon: 'ti ti-help-circle',
			action: (): void => {
				window.open('https://misskey-hub.net/help.html', '_blank');
			},
		},
		{
			type: 'link',
			text: i18n.ts.aboutMisskey,
			to: '/about-misskey',
		},
	], getHtmlElementFromEvent(ev) ?? undefined, {
		align: 'left',
	});
};
