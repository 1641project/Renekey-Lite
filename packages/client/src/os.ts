// TODO: なんでもかんでもos.tsに突っ込むのやめたいのでよしなに分割する

import { Component, computed, markRaw, Ref, ref, defineAsyncComponent } from 'vue';
import { EventEmitter } from 'eventemitter3';
import insertTextAtCursor from 'insert-text-at-cursor';
import * as Misskey from 'misskey-js';
import { Endpoints } from 'misskey-js/built/api.types';
import MkPostFormDialog from '@/components/MkPostFormDialog.vue';
import MkWaitingDialog from '@/components/MkWaitingDialog.vue';
import MkPageWindow from '@/components/MkPageWindow.vue';
import MkToast from '@/components/MkToast.vue';
import MkDialog from '@/components/MkDialog.vue';
import MkEmojiPickerDialog from '@/components/MkEmojiPickerDialog.vue';
import MkEmojiPickerWindow from '@/components/MkEmojiPickerWindow.vue';
import MkPopupMenu from '@/components/MkPopupMenu.vue';
import MkContextMenu from '@/components/MkContextMenu.vue';
import { PropsForm } from '@/components/MkFormDialog.vue';
import { MenuItem } from '@/types/menu';
import { i18n } from '@/i18n';
import { copyText } from '@/scripts/tms/clipboard';
import { pendingApiRequestsCount, api, apiGet } from '@/scripts/api';

export { pendingApiRequestsCount, api, apiGet };

export const openingWindowsCount = ref(0);

export const apiWithDialog = ((
	endpoint: keyof Endpoints,
	data: Record<string, any> = {},
	token?: string | null | undefined,
) => {
	const promise = api(endpoint, data, token);
	promiseDialog(promise, null, async (err: any) => {
		let title: string | null = null;
		let text = err.message + '\n' + err.id;
		if (err.code === 'INTERNAL_ERROR') {
			title = i18n.ts.internalServerError;
			text = i18n.ts.internalServerErrorDescription;
			const date = new Date().toISOString();
			const { result } = await actions({
				type: 'error',
				title,
				text,
				actions: [{
					value: 'ok',
					text: i18n.ts.gotIt,
					primary: true,
				}, {
					value: 'copy',
					text: i18n.ts.copyErrorInfo,
				}],
			});
			if (result === 'copy') {
				copyText(`Endpoint: ${endpoint.toString()}\nInfo: ${JSON.stringify(err.info)}\nDate: ${date}`);
				success();
			}
			return;
		} else if (err.code === 'RATE_LIMIT_EXCEEDED') {
			title = i18n.ts.cannotPerformTemporary;
			text = i18n.ts.cannotPerformTemporaryDescription;
		} else if (err.code === 'INVALID_PARAM') {
			title = i18n.ts.invalidParamError;
			text = i18n.ts.invalidParamErrorDescription;
		} else if (err.code === 'ROLE_PERMISSION_DENIED') {
			title = i18n.ts.permissionDeniedError;
			text = i18n.ts.permissionDeniedErrorDescription;
		} else if (err.code.startsWith('TOO_MANY')) {
			title = i18n.ts.youCannotCreateAnymore;
			text = `${i18n.ts.error}: ${err.id}`;
		} else if (err.message.startsWith('Unexpected token')) {
			title = i18n.ts.gotInvalidResponseError;
			text = i18n.ts.gotInvalidResponseErrorDescription;
		}
		alert({
			type: 'error',
			title,
			text,
		});
	});

	return promise;
}) as typeof api;

export const promiseDialog = <T extends Promise<any>>(
	promise: T,
	onSuccess?: ((res: any) => void) | null,
	onFailure?: ((err: Error) => void) | null,
	text?: string,
): T => {
	const showing = ref(true);
	const success_ = ref(false);

	promise.then(res => {
		if (onSuccess) {
			showing.value = false;
			onSuccess(res);
		} else {
			success_.value = true;
			window.setTimeout(() => {
				showing.value = false;
			}, 1000);
		}
	}).catch(err => {
		showing.value = false;
		if (onFailure) {
			onFailure(err);
		} else {
			alert({
				type: 'error',
				text: err,
			});
		}
	});

	// NOTE: dynamic importすると挙動がおかしくなる(showingの変更が伝播しない)
	popup(MkWaitingDialog, {
		success: success_,
		showing: showing,
		text: text,
	}, {}, 'closed');

	return promise;
};

let popupIdCount = 0;
export const popups = ref([]) as Ref<{
	id: any;
	component: any;
	props: Record<string, any>;
}[]>;

const zIndexes = {
	veryLow: 500000,
	low: 1000000,
	middle: 2000000,
	high: 3000000,
};
export const claimZIndex = (priority: keyof typeof zIndexes = 'low'): number => {
	zIndexes[priority] += 100;
	return zIndexes[priority];
};
export const getZIndex = (el: HTMLElement | null): number | null => {
	if (el == null || el.tagName === 'BODY') return null;
	const zIndex = parseInt(window.getComputedStyle(el).getPropertyValue('z-index'));
	if (zIndex >= 500000) { // zIndexes.veryLow
		return zIndex;
	} else {
		return getZIndex(el.parentElement);
	}
};

export const popup = async (component: Component, props: Record<string, any>, events = {}, disposeEvent?: string): Promise<{
	dispose: () => void;
}> => {
	markRaw(component);

	const id = ++popupIdCount;
	const dispose = (): void => {
		// このsetTimeoutが無いと挙動がおかしくなる(autocompleteが閉じなくなる)。Vueのバグ？
		window.setTimeout(() => {
			popups.value = popups.value.filter(popup_ => popup_.id !== id);
		}, 0);
	};
	const state = {
		component,
		props,
		events: disposeEvent ? {
			...events,
			[disposeEvent]: dispose,
		} : events,
		id,
	};

	popups.value.push(state);

	return {
		dispose,
	};
};

export const pageWindow = (path: string): void => {
	popup(MkPageWindow, {
		initialPath: path,
	}, {}, 'closed');
};

export const toast = (message: string): void => {
	popup(MkToast, {
		message,
	}, {}, 'closed');
};

export const alert = (props: {
	type?: 'error' | 'info' | 'success' | 'warning' | 'waiting' | 'question';
	title?: string | null;
	text?: string | null;
	allowMfm?: boolean;
}): Promise<void> => {
	return new Promise((resolve) => {
		popup(MkDialog, props, {
			done: () => {
				resolve();
			},
		}, 'closed');
	});
};

export const confirm = (props: {
	type: 'error' | 'info' | 'success' | 'warning' | 'waiting' | 'question';
	title?: string | null;
	text?: string | null;
	okText?: string;
	cancelText?: string;
	dangerOkButton?: boolean;
	dangerCancelButton?: boolean;
	cancelableByBgClick?: boolean;
}): Promise<{ canceled: boolean }> => {
	return new Promise((resolve) => {
		popup(MkDialog, {
			...props,
			showOkButton: true,
			showCancelButton: true,
		}, {
			done: result => {
				resolve(result ? result : { canceled: true });
			},
		}, 'closed');
	});
};

// TODO: const T extends ... にしたい
// https://zenn.dev/general_link/articles/813e47b7a0eef7#const-type-parameters
export function actions<T extends {
	value: string;
	text: string;
	primary?: boolean,
	danger?: boolean,
}[]>(props: {
	type: 'error' | 'info' | 'success' | 'warning' | 'waiting' | 'question';
	title?: string | null;
	text?: string | null;
	actions: T;
}): Promise<{
	canceled: true; result: undefined;
} | {
	canceled: false; result: T[number]['value'];
}> {
	return new Promise((resolve) => {
		popup(MkDialog, {
			...props,
			actions: props.actions.map(a => ({
				text: a.text,
				primary: a.primary,
				danger: a.danger,
				callback: (): void => {
					resolve({ canceled: false, result: a.value });
				},
			})),
		}, {
			done: (result) => {
				resolve(result ? result : { canceled: true });
			},
		}, 'closed');
	});
}

export const inputText = (props: {
	type?: 'text' | 'email' | 'password' | 'url';
	title?: string | null;
	text?: string | null;
	placeholder?: string | null;
	autocomplete?: string;
	default?: string | null;
	minLength?: number;
	maxLength?: number;
}): Promise<{ canceled: true; result: undefined; } | {
	canceled: false; result: string;
}> => {
	return new Promise((resolve) => {
		popup(MkDialog, {
			title: props.title,
			text: props.text,
			input: {
				type: props.type,
				placeholder: props.placeholder,
				autocomplete: props.autocomplete,
				default: props.default,
				minLength: props.minLength,
				maxLength: props.maxLength,
			},
		}, {
			done: (result) => {
				resolve(result ? result : { canceled: true });
			},
		}, 'closed');
	});
};

export const inputNumber = (props: {
	title?: string | null;
	text?: string | null;
	placeholder?: string | null;
	autocomplete?: string;
	default?: number | null;
}): Promise<{ canceled: true; result: undefined; } | {
	canceled: false; result: number;
}> => {
	return new Promise((resolve) => {
		popup(MkDialog, {
			title: props.title,
			text: props.text,
			input: {
				type: 'number',
				placeholder: props.placeholder,
				autocomplete: props.autocomplete,
				default: props.default,
			},
		}, {
			done: (result) => {
				resolve(result ? result : { canceled: true });
			},
		}, 'closed');
	});
};

export const inputDate = (props: {
	title?: string | null;
	text?: string | null;
	placeholder?: string | null;
	default?: Date | null;
	allowMfm?: boolean;
}): Promise<{
	canceled: true; result: undefined;
} | {
	canceled: false; result: Date;
}> => {
	return new Promise((resolve) => {
		popup(MkDialog, {
			title: props.title,
			text: props.text,
			input: {
				type: 'date',
				placeholder: props.placeholder,
				default: props.default,
			},
		}, {
			done: (result) => {
				resolve(result ? { result: new Date(result.result), canceled: false } : { canceled: true, result: undefined });
			},
		}, 'closed');
	});
};

export const select = <C = any>(props: {
	title?: string | null;
	text?: string | null;
	default?: string | null;
	allowMfm?: boolean;
} & ({
	items: {
		value: C;
		text: string;
	}[];
} | {
	groupedItems: {
		label: string;
		items: {
			value: C;
			text: string;
		}[];
	}[];
})): Promise<{ canceled: true; result: undefined; } | {
	canceled: false; result: C;
}> => {
	return new Promise((resolve) => {
		popup(MkDialog, {
			title: props.title,
			text: props.text,
			select: {
				items: props.items,
				groupedItems: props.groupedItems,
				default: props.default,
			},
		}, {
			done: result => {
				resolve(result ? result : { canceled: true });
			},
		}, 'closed');
	});
};

export const success = (): Promise<void> => {
	return new Promise((resolve) => {
		const showing = ref(true);
		window.setTimeout(() => {
			showing.value = false;
		}, 1000);
		popup(MkWaitingDialog, {
			success: true,
			showing: showing,
		}, {
			done: () => resolve(),
		}, 'closed');
	});
};

export const waiting = (): Promise<void> => {
	return new Promise((resolve) => {
		const showing = ref(true);
		popup(MkWaitingDialog, {
			success: false,
			showing: showing,
		}, {
			done: () => resolve(),
		}, 'closed');
	});
};

export const form = (title: string, form: PropsForm) => {
	return new Promise((resolve) => {
		popup(defineAsyncComponent(() => import('@/components/MkFormDialog.vue')), { title, form }, {
			done: (result) => {
				resolve(result);
			},
		}, 'closed');
	});
};

export const selectUser = async (opts: {
	includeSelf?: boolean;
} = {}): Promise<Misskey.entities.UserDetailed> => {
	return new Promise((resolve, reject) => {
		popup(defineAsyncComponent(() => import('@/components/TmsUserSelectDialog.vue')), {
			includeSelf: opts.includeSelf,
		}, {
			ok: (user: Misskey.entities.UserDetailed) => {
				resolve(user);
			},
			cancel: () => {
				reject();
			},
		}, 'closed');
	});
};

export const selectDriveFile = async <T extends boolean>(multiple: T): Promise<
	T extends true ? Misskey.entities.DriveFile[] : Misskey.entities.DriveFile
> => {
	return new Promise((resolve, reject) => {
		popup(defineAsyncComponent(() => import('@/components/MkDriveSelectDialog.vue')), {
			type: 'file',
			multiple,
		}, {
			done: (files) => {
				if (files) {
					resolve(multiple ? files : files[0]);
				} else {
					reject();
				}
			},
		}, 'closed');
	});
};

export const selectDriveFolder = async <T extends boolean>(multiple: T): Promise<
	T extends true ? Misskey.entities.DriveFolder[] : Misskey.entities.DriveFolder
> => {
	return new Promise((resolve, reject) => {
		popup(defineAsyncComponent(() => import('@/components/MkDriveSelectDialog.vue')), {
			type: 'folder',
			multiple,
		}, {
			done: (folders) => {
				if (folders) {
					resolve(multiple ? folders : folders[0]);
				} else {
					reject();
				}
			},
		}, 'closed');
	});
};

export const pickEmoji = async (src: HTMLElement | null, opts): Promise<void> => {
	return new Promise((resolve, _reject) => {
		popup(MkEmojiPickerDialog, {
			src,
			...opts,
		}, {
			done: emoji => {
				resolve(emoji);
			},
		}, 'closed');
	});
};

export const cropImage = (image: Misskey.entities.DriveFile, options: {
	aspectRatio: number;
	uploadFolder?: string | null;
}): Promise<Misskey.entities.DriveFile> => {
	return new Promise((resolve) => {
		popup(defineAsyncComponent(() => import('@/components/MkCropperDialog.vue')), {
			file: image,
			aspectRatio: options.aspectRatio,
			uploadFolder: options.uploadFolder,
		}, {
			ok: (x) => {
				resolve(x);
			},
		}, 'closed');
	});
};

type AwaitType<T> =
	T extends Promise<infer U> ? U :
	T extends (...args: any[]) => Promise<infer V> ? V :
	T;
let openingEmojiPicker: AwaitType<ReturnType<typeof popup>> | null = null;
let activeTextarea: HTMLTextAreaElement | HTMLInputElement | null = null;
export const openEmojiPicker = async (src?: HTMLElement, opts, initialTextarea: typeof activeTextarea): Promise<void> => {
	if (openingEmojiPicker) return;

	activeTextarea = initialTextarea;

	const textareas = document.querySelectorAll<HTMLTextAreaElement | HTMLInputElement>('textarea, input');
	for (const textarea of Array.from(textareas)) {
		textarea.addEventListener('focus', () => {
			activeTextarea = textarea;
		});
	}

	const observer = new MutationObserver(records => {
		for (const record of records) {
			for (const node of Array.from(record.addedNodes).filter(node => node instanceof HTMLElement) as HTMLElement[]) {
				const textareas = node.querySelectorAll<HTMLTextAreaElement | HTMLInputElement>('textarea, input');
				for (const textarea of Array.from(textareas).filter(textarea => textarea.dataset.preventEmojiInsert == null)) {
					if (document.activeElement === textarea) activeTextarea = textarea;
					textarea.addEventListener('focus', () => {
						activeTextarea = textarea;
					});
				}
			}
		}
	});

	observer.observe(document.body, {
		childList: true,
		subtree: true,
		attributes: false,
		characterData: false,
	});

	openingEmojiPicker = await popup(MkEmojiPickerWindow, {
		src,
		...opts,
	}, {
		chosen: emoji => {
			insertTextAtCursor(activeTextarea, emoji);
		},
		closed: () => {
			openingEmojiPicker?.dispose();
			openingEmojiPicker = null;
			observer.disconnect();
		},
	});
}

export const popupMenu = (items: MenuItem[] | Ref<MenuItem[]>, src?: HTMLElement, options?: {
	align?: string;
	width?: number;
	viaKeyboard?: boolean;
	onClosing?: () => void;
}): Promise<{ canceled: boolean; }> => {
	return new Promise((resolve) => {
		let dispose: () => void;
		popup(MkPopupMenu, {
			items,
			src,
			width: options?.width,
			align: options?.align,
			viaKeyboard: options?.viaKeyboard,
		}, {
			done: (result: unknown) => {
				resolve({
					canceled: !result,
				});
			},
			closed: (result: unknown) => {
				resolve({
					canceled: !result,
				});
				dispose();
			},
			closing: () => {
				if (options?.onClosing) options.onClosing();
			},
		}).then(res => {
			dispose = res.dispose;
		});
	});
};

export const contextMenu = (items: MenuItem[] | Ref<MenuItem[]>, ev: MouseEvent): Promise<void> => {
	ev.preventDefault();
	return new Promise((resolve) => {
		let dispose: () => void;
		popup(MkContextMenu, {
			items,
			ev,
		}, {
			closed: () => {
				resolve();
				dispose();
			},
		}).then(res => {
			dispose = res.dispose;
		});
	});
};

const activePostFormDialog = computed(() => activePostFormDialogFlags.value.some(flag => flag.value === true));
const activePostFormDialogFlags = ref<Ref<boolean>[]>([]);
export const post = (props: Record<string, any> = {}): Promise<void> => {
	return new Promise((resolve, reject) => {
		if (activePostFormDialog.value) {
			reject();
			return;
		}
		const isProcessing = ref(true);
		activePostFormDialogFlags.value.push(isProcessing);
		// NOTE: MkPostFormDialogをdynamic importするとiOSでテキストエリアに自動フォーカスできない
		// NOTE: ただ、dynamic importしない場合、MkPostFormDialogインスタンスが使いまわされ、
		//       Vueが渡されたコンポーネントに内部的に__propsというプロパティを生やす影響で、
		//       複数のpost formを開いたときに場合によってはエラーになる
		//       もちろん複数のpost formを開けること自体Misskeyサイドのバグなのだが
		let dispose: () => void;
		popup(MkPostFormDialog, props, {
			closed: () => {
				resolve();
				dispose();
				isProcessing.value = false;
			},
		}).then(res => {
			dispose = res.dispose;
		});
	});
};

export const deckGlobalEvents = new EventEmitter();

// export const checkExistence = (fileData: ArrayBuffer): Promise<any> => {
// 	return new Promise((resolve) => {
// 		const data = new FormData();
// 		data.append('md5', getMD5(fileData));

// 		api('drive/files/find-by-hash', {
// 			md5: getMD5(fileData),
// 		}).then(resp => {
// 			resolve(resp.length > 0 ? resp[0] : null);
// 		});
// 	});
// };

export const shownNoteIds = new Set<string>();

window.setInterval(() => {
	shownNoteIds.clear();
}, 1000 * 60 * 5);
