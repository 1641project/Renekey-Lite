type Http = `http://${string}`;
type Https = `https://${string}`;

export const checkHttp = (value: unknown): value is Http => {
	return typeof value === 'string' && value.startsWith('http://');
};

export const checkHttps = (value: unknown): value is Https => {
	return typeof value === 'string' && value.startsWith('https://');
};

export const checkHttpOrHttps = (value: unknown): value is Http | Https => {
	return typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'));
};
