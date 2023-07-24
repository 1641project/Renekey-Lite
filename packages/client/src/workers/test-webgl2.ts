const canvas = (globalThis.OffscreenCanvas as typeof globalThis.OffscreenCanvas | undefined) && new OffscreenCanvas(1, 1);
const gl = canvas?.getContext('webgl2');
if (gl) {
	postMessage({ result: true });
} else {
	postMessage({ result: false });
}
