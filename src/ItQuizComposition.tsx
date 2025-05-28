import {Audio, Sequence, staticFile} from 'remotion';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {ItQuiz} from './ItQuiz';
import {z} from 'zod';
import {sum} from 'lodash-es';
import {Opening} from './Opening';
import {Ending} from './Ending';

export const itQuizCompositionSchema = z.object({
	volumes: z.number().min(1),
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	voiceId: z.string().nonempty(),
	questionSpeechId: z.string().nonempty(),
	introQuestionImageUrl: z.string().nonempty(),
	introQuestion: z.string().nonempty(),
	introQuestionImageCopyrightText: z.string().nonempty(),
	quizzes: z.array(
		z.object({
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
		}),
	),
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
}) => {
	const {fps} = useVideoConfig();

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
			<Sequence durationInFrames={4 * fps}>
				<Opening
					volumes={volumes}
					date={date}
					voiceId={voiceId}
					questionSpeechId={questionSpeechId}
					introQuestionImageUrl={introQuestionImageUrl}
					introQuestion={introQuestion}
					introQuestionImageCopyrightText={introQuestionImageCopyrightText}
				/>
			</Sequence>
			{quizzes.map((quiz, index) => (
				<Sequence
					key={index}
					name={`Quiz ${index + 1}`}
					from={sum(quizDurations.slice(0, index)) + 4 * fps}
					durationInFrames={quizDurations[index]}
				>
					<ItQuiz
						volumes={volumes}
						date={date}
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
						questionVolume={1.5}
					/>
				</Sequence>
			))}
			<Sequence from={sum(quizDurations) + 4 * fps}>
				<Ending />
			</Sequence>
		</AbsoluteFill>
	);
};
