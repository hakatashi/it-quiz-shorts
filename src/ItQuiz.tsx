import {loadFont} from '@remotion/fonts';
import { range } from 'lodash-es';
import {Audio, Img, Sequence, spring, staticFile} from 'remotion';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';

loadFont({
	family: 'Noto Sans Japanese',
	url: staticFile('fonts/NotoSansJP-Bold.ttf'),
	weight: '700',
});

loadFont({
	family: 'Noto Serif Japanese',
	url: staticFile('fonts/NotoSerifJP-SemiBold.ttf'),
	weight: '600',
});

loadFont({
	family: 'Monaspace Neon',
	url: staticFile('fonts/MonaspaceNeon-ExtraBold.otf'),
	weight: '900',
});

loadFont({
	family: 'M PLUS 1',
	url: staticFile('fonts/Mplus1-Bold.otf'),
	weight: '700',
});

export const itQuizSchema = z.object({
	volumes: z.number().min(1),
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	clauses: z.array(z.string()),
	difficulty: z.number().int().min(1).max(5),
	quizId: z.number().int().min(0),
	questionSpeechFileName: z.string(),
	timepoints: z.array(
		z.object({
			timeSeconds: z.number(),
			markName: z.string(),
		}),
	),
	answer: z.string(),
	alternativeAnswers: z.array(z.string()),
	answerSpeechFileName: z.string(),
});

const extractMarkIndex = (markName: string | null | undefined) =>
	markName === null || markName === undefined
		? Number.NaN
		: Number.parseInt(markName.match(/c(\d+)/)?.[1] ?? '');

const getDifficultyText = (difficulty: number) => {
	switch (difficulty) {
		case 1:
			return '難易度★☆☆☆☆ (かんたん)';
		case 2:
			return '難易度★★☆☆☆ (少し難しい)';
		case 3:
			return '難易度★★★☆☆ (難しい)';
		case 4:
			return '難易度★★★★☆ (かなり難しい)';
		case 5:
			return '難易度★★★★★ (ゲキムズ)';
		default:
			throw new Error(`Invalid difficulty: ${difficulty}`);
	}
}

interface ClauseInformation {
	html: string;
	duration: number;
	hiddenRatio: string;
}

const CountDown: React.FC<{
	second: number;
}> = ({second}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const secondScale = spring({
		fps,
		frame,
		durationInFrames: 10,
	})

	return (
		<AbsoluteFill>
			<svg className="countdown_circle" width="600" height="600">
				<circle
					cx="50%"
					cy="50%"
					r="200"
					style={{
						// @ts-expect-error: Type doesn't support CSS variables
						'--ratio': 1 - frame / (0.8 * fps),
					}}
				/>
			</svg>
			<AbsoluteFill
				style={{
					transform: `translate(-50%, -50%) translateY(-20px) scale(${secondScale})`,
				}}
				className="countdown_number"
			>
				{second}
			</AbsoluteFill>
		</AbsoluteFill>
	)
};

const AnswerText: React.FC<{
	answer: string;
	alternativeAnswers: string[];
}> = ({answer, alternativeAnswers}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const textScale = spring({
		fps,
		frame,
		durationInFrames: 10,
	})

	return (
		<AbsoluteFill
			className="answer_text"
			style={{
				transform: `scale(${textScale})`,
				height: 'auto',
			}}
		>
			<div className="main_answer">
				{answer}
			</div>
			{alternativeAnswers.length > 0 && (
				<div className="alternative_answers">
					({alternativeAnswers.join('、')})
				</div>
			)}
		</AbsoluteFill>
	)
};

export const ItQuiz: React.FC<z.infer<typeof itQuizSchema>> = ({
	volumes,
	date,
	difficulty,
	quizId,
	clauses,
	timepoints,
	answer,
	alternativeAnswers,
	questionSpeechFileName,
	answerSpeechFileName,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const timestamp = frame / fps - 1;

	const sortedTimepoints = timepoints.sort(
		(a, b) => extractMarkIndex(a.markName) - extractMarkIndex(b.markName),
	);

	const clauseInformation: ClauseInformation[] = [];
	let previousMarkIndex = -1;
	let offset = 0;

	for (const timepoint of sortedTimepoints) {
		const markIndex = extractMarkIndex(timepoint.markName);
		const timeSeconds = timepoint.timeSeconds ?? 0;
		const clause = clauses
			.slice(previousMarkIndex + 1, markIndex + 1)
			.join('')
			.replaceAll(' ', '\xa0');

		const duration = timeSeconds - offset;
		let hiddenRatio = 1;
		if (timestamp > timeSeconds) {
			hiddenRatio = 0;
		} else if (timestamp < offset) {
			hiddenRatio = 1;
		} else {
			hiddenRatio = 1 - (timestamp - offset) / duration;
		}

		clauseInformation.push({
			html: clause,
			duration,
			hiddenRatio: `${hiddenRatio * 100}%`,
		});

		offset = timeSeconds;
		previousMarkIndex = markIndex;
	}

	const quizTitleScale = spring({
		fps,
		frame,
		durationInFrames: 15,
	});

	const quizSentenceDuration = clauseInformation.reduce(
		(acc, clause) => acc + clause.duration,
		0,
	);

	const quizPreparationDuration = fps * 1;
	const quizReadingDuration = Math.floor(quizSentenceDuration * fps);
	const countdownDuration = fps * 0.8 * 3;
	const answerPreparationDuration = fps * 1;

	const quizStartFrame = quizPreparationDuration;
	const countdownStartFrame = quizStartFrame + quizReadingDuration;
	const countdownEndFrame = countdownStartFrame + countdownDuration;
	const answerReadingStartFrame = countdownEndFrame + answerPreparationDuration;

	return (
		<AbsoluteFill style={{backgroundColor: 'white'}}>
			<AbsoluteFill>
				<Img src={staticFile('images/quiz.png')} />
				<AbsoluteFill className="quiz_volume">
					#{volumes} ({date})
				</AbsoluteFill>
			</AbsoluteFill>
			<Sequence durationInFrames={quizPreparationDuration} name="Quiz Preparation">
				<Audio
					src={staticFile('voices/tsumugi/第1問.wav')}
					volume={2}
				/>
				<Audio
					src={staticFile('soundeffects/和太鼓でドドン.mp3')}
					volume={1}
				/>
				<AbsoluteFill
					style={{
						transform: `translateX(-50%) scale(${quizTitleScale})`,
					}}
					className="quiz_title"
				>
					第1問
				</AbsoluteFill>
			</Sequence>
			<Sequence from={quizStartFrame} name="Quiz Text">
				<AbsoluteFill className="quiz_difficulty">
					{getDifficultyText(difficulty)}
				</AbsoluteFill>
				<AbsoluteFill className="quiz_id">
					No.{quizId}
				</AbsoluteFill>
				<AbsoluteFill className="quiz_text">
					{clauseInformation.map((clause, index) => (
						<span
							key={index}
							style={{
								// @ts-expect-error: Type doesn't support CSS variables
								'--hidden-ratio': clause.hiddenRatio,
								'--background-image': `url(${staticFile('images/opening1.png')})`,
							}}
							className="quiz_clause"
							dangerouslySetInnerHTML={{__html: clause.html}}
						/>
					))}
				</AbsoluteFill>
			</Sequence>
			<Sequence from={quizStartFrame} durationInFrames={quizReadingDuration} name="Quiz Audio">
				<Audio
					src={staticFile(`speeches/${questionSpeechFileName}`)}
					volume={2}
				/>
			</Sequence>
			<Sequence from={countdownStartFrame} durationInFrames={countdownDuration} name="Countdown">
				{range(0, 3).map((i) => (
					<Sequence key={i} from={i * fps * 0.8} durationInFrames={fps * 0.8}>
						<AbsoluteFill className="countdown">
							<CountDown second={3 - i} />
						</AbsoluteFill>
						<Audio
							src={staticFile('soundeffects/決定ボタンを押す52.mp3')}
							volume={2}
						/>
					</Sequence>
				))}
			</Sequence>
			<Sequence from={countdownEndFrame} durationInFrames={answerPreparationDuration} name="Answer Preparation">
				<Audio
					src={staticFile('voices/tsumugi/正解は.wav')}
					volume={2}
				/>
			</Sequence>
			<Sequence from={answerReadingStartFrame} durationInFrames={60} name="Answer Reading">
				<Audio
					src={staticFile(`speeches/${answerSpeechFileName}`)}
					volume={2}
				/>
				<Audio
					src={staticFile('soundeffects/決定ボタンを押す4.mp3')}
					volume={2}
				/>
				<AbsoluteFill className="answer_text_wrapper">
					<AnswerText answer={answer} alternativeAnswers={alternativeAnswers} />
				</AbsoluteFill>
			</Sequence>
		</AbsoluteFill>
	);
};
