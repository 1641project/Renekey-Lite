import { numberFormat } from '@/scripts/intl-const';

// eslint-disable-next-line import/no-default-export
export default (n: unknown): string => n == null ? 'N/A' : numberFormat.format(Number(n));
