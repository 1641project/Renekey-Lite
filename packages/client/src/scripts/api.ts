import { Endpoints } from 'misskey-js/built/api.types';
import { ref } from 'vue';
import { apiUrl } from '@/config';
import { $i } from '@/account';

export const pendingApiRequestsCount = ref(0);

// Implements Misskey.api.ApiClient.request
export const api = <E extends keyof Endpoints, P extends Endpoints[E]['req']>(
	endpoint: E,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	data: P = {} as any,
	token?: string | null | undefined,
	signal?: AbortSignal,
): Promise<Endpoints[E]['res']> => {
	pendingApiRequestsCount.value++;

	const onFinally = (): void => {
		pendingApiRequestsCount.value--;
	};

	const promise = new Promise<Endpoints[E]['res'] | void>((resolve, reject) => {
		// Append a credential
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		if ($i) (data as any).i = $i.token;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		if (token != null) (data as any).i = token;

		// Send request
		window.fetch(endpoint.indexOf('://') > -1 ? endpoint : `${apiUrl}/${endpoint}`, {
			method: 'POST',
			body: JSON.stringify(data),
			credentials: 'omit',
			cache: 'no-cache',
			headers: {
				'Content-Type': 'application/json',
			},
			signal,
		}).then(async (res) => {
			const body = res.status === 204 ? null : await res.json();

			if (res.status === 200) {
				resolve(body);
			} else if (res.status === 204) {
				resolve();
			} else {
				reject(body.error);
			}
		}).catch(reject);
	});

	promise.then(onFinally, onFinally);

	return promise;
};

// Implements Misskey.api.ApiClient.request
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const apiGet = <E extends keyof Endpoints, P extends Endpoints[E]['req']>(
	endpoint: E,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	data: P = {} as any,
): Promise<Endpoints[E]['res']> => {
	pendingApiRequestsCount.value++;

	const onFinally = (): void => {
		pendingApiRequestsCount.value--;
	};

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const query = new URLSearchParams(data as any);

	const promise = new Promise<Endpoints[E]['res'] | void>((resolve, reject) => {
		// Send request
		window.fetch(`${apiUrl}/${endpoint}?${query}`, {
			method: 'GET',
			credentials: 'omit',
			cache: 'default',
		}).then(async (res) => {
			const body = res.status === 204 ? null : await res.json();

			if (res.status === 200) {
				resolve(body);
			} else if (res.status === 204) {
				resolve();
			} else {
				reject(body.error);
			}
		}).catch(reject);
	});

	promise.then(onFinally, onFinally);

	return promise;
};
