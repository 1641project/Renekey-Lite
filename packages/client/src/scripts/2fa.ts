export const byteify = (string: string, encoding: 'ascii' | 'base64' | 'hex'): Uint8Array => {
	switch (encoding) {
		case 'ascii':
			return Uint8Array.from(string, c => c.charCodeAt(0));
		case 'base64':
			return Uint8Array.from(
				window.atob(string.replace(/-/g, '+').replace(/_/g, '/')),
				c => c.charCodeAt(0),
			);
		case 'hex':
			return new Uint8Array(
				[...string.match(/.{1,2}/g) ?? []].map(byte => parseInt(byte, 16)),
			);
	}
};

export const hexify = (buffer: ArrayBuffer): string => {
	return Array.from(new Uint8Array(buffer))
		.reduce(
			(str, byte) => str + byte.toString(16).padStart(2, '0'),
			'',
		);
};

export const stringify = (buffer: ArrayBuffer): string => {
	return String.fromCharCode(...new Uint8Array(buffer));
};
