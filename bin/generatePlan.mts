/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @remotion/deterministic-randomness */

import 'dotenv/config';
import yaml from 'js-yaml';
import fs from 'node:fs/promises';
import path from 'node:path';
import type {Quiz, NormalQuiz} from '../../it-quiz-data/.github/bin/quizzes.js';
import {last, range} from 'lodash-es';
import {fileURLToPath} from 'node:url';

const numberOfVideos = Number.parseInt(process.argv[2]);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (Number.isNaN(numberOfVideos) || numberOfVideos < 1) {
	console.error('Usage: node generatePlan.js <number_of_videos>');
	process.exit(1);
}

const getJson = async <T,>(url: string): Promise<T> => {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
	}
	return response.json();
};

export interface QuizPlan {
	difficulty: number;
	quizId: number;
	question: string;
	answer: string;
	answerReading: string | null;
	alternativeAnswers: string[];
	answerImage?: string;
}

export interface Video {
	quizzes: QuizPlan[];
	volume: number;
	date: string;
	voiceId: string;
	questionSpeechId: string;
	introQuestion: {
		image: string;
		text: string;
		mask: string | null;
	};
}

const NEW_QUIZ_COUNT = 2;
const OLD_QUIZ_COUNT = 3;

const isNormalQuiz = (quiz: Quiz): quiz is NormalQuiz => {
	return !('removed' in quiz);
};

(async () => {
	const latestRelease = await getJson<{
		assets: {name: string; browser_download_url: string}[];
	}>('https://api.github.com/repos/hakatashi/it-quiz/releases/latest');
	const quizJsonUrl = latestRelease.assets.find((asset: {name: string}) =>
		asset.name.match(/it-quiz-v.+\.json/),
	)?.browser_download_url;
	if (!quizJsonUrl) {
		throw new Error('Quiz JSON URL not found in the latest release.');
	}

	const quizzes = await getJson<Quiz[]>(quizJsonUrl);
	console.log(`Loaded ${quizzes.length} quizzes from ${quizJsonUrl}`);

	const filteredQuizzes = quizzes
		.map((quiz, i) => [i, quiz] as [number, Quiz])
		.filter((quiz): quiz is [number, NormalQuiz] => {
			return isNormalQuiz(quiz[1]);
		});

	let volume = 1;
	let date = '2025-05-31';

	const videos: Video[] = [];
	for (const _j of range(numberOfVideos)) {
		const quizPlans: QuizPlan[] = [];

		const addQuiz = (quiz: NormalQuiz, quizId: number) => {
			const alternativeAnswers: string[] = [];

			for (const answer of quiz.alternativeAnswers || []) {
				if (
					!quiz.answer.includes(answer) &&
					!alternativeAnswers.some((ans) => ans.includes(answer))
				) {
					alternativeAnswers.push(answer);
				}
			}

			quizPlans.push({
				difficulty: 3,
				quizId,
				question: quiz.question,
				answer: quiz.answer,
				answerReading: null,
				alternativeAnswers,
			});
		};

		for (const _i of range(NEW_QUIZ_COUNT)) {
			const lastQuiz = last(filteredQuizzes);
			if (!lastQuiz) {
				throw new Error('Not enough quizzes to select from.');
			}
			const [quizId, quiz] = lastQuiz;
			addQuiz(quiz, quizId);
			filteredQuizzes.splice(
				filteredQuizzes.findIndex((q) => q[0] === quizId),
				1,
			);
		}

		for (const _i of range(OLD_QUIZ_COUNT)) {
			const [quizId, quiz] =
				filteredQuizzes[Math.floor(Math.random() * filteredQuizzes.length)];
			addQuiz(quiz, quizId);
			filteredQuizzes.splice(
				filteredQuizzes.findIndex((q) => q[0] === quizId),
				1,
			);
		}

		videos.push({
			volume,
			date,
			voiceId: 'tsumugi',
			questionSpeechId: 'ja-JP-Neural2-B',
			introQuestion: {
				image: 'image.png',
				text: 'これは何？',
				mask: null,
			},
			quizzes: quizPlans,
		});

		volume++;
		date = new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000)
			.toISOString()
			.split('T')[0];
	}

	let output = '';

	for (const video of videos) {
		output += `---\n${yaml.dump(video)}\n`;
	}

	if (await fs.stat(path.join(__dirname, '..', 'data')).catch(() => false)) {
		await fs.mkdir(path.join(__dirname, '..', 'data'), {recursive: true});
	}

	await fs.writeFile(
		path.join(__dirname, '..', 'data', 'videos.yaml'),
		output,
		'utf8',
	);

	console.log(
		`Generated ${numberOfVideos} video plans and saved to data/videos.yaml`,
	);
})();
