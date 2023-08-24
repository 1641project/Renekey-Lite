const aidRegExp = /^[0-9a-z]{10}$/;
const meidRegExp = /^[0-9a-f]{24}$/;
const meidgRegExp = /^g[0-9a-f]{23}$/;
const objectIdRegExp = /^[0-9a-f]{24}$/;

// 最初の1字だけ見る
type Num = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
type AZ = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm' | 'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' | 'v' | 'w' | 'x' | 'y' | 'z';
type AF = 'a' | 'b' | 'c' | 'd' | 'e' | 'f';
type MisskeyAid = `${Num | AZ}${string}`;
type MisskeyMeid = `${Num | AF}${string}`;
type MisskeyMeidg = `g${Num | AF}${string}`;
type MisskeyObjectId = `${Num | AF}${string}`;

type MisskeyId = MisskeyAid | MisskeyMeid | MisskeyMeidg | MisskeyObjectId;

const isMisskeyAid = (id: string): id is MisskeyAid => aidRegExp.test(id);
const isMisskeyMeid = (id: string): id is MisskeyMeid => meidRegExp.test(id);
const isMisskeyMeidg = (id: string): id is MisskeyMeidg => meidgRegExp.test(id);
const isMisskeyObjectId = (id: string): id is MisskeyObjectId => objectIdRegExp.test(id);

export const isMisskeyId = (id: string): id is MisskeyId => {
	return isMisskeyAid(id) || isMisskeyMeid(id) || isMisskeyMeidg(id) || isMisskeyObjectId(id);
};
