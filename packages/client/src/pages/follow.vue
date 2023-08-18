<template>
<div class="mk-follow-page">
</div>
</template>

<script lang="ts" setup>
import { } from 'vue';
import { UserDetailed } from 'misskey-js/built/entities';
import * as Acct from 'misskey-js/built/acct';
import * as os from '@/os';
import { mainRouter } from '@/router';
import { i18n } from '@/i18n';
import { $i } from '@/account';

const follow = async (user: UserDetailed): Promise<void> => {
	if ($i?.id === user.id) throw error('Followee is yourself.');
	if (user.isFollowing) throw error('You are already following that user.');
	if (user.isBlocking) throw error('You are blocking that user.');
	if (user.isBlocked) throw error('You are blocked by that user.');

	const { canceled } = await os.confirm({
		type: 'question',
		text: i18n.t('followConfirm', { name: user.name || user.username }),
		okText: i18n.ts.follow,
	});

	if (canceled) close();

	os.apiWithDialog('following/create', {
		userId: user.id,
	});
};

const close = (): void => {
	window.close();

	// 閉じなければ100ms後タイムラインに
	window.setTimeout(() => {
		mainRouter.push('/');
	}, 100);
};

const error = (message: string): TypeError => {
	os.alert({
		type: 'error',
		text: message,
	}).then(close);
	return new TypeError(message);
};

const acct = new URLSearchParams(window.location.search).get('acct');

if (acct == null) {
	throw error('Missing required query: acct.');
}

if (acct.startsWith('http://') || acct.startsWith('https://')) {
	const promise = os.api('ap/show', {
		uri: acct,
	});
	os.promiseDialog(promise, null, null, i18n.ts.fetchingAsApObject);

	const res = await promise;

	if (res.type === 'User') {
		follow(res.object);
	} else {
		throw error(`${acct} is not User.`);
	}
} else {
	const { username, host } = Acct.parse(acct);
	const promise = os.api('users/show', { username, host: host ?? undefined });
	os.promiseDialog(promise, null, null, i18n.ts.fetchingAsApObject);

	const user = await promise;

	follow(user);
}
</script>
