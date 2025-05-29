import 'dotenv/config';
import type { RenderMediaOnProgress } from '@remotion/renderer';
import yaml from 'js-yaml';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import type {QuizPlan, Video} from './generatePlan.mts';
import {selectComposition, renderMedia} from '@remotion/renderer';
import {bundle} from '@remotion/bundler';
import type {itQuizCompositionSchema, Quiz} from '../src/ItQuizComposition.js';
import {
	synthesisGoogleToFile,
	synthesisVoiceVoxToFile,
} from './lib/synthesis.js';
import { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const onRenderProgress: RenderMediaOnProgress = ({ renderedFrames, encodedFrames, encodedDoneIn, renderedDoneIn, stitchStage }) => {
	if (stitchStage === 'encoding') {
		// First pass, parallel rendering of frames and encoding into video
		console.log('Encoding...');
	} else if (stitchStage === 'muxing') {
		// Second pass, adding audio to the video
		console.log('Muxing audio...');
	}
	// Amount of frames rendered into images
	console.log(`${renderedFrames} rendered`);
	// Amount of frame encoded into a video
	console.log(`${encodedFrames} encoded`);
	// Time to create images of all frames
	if (renderedDoneIn !== null) {
		console.log(`Rendered in ${renderedDoneIn}ms`);
	}
	// Time to encode video from images
	if (encodedDoneIn !== null) {
		console.log(`Encoded in ${encodedDoneIn}ms`);
	}
};

const getSpeakerName = (voiceId: string): string => {
	switch (voiceId) {
		case 'tsumugi':
			return '春日部つむぎ';
		case 'metan':
			return '四国めたん';
		case 'zundamon':
			return 'ずんだもん';
		default:
			throw new Error(`Unknown voiceId: ${voiceId}`);
	}
};

interface QuizInfo {
	input: QuizPlan;
	output: Quiz;
	questionSynthesisResult: Awaited<ReturnType<typeof synthesisGoogleToFile>>;
	answerSynthesisResult: Awaited<ReturnType<typeof synthesisVoiceVoxToFile>>;
}

interface VideoInfo {
	volume: number;
	date: string;
	voiceId: string;
	questionSpeechId: string;
	introQuestion: {
		image: string;
		text: string;
	};
	quizzes: QuizInfo[];
}

(async () => {
	const videosYamlPath = path.join(__dirname, '..', 'data', 'videos.yaml');
	const videos = yaml.loadAll(
		await fs.readFile(videosYamlPath, 'utf8'),
	) as Video[];
	if (!Array.isArray(videos)) {
		throw new Error('Invalid videos.yaml format. Expected an array of videos.');
	}

	console.log(`Found ${videos.length} videos in ${videosYamlPath}`);
	console.log(`Bundling Remotion project...`);
	const bundleLocation = await bundle({
		entryPoint: path.join(__dirname, '..', 'src', 'index.ts'),
		onProgress(progress) {
			console.log(`Bundling progress: ${progress.toFixed(2)}%`);
		},
	});

	for (const video of videos) {
		const outputFilePath = path.join(
			__dirname,
			'..',
			'data',
			'.videos',
			`volume-${video.volume}.json`,
		);
		const outputFileExists = await fs
			.access(outputFilePath)
			.then(() => true)
			.catch(() => false);

		if (outputFileExists) {
			console.warn(`Output file ${outputFilePath} already exists. Skipping...`);
			continue;
		}

		const voiceSpeakerName = getSpeakerName(video.voiceId);

		const quizzes: Quiz[] = [];
		const quizInfos: QuizInfo[] = [];

		for (const quiz of video.quizzes) {
			const questionSpeechFileName = `question-${quiz.quizId}-${video.questionSpeechId}.mp3`;
			const answerSpeechFileName = `answer-${quiz.quizId}-${video.voiceId}.wav`;

			console.log(`Synthesis question for quiz ${quiz.quizId}...`);
			const questionSynthesisResult = await synthesisGoogleToFile(
				video.questionSpeechId,
				quiz.question,
				questionSpeechFileName,
			);

			console.log(`Synthesis answer for quiz ${quiz.quizId}...`);
			const answerSynthesisResult = await synthesisVoiceVoxToFile(
				voiceSpeakerName,
				quiz.answerReading ?? quiz.answer,
				answerSpeechFileName,
			);

			const quizOutput: Quiz = {
				quizId: quiz.quizId,
				clauses: questionSynthesisResult.clauses,
				difficulty: quiz.difficulty,
				timepoints: questionSynthesisResult.timepoints.filter(
					(timepoint): timepoint is {timeSeconds: number; markName: string} =>
						typeof timepoint.timeSeconds === 'number' &&
						typeof timepoint.markName === 'string',
				),
				answer: quiz.answer,
				alternativeAnswers: quiz.alternativeAnswers,
				questionSpeechFileName,
				answerSpeechFileName,
				answerImage: null,
			};

			quizzes.push(quizOutput);

			quizInfos.push({
				input: quiz,
				output: quizOutput,
				questionSynthesisResult,
				answerSynthesisResult,
			});
		}

		const videoInfo: VideoInfo = {
			volume: video.volume,
			date: video.date,
			voiceId: video.voiceId,
			questionSpeechId: video.questionSpeechId,
			introQuestion: {
				image: video.introQuestion.image,
				text: video.introQuestion.text,
			},
			quizzes: quizInfos,
		};

		const compositionProps: z.infer<typeof itQuizCompositionSchema> = {
			volumes: video.volume,
			date: video.date,
			voiceId: video.voiceId,
			questionSpeechId: video.questionSpeechId,
			introQuestionImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/41/Roofline_model.png',
			introQuestion: video.introQuestion.text,
			introQuestionImageCopyrightText: '',
			introQuestionImageMask: null,
			quizzes,
		};

		const composition = await selectComposition({
			serveUrl: bundleLocation,
			id: 'ItQuizComposition',
			inputProps: compositionProps,
		});

		console.log(`Rendering video for volume ${video.volume}...`);
		await renderMedia({
			composition,
			serveUrl: bundleLocation,
			codec: 'h264',
			outputLocation: `out/it-quiz-volume-${video.volume}.mp4`,
			inputProps: compositionProps,
			onProgress: onRenderProgress,
			timeoutInMilliseconds: 30 * 60 * 1000,
		});

		await fs.mkdir(path.dirname(outputFilePath), {recursive: true});
		await fs.writeFile(
			outputFilePath,
			JSON.stringify(videoInfo, null, 2),
			'utf-8',
		);
	}
})();
