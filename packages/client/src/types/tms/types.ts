import { UserDetailed } from 'misskey-js/built/entities';

export type Report = {
	id: string;
	createdAt: string;
	comment: string;
	resolved: boolean;
	reporterId: string;
	targetUserId: string;
	assigneeId: string | null;
	reporter: UserDetailed;
	targetUser: UserDetailed;
	assignee?: UserDetailed;
	forwarded: boolean;
};

export type Channel = {
	id: string;
	createdAt: string;
	lastNotedAt: string | null;
	name: string;
	description: string | null;
	bannerUrl: string | null;
	notesCount: number;
	usersCount: number;
	isFollowing?: boolean;
	userId: string | null;
};
