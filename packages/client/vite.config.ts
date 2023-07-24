import path from 'path';
import * as fs from 'fs';
import pluginVue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import ReactivityTransform from '@vue-macros/reactivity-transform/vite';

import locales from '../../locales';
import meta from '../../package.json';
import pluginJson5 from './vite.json5';

const extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.json', '.json5', '.svg', '.sass', '.scss', '.css', '.vue'];

const pathToIdentifier = (_path: string): string => _path.replace(/[\\\/\.\?&=]/g, '-');

const hash = (str: string, seed = 0): number => {
	let h1 = 0xdeadbeef ^ seed;
	let h2 = 0x41c6ce57 ^ seed;

	for (let i = 0; i < str.length; i++) {
		const ch = str.charCodeAt(i);
		h1 = Math.imul(h1 ^ ch, 2654435761);
		h2 = Math.imul(h2 ^ ch, 1597334677);
	}

	h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
	h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

	return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

const BASE62_DIGITS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const toBase62 = (n: number): string => {
	if (n === 0) return '0';

	let result = '';

	while (n > 0) {
		result = BASE62_DIGITS[n % BASE62_DIGITS.length] + result;
		// eslint-disable-next-line no-param-reassign
		n = Math.floor(n / BASE62_DIGITS.length);
	}

	return result;
};

// eslint-disable-next-line import/no-default-export
export default defineConfig(({ command, mode }) => {
	fs.mkdirSync(__dirname + '/../../built', { recursive: true });
	fs.writeFileSync(__dirname + '/../../built/meta.json', JSON.stringify({ version: meta.version }), 'utf-8');

	return {
		base: '/assets/',

		server: {
			port: 5173,
		},

		plugins: [
			pluginVue({
				reactivityTransform: true,
			}),
			ReactivityTransform(),
			pluginJson5(),
		],

		resolve: {
			extensions,
			alias: {
				'@/': __dirname + '/src/',
				'/client-assets/': __dirname + '/assets/',
				'/static-assets/': __dirname + '/../backend/assets/',
			},
		},

		css: {
			modules: {
				generateScopedName(name, _filename, _css): string {
					const _path = path.relative(__dirname, _filename.split('?')[0]).replace(/^src\//, '');
					const filename = `${path.dirname(_path).replaceAll(path.sep, '/')}/${path.parse(_path).name}`;
					const pathArr = filename.split('/');

					switch (pathArr[0]) {
						case 'components': {
							return `_${name}_${pathToIdentifier(filename.slice(11))}`;
						}
						case 'pages':
						case 'ui': {
							return `_${name}_${pathToIdentifier(filename)}`;
						}
						default: {
							return `_${name}__${toBase62(hash(pathToIdentifier(filename))).substring(0, 5)}`;
						}
					}
				},
			},
		},

		define: {
			_VERSION_: JSON.stringify(meta.version),
			_LANGS_: JSON.stringify(Object.entries(locales).map(([k, v]) => [k, v._lang_])),
			_ENV_: JSON.stringify(process.env.NODE_ENV),
			_DEV_: process.env.NODE_ENV !== 'production',
			_PERF_PREFIX_: JSON.stringify('Misskey:'),
			_DATA_TRANSFER_DRIVE_FILE_: JSON.stringify('mk_drive_file'),
			_DATA_TRANSFER_DRIVE_FOLDER_: JSON.stringify('mk_drive_folder'),
			_DATA_TRANSFER_DECK_COLUMN_: JSON.stringify('mk_deck_column'),
			__VUE_OPTIONS_API__: true,
			__VUE_PROD_DEVTOOLS__: false,
		},

		build: {
			target: [
				'chrome100',
				'firefox100',
				'safari15',
			],
			manifest: 'manifest.json',
			rollupOptions: {
				input: {
					app: './src/_boot_.ts',
				},
				output: {
					manualChunks: {
						vue: ['vue'],
						photoswipe: ['photoswipe', 'photoswipe/lightbox', 'photoswipe/style.css'],
					},
					chunkFileNames: process.env.NODE_ENV === 'production' ? '[hash:8].js' : '[name]-[hash:8].js',
					assetFileNames: process.env.NODE_ENV === 'production' ? '[hash:8][extname]' : '[name]-[hash:8][extname]',
				},
			},
			cssCodeSplit: true,
			outDir: __dirname + '/../../built/_client_dist_',
			assetsDir: '.',
			emptyOutDir: false,
			sourcemap: process.env.NODE_ENV === 'development',
			reportCompressedSize: false,
		},

		worker: {
			format: 'es',
		},
	};
});
