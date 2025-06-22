import 'dotenv/config';
import {google} from 'googleapis';
import fs from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import readline from 'node:readline';
import type {Credentials} from 'google-auth-library';
import type {VideoInfo} from './generateVideos.mjs';
import {stripIndents} from 'common-tags';
import {GaxiosError} from 'gaxios';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

interface LocalVideo {
	volume: number;
	videoPath: string;
	thumbnailPath: string;
	metadata: VideoInfo | null;
}

interface YouTubeVideoItem {
	snippet?: {
		title?: string | null;
	};
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isDryRun = process.argv.includes('--dry-run');

if (isDryRun) {
	console.log('🔍 DRY RUN MODE: No actual uploads will be performed');
}

const TOKEN_PATH = path.join(__dirname, '..', 'oauth2-token.json');

/**
 * Get OAuth2 credentials from environment or file
 */
const getOAuth2Credentials = async () => {
	const credentials = {
		client_id: process.env.GOOGLE_CLIENT_ID,
		client_secret: process.env.GOOGLE_CLIENT_SECRET,
		redirect_uris: ['urn:ietf:wg:oauth:2.0:oob'],
	};

	if (!credentials.client_id || !credentials.client_secret) {
		throw new Error(
			'GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables are required for OAuth2',
		);
	}

	return credentials;
};

/**
 * Load previously saved OAuth2 token
 */
const loadSavedToken = async (): Promise<Credentials | null> => {
	try {
		const token = await fs.readFile(TOKEN_PATH, 'utf-8');
		return JSON.parse(token);
	} catch {
		return null;
	}
};

/**
 * Save OAuth2 token to file
 */
const saveToken = async (token: Credentials) => {
	await fs.writeFile(TOKEN_PATH, JSON.stringify(token, null, 2));
	console.log('OAuth2 token saved to', TOKEN_PATH);
};

/**
 * Get authorization URL and prompt user to authorize
 */
const getNewToken = async (
	oAuth2Client: InstanceType<typeof google.auth.OAuth2>,
): Promise<Credentials> => {
	const authUrl = oAuth2Client.generateAuthUrl({
		access_type: 'offline',
		scope: [
			'https://www.googleapis.com/auth/youtube.upload',
			'https://www.googleapis.com/auth/youtube.readonly',
		],
	});

	console.log('\n🔐 Authorization required!');
	console.log('Please visit this URL to authorize the application:');
	console.log('\n' + authUrl + '\n');

	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	return new Promise((resolve, reject) => {
		rl.question('Enter the authorization code here: ', async (code) => {
			rl.close();
			try {
				const {tokens} = await oAuth2Client.getToken(code);
				await saveToken(tokens);
				resolve(tokens);
			} catch (error) {
				reject(error);
			}
		});
	});
};

// Initialize Google authentication and YouTube Data API client with OAuth2
const createYouTubeClient = async () => {
	const credentials = await getOAuth2Credentials();

	const oAuth2Client = new google.auth.OAuth2(
		credentials.client_id,
		credentials.client_secret,
		credentials.redirect_uris[0],
	);

	let token = await loadSavedToken();

	if (!token) {
		token = await getNewToken(oAuth2Client);
	}

	oAuth2Client.setCredentials(token);

	// Check if token needs refresh
	if (token.expiry_date && Date.now() >= token.expiry_date) {
		console.log('Refreshing expired OAuth2 token...');
		try {
			const {credentials: newCredentials} =
				await oAuth2Client.refreshAccessToken();
			await saveToken(newCredentials);
			oAuth2Client.setCredentials(newCredentials);
		} catch {
			console.log('Failed to refresh token, requesting new authorization...');
			const newToken = await getNewToken(oAuth2Client);
			oAuth2Client.setCredentials(newToken);
		}
	}

	return google.youtube({
		version: 'v3',
		auth: oAuth2Client,
	});
};

/**
 * Fetch recent videos from YouTube and return the maximum number
 * Includes all videos (public, private, unlisted, scheduled)
 */
const getLatestVideoNumber = async (
	youtube: ReturnType<typeof google.youtube>,
): Promise<number> => {
	console.log(
		'Fetching latest video information from YouTube (including private/scheduled videos)...',
	);

	// First, get the channel's uploads playlist ID
	const channelResponse = await youtube.channels.list({
		part: ['contentDetails'],
		id: [process.env.YOUTUBE_CHANNEL_ID!],
	});

	const uploadsPlaylistId =
		channelResponse.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
	if (!uploadsPlaylistId) {
		throw new Error('Could not find uploads playlist for the channel');
	}

	console.log(`Found uploads playlist ID: ${uploadsPlaylistId}`);

	// Fetch all videos from the uploads playlist (includes private/scheduled videos)
	const allVideos: Array<YouTubeVideoItem> = [];
	let nextPageToken: string | undefined;
	let pageCount = 0;
	const maxPages = 10; // Limit to prevent infinite loops

	do {
		const playlistResponse = await youtube.playlistItems.list({
			part: ['snippet'],
			playlistId: uploadsPlaylistId,
			maxResults: 50,
			pageToken: nextPageToken,
		});

		const videos = playlistResponse.data.items || [];
		allVideos.push(...videos);
		nextPageToken = playlistResponse.data.nextPageToken || undefined;
		pageCount++;

		console.log(`Fetched page ${pageCount}: ${videos.length} videos`);
	} while (nextPageToken && pageCount < maxPages);

	let maxNumber = 0;
	console.log(
		`Found ${allVideos.length} total videos on YouTube (including private/scheduled)`,
	);

	for (const video of allVideos) {
		const title = video.snippet?.title || '';
		// Extract "#number" format from title
		const match = title.match(/#(\d+)/);
		if (match) {
			const number = parseInt(match[1], 10);
			console.log(`Video found: "${title}" -> #${number}`);
			maxNumber = Math.max(maxNumber, number);
		}
	}

	console.log(`Maximum number found on YouTube: #${maxNumber}`);
	return maxNumber;
};

/**
 * Load video metadata from data/.videos directory
 */
const loadVideoMetadata = async (volume: number): Promise<VideoInfo> => {
	try {
		const metadataPath = path.join(
			__dirname,
			'..',
			'data',
			'.videos',
			`volume-${volume}.json`,
		);
		const metadataContent = await fs.readFile(metadataPath, 'utf-8');
		return JSON.parse(metadataContent) as VideoInfo;
	} catch (error) {
		throw new Error(`Could not load metadata for volume ${volume}: ${error}`);
	}
};

/**
 * Calculate scheduled publish date based on video metadata
 */
const calculateScheduledDate = (metadata: VideoInfo): Date => {
	const scheduledDate = dayjs(metadata.date)
		.tz('Asia/Tokyo')
		.hour(18)
		.minute(0)
		.second(0)
		.millisecond(0);

	return scheduledDate.toDate();
};

/**
 * Get video files from out directory and return sorted by volume
 */
const getLocalVideos = async (): Promise<Array<LocalVideo>> => {
	const outDir = path.join(__dirname, '..', 'out');
	const files = await fs.readdir(outDir);

	const videos: Array<LocalVideo> = [];

	for (const file of files) {
		const match = file.match(/^it-quiz-volume-(\d+)\.mp4$/);
		if (match) {
			const volume = parseInt(match[1], 10);
			const videoPath = path.join(outDir, file);
			const thumbnailPath = path.join(
				outDir,
				`it-quiz-volume-${volume}-thumbnail.png`,
			);

			// Check existence of video and thumbnail files
			try {
				await fs.access(videoPath);
				await fs.access(thumbnailPath);

				// Load metadata
				const metadata = await loadVideoMetadata(volume);

				videos.push({volume, videoPath, thumbnailPath, metadata});
			} catch {
				console.warn(`Video or thumbnail not found: volume ${volume}`);
			}
		}
	}

	// Sort by volume
	videos.sort((a, b) => a.volume - b.volume);
	console.log(
		`Local videos found: ${videos.map((v) => `#${v.volume}`).join(', ')}`,
	);

	return videos;
};

const getJapaneseDateString = (date: Date): string => {
	const year = date.getFullYear();
	const month = date.getMonth() + 1;
	const day = date.getDate();
	return `${year}年${month}月${day}日`;
};

const normalizeQuizText = (text: string): string => {
	return text.replace(/<.+?>/g, '').trim();
};

/**
 * Upload video to YouTube as YouTube Shorts with scheduled publishing
 */
const uploadVideo = async (
	youtube: ReturnType<typeof google.youtube>,
	videoPath: string,
	thumbnailPath: string,
	volume: number,
	metadata: VideoInfo,
	dryRun: boolean = false,
): Promise<void> => {
	if (dryRun) {
		console.log(`[DRY RUN] Would upload YouTube Shorts video #${volume}...`);
	} else {
		console.log(`Uploading YouTube Shorts video #${volume}...`);
	}

	const scheduledDate = calculateScheduledDate(metadata);
	const scheduledPublishTime = scheduledDate.toISOString();

	const japaneseDate = getJapaneseDateString(scheduledDate);
	const quizDescriptions = metadata.quizzes
		.map(
			(quiz, index) =>
				`【第${index + 1}問】${normalizeQuizText(quiz.input.question)}`,
		)
		.join('\n\n');

	const title = `【今日のITクイズ #${volume}】${metadata.introQuestion.text}【早押しクイズ】 #shorts #ITクイズ #早押しクイズ #プログラミング #コンピューター #インターネット`;
	const description = stripIndents`
		${japaneseDate}のITクイズをお届け！
		あなたは何問解ける？

		${quizDescriptions}

		# -*- coding: utf-8 -*-
		ITクイズチャンネル
		https://lit.link/itquiz
		IT系の早押しクイズのショート動画を毎日配信中！
		問題不備などの連絡はコメント欄か作者のX (https://x.com/hakatashi) までお願いします！

		#shorts #ITクイズ #早押しクイズ #プログラミング #コンピューター #インターネット
	`;

	console.log(`Video metadata:`);
	console.log(`  Title: ${title}`);
	console.log('  Description:');
	console.log(
		description
			.split('\n')
			.map((line) => `    ${line}`)
			.join('\n'),
	);
	console.log(`  Video file: ${videoPath}`);
	console.log(`  Thumbnail file: ${thumbnailPath}`);
	console.log(`  Scheduled publish time: ${scheduledPublishTime}`);

	if (dryRun) {
		return;
	}

	// Upload video
	const videoResponse = await youtube.videos.insert({
		part: ['snippet', 'status'],
		requestBody: {
			snippet: {
				title,
				description,
				tags: [
					'ITクイズ',
					'早押しクイズ',
					'プログラミング',
					'コンピューター',
					'インターネット',
					'技術',
					'IT',
					'Shorts',
					'YouTube Shorts',
				],
				categoryId: '27',
				defaultLanguage: 'ja',
				defaultAudioLanguage: 'ja',
			},
			status: {
				privacyStatus: 'private',
				selfDeclaredMadeForKids: false,
				publishAt: scheduledPublishTime,
			},
		},
		media: {
			body: createReadStream(videoPath),
		},
	});

	const videoId = videoResponse.data.id;
	if (!videoId) {
		throw new Error('Video upload failed: Could not get videoId');
	}
	console.log(
		`YouTube Shorts video #${volume} upload completed (ID: ${videoId})`,
	);

	// Upload thumbnail
	try {
		await youtube.thumbnails.set({
			videoId,
			media: {
				body: createReadStream(thumbnailPath),
			},
		});
		console.log(`Thumbnail uploaded for YouTube Shorts video #${volume}`);
	} catch (thumbnailError) {
		console.error(
			`Failed to upload thumbnail for YouTube Shorts video #${volume}:`,
			thumbnailError,
		);
	}

	// Add video to playlist
	const playlistId = process.env.YOUTUBE_PLAYLIST_ID;
	if (!playlistId) {
		throw new Error('YOUTUBE_PLAYLIST_ID environment variable is not set');
	}
	try {
		await youtube.playlistItems.insert({
			part: ['snippet'],
			requestBody: {
				snippet: {
					playlistId,
					resourceId: {
						kind: 'youtube#video',
						videoId,
					},
				},
			},
		});
		console.log(`Video #${volume} added to playlist`);
	} catch (playlistError) {
		console.error(`Failed to add video #${volume} to playlist:`, playlistError);
	}
};

/**
 * Main process
 */
const main = async () => {
	try {
		console.log('Starting YouTube Shorts upload process...');

		if (!process.env.YOUTUBE_CHANNEL_ID) {
			throw new Error('YOUTUBE_CHANNEL_ID environment variable is not set');
		}

		const youtube = await createYouTubeClient();

		const latestNumber = await getLatestVideoNumber(youtube);

		const localVideos = await getLocalVideos();

		const videosToUpload = localVideos.filter(
			(video) => video.volume > latestNumber,
		);
		if (videosToUpload.length === 0) {
			console.log('No new YouTube Shorts videos to upload.');
			return;
		}

		console.log(
			`YouTube Shorts videos to upload: ${videosToUpload.map((v) => `#${v.volume}`).join(', ')}`,
		);
		for (const video of videosToUpload) {
			const metadata = await loadVideoMetadata(video.volume);

			await uploadVideo(
				youtube,
				video.videoPath,
				video.thumbnailPath,
				video.volume,
				metadata,
				isDryRun,
			);

			// Wait to avoid API rate limits
			await new Promise((resolve) =>
				setTimeout(resolve, isDryRun ? 500 : 2000),
			);
		}

		console.log('All YouTube Shorts uploads completed successfully!');
	} catch (error) {
		console.error(
			'Error occurred during YouTube Shorts upload process:',
			error,
		);
		if (error instanceof GaxiosError) {
			const data = error.response?.data;
			if (data) {
				console.error('Error details:', data);
			} else {
				console.error('No error details available');
			}
		}
		process.exit(1);
	}
};

await main();
