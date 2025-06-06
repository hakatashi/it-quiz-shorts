import {Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {ItQuiz} from './ItQuiz';
import {z} from 'zod';
import {sum} from 'lodash-es';
import {Opening} from './Opening';
import {Ending} from './Ending';

const quizSchema = z.object({
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
	answerImage: z.union([
		z.object({
			url: z.string(),
			copyrightText: z.string(),
		}),
		z.null(),
	]),
});

export type Quiz = z.infer<typeof quizSchema>;

export const itQuizCompositionSchema = z.object({
	volumes: z.number().min(1),
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	voiceId: z.string().nonempty(),
	questionSpeechId: z.string().nonempty(),
	introQuestionImageUrl: z.string().nonempty(),
	introQuestion: z.string().nonempty(),
	introQuestionImageCopyrightText: z.string().nonempty(),
	introQuestionImageMask: z.union([
		z.null(),
		z.object({
			imageWidth: z.number(),
			imageHeight: z.number(),
			top: z.number(),
			left: z.number(),
			width: z.number(),
			height: z.number(),
		}),
	]),
	quizzes: z.array(quizSchema),
});

export const ItQuizComposition: React.FC<
	z.infer<typeof itQuizCompositionSchema>
> = ({
	volumes,
	date,
	quizzes,
	voiceId,
	questionSpeechId,
	introQuestionImageUrl,
	introQuestion,
	introQuestionImageCopyrightText,
	introQuestionImageMask,
}) => {
	const {fps} = useVideoConfig();
	const frame = useCurrentFrame();

	const quizDurations = quizzes.map((quiz) => {
		const quizDuration = quiz.timepoints.reduce(
			(acc, timepoint) => Math.max(acc, timepoint.timeSeconds),
			0,
		);
		return Math.floor(quizDuration * fps) + fps * 6.1;
	});

	return (
		<AbsoluteFill style={{backgroundColor: 'white'}}>
			<Audio
				src={staticFile("musics/Santa's_Sleigh_Ride.mp3")}
				volume={0.15}
				startFrom={19 * fps}
			/>
			{/* Fake image to preload the background image */}
			<Img
				src={staticFile('images/bg_pattern.jpg')}
				style={{opacity: 0, position: 'absolute', left: '-100%'}}
			/>
			<AbsoluteFill
				className="background"
				style={{
					// eslint-disable-next-line @remotion/no-background-image
					backgroundImage: `url(${staticFile('images/bg_pattern.jpg')})`,
					// @ts-expect-error: CSS variable not recognized by TypeScript
					'--background-offset': `${(frame / fps / 30) * 100}%`,
				}}
			/>
			<Sequence durationInFrames={3.5 * fps}>
				<Opening
					volumes={volumes}
					date={date}
					voiceId={voiceId}
					questionSpeechId={questionSpeechId}
					introQuestionImageUrl={introQuestionImageUrl}
					introQuestion={introQuestion}
					introQuestionImageCopyrightText={introQuestionImageCopyrightText}
					introQuestionImageMask={introQuestionImageMask}
				/>
			</Sequence>
			{quizzes.map((quiz, index) => (
				<Sequence
					key={index}
					name={`Quiz ${index + 1}`}
					from={sum(quizDurations.slice(0, index)) + 3.5 * fps}
					durationInFrames={quizDurations[index]}
				>
					<ItQuiz
						volumes={volumes}
						date={date}
						voiceId={voiceId}
						quizIndex={index + 1}
						difficulty={quiz.difficulty}
						quizId={quiz.quizId}
						clauses={quiz.clauses}
						timepoints={quiz.timepoints}
						answer={quiz.answer}
						alternativeAnswers={quiz.alternativeAnswers}
						questionSpeechFileName={quiz.questionSpeechFileName}
						answerSpeechFileName={quiz.answerSpeechFileName}
						voiceVolume={2.5}
						questionVolume={2}
						answerImage={quiz.answerImage}
					/>
				</Sequence>
			))}
			<Sequence from={sum(quizDurations) + 3.5 * fps}>
				<Ending voiceId={voiceId} />
			</Sequence>
		</AbsoluteFill>
	);
};
