import {loadFont} from '@remotion/fonts';
import {clamp, range, sum, sumBy} from 'lodash-es';
import {
	Audio,
	Easing,
	Img,
	interpolate,
	Sequence,
	spring,
	staticFile,
} from 'remotion';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';

loadFont({
	family: 'Noto Sans Japanese',
	url: staticFile('fonts/NotoSansJP-Medium.ttf'),
	weight: '500',
}).then(() => {
	console.log('Noto Sans Japanese font loaded');
});

loadFont({
	family: 'Noto Sans Japanese',
	url: staticFile('fonts/NotoSansJP-Bold.ttf'),
	weight: '700',
}).then(() => {
	console.log('Noto Sans Japanese font loaded');
});

loadFont({
	family: 'Noto Sans Japanese',
	url: staticFile('fonts/NotoSansJP-Black.ttf'),
	weight: '900',
}).then(() => {
	console.log('Noto Sans Japanese font loaded');
});

loadFont({
	family: 'Noto Serif Japanese',
	url: staticFile('fonts/NotoSerifJP-SemiBold.ttf'),
	weight: '600',
}).then(() => {
	console.log('Noto Serif Japanese font loaded');
});

loadFont({
	family: 'Monaspace Neon',
	url: staticFile('fonts/MonaspaceNeon-ExtraBold.otf'),
	weight: '900',
}).then(() => {
	console.log('Monaspace Neon font loaded');
});

loadFont({
	family: 'M PLUS 1',
	url: staticFile('fonts/Mplus1-Bold.otf'),
	weight: '700',
}).then(() => {
	console.log('M PLUS 1 font loaded');
});

export const itQuizSchema = z.object({
	volumes: z.number().min(1),
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	voiceId: z.string().nonempty(),
	quizIndex: z.number().int().min(1),
	clauses: z.array(z.string()),
	difficulty: z.number().int().min(1).max(5),
	quizId: z.string().nonempty(),
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
	voiceVolume: z.number().min(0).max(1).default(2.5),
	questionVolume: z.number().min(0).max(1).default(1.5),
	answerImage: z.union([
		z.object({
			url: z.string(),
			copyrightText: z.string(),
		}),
		z.null(),
	]),
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
};

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
	});

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
				data-second={second}
			>
				{second}
			</AbsoluteFill>
		</AbsoluteFill>
	);
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
	});

	return (
		<AbsoluteFill
			className="answer_text"
			style={{
				transform: `scale(${textScale})`,
				height: 'auto',
			}}
		>
			<div className="main_answer" data-answer={answer}>
				{answer}
			</div>
			{alternativeAnswers.length > 0 && (
				<div className="alternative_answers">
					({alternativeAnswers.join('、')})
				</div>
			)}
		</AbsoluteFill>
	);
};

const AnswerImage: React.FC<{
	url: string;
	copyrightText: string;
}> = ({url, copyrightText}) => {
	const copyrightTextLines = copyrightText.split('\n');
	return (
		<AbsoluteFill className="answer_image">
			<div className="answer_image_image_area">
				<Img src={url} className="answer_image_image" />
			</div>
			<div className="answer_image_text_area">
				{copyrightTextLines.map((line, index) => (
					<>
						<span key={index}>{line}</span>
						{index < copyrightTextLines.length - 1 && <br />}
					</>
				))}
			</div>
		</AbsoluteFill>
	);
};

export const ItQuiz: React.FC<z.infer<typeof itQuizSchema>> = ({
	volumes,
	date,
	voiceId,
	quizIndex,
	difficulty,
	quizId,
	clauses,
	timepoints,
	answer,
	alternativeAnswers,
	questionSpeechFileName,
	answerSpeechFileName,
	voiceVolume = 2.5,
	questionVolume = 1.5,
	answerImage,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const timestamp = frame / fps - 1;

	const sortedTimepoints = timepoints.sort(
		(a, b) => extractMarkIndex(a.markName) - extractMarkIndex(b.markName),
	);

	const formattedQuizId = quizId.startsWith('N')
		? `${quizId.slice(1)}(時)`
		: quizId;

	const clauseInformation: ClauseInformation[] = [];
	let previousMarkIndex = -1;
	let offset = 0;

	for (const timepoint of sortedTimepoints) {
		const markIndex = extractMarkIndex(timepoint.markName);
		const timeSeconds = timepoint.timeSeconds ?? 0;
		const slicedClauses = clauses
			.slice(previousMarkIndex + 1, markIndex + 1)
			.map((clause) => clause.replaceAll(' ', '\xa0'));
		const clausesLength = sum(slicedClauses.map((clause) => clause.length));
		const duration = timeSeconds - offset;
		const clausesHiddenRatio = clamp(1 - (timestamp - offset) / duration, 0, 1);

		for (const [clauseIndex, clause] of slicedClauses.entries()) {
			const offset = sumBy(
				slicedClauses.slice(clauseIndex + 1),
				(clause) => clause.length,
			);

			const rawHiddenRatio =
				(clausesHiddenRatio - offset / clausesLength) /
				(clause.length / clausesLength);
			const hiddenRatio = clamp(rawHiddenRatio, 0, 1);

			clauseInformation.push({
				html: clause,
				duration: duration * (clause.length / clausesLength),
				hiddenRatio: `${hiddenRatio * 100}%`,
			});
		}

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
	const answerPreparationDuration = fps * 0.8;

	const quizStartFrame = quizPreparationDuration;
	const countdownStartFrame = quizStartFrame + quizReadingDuration;
	const countdownEndFrame = countdownStartFrame + countdownDuration;
	const answerReadingStartFrame = countdownEndFrame + answerPreparationDuration;

	const difficultyAnimationRatio = interpolate(
		frame,
		[quizStartFrame, quizStartFrame + fps * 0.8, countdownStartFrame],
		[0, 1, 1],
		{
			easing: Easing.out(Easing.exp),
		},
	);

	return (
		<AbsoluteFill>
			<AbsoluteFill>
				<Img src={staticFile('images/quiz.png')} />
				<AbsoluteFill className="quiz_volume quiz_volume_quiz">
					#{volumes} ({date})
				</AbsoluteFill>
			</AbsoluteFill>
			<Sequence
				durationInFrames={quizPreparationDuration}
				name="Quiz Preparation"
			>
				<Audio
					src={staticFile(`voices/${voiceId}/第${quizIndex}問.wav`)}
					volume={() => voiceVolume}
					useWebAudioApi
					crossOrigin="anonymous"
				/>
				<Audio src={staticFile('soundeffects/拍子木2.mp3')} volume={0.7} />
				<AbsoluteFill
					style={{
						transform: `translateX(-50%) scale(${quizTitleScale})`,
					}}
					className="quiz_title"
				>
					第{quizIndex}問
				</AbsoluteFill>
			</Sequence>
			<Sequence from={quizStartFrame} name="Quiz Text">
				<AbsoluteFill
					className={`quiz_difficulty difficulty_${difficulty}`}
					style={{
						// @ts-expect-error: Type doesn't support CSS variables
						'--animation-ratio': `${difficultyAnimationRatio * 100}%`,
					}}
				>
					{getDifficultyText(difficulty)}
				</AbsoluteFill>
				<AbsoluteFill className="quiz_id">No.{formattedQuizId}</AbsoluteFill>
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
			<Sequence
				from={quizStartFrame}
				durationInFrames={quizReadingDuration}
				name="Quiz Audio"
			>
				<Audio
					src={staticFile(`speeches/${questionSpeechFileName}`)}
					startFrom={0.1 * fps}
					volume={() => questionVolume}
					useWebAudioApi
					crossOrigin="anonymous"
				/>
			</Sequence>
			<Sequence
				from={countdownStartFrame}
				durationInFrames={countdownDuration}
				name="Countdown"
			>
				{range(0, 3).map((i) => (
					<Sequence key={i} from={i * fps * 0.8} durationInFrames={fps * 0.8}>
						<AbsoluteFill className="countdown">
							<CountDown second={3 - i} />
						</AbsoluteFill>
						<Audio src={staticFile('soundeffects/決定ボタンを押す52.mp3')} />
					</Sequence>
				))}
			</Sequence>
			<Sequence from={countdownEndFrame} name="Answer Preparation">
				<Audio
					src={staticFile(`voices/${voiceId}/正解は.wav`)}
					volume={() => voiceVolume}
					useWebAudioApi
					crossOrigin="anonymous"
				/>
				<Audio src={staticFile('soundeffects/決定ボタンを押す4.mp3')} />
				<AbsoluteFill className="answer_text_wrapper">
					<AnswerText answer={answer} alternativeAnswers={alternativeAnswers} />
				</AbsoluteFill>
				{answerImage && (
					<AnswerImage
						url={answerImage.url}
						copyrightText={answerImage.copyrightText}
					/>
				)}
			</Sequence>
			<Sequence from={answerReadingStartFrame} name="Answer Reading">
				<Audio
					src={staticFile(`speeches/${answerSpeechFileName}`)}
					volume={() => voiceVolume}
					useWebAudioApi
					crossOrigin="anonymous"
				/>
			</Sequence>
		</AbsoluteFill>
	);
};
