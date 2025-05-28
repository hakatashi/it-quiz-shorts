import {Audio, Sequence, staticFile} from 'remotion';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {ItQuiz} from './ItQuiz';
import {z} from 'zod';
import {sum} from 'lodash-es';

export const itQuizCompositionSchema = z.object({
	volumes: z.number().min(1),
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
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
> = ({volumes, date, quizzes}) => {
	const {fps} = useVideoConfig();

	const quizDurations = quizzes.map((quiz) => {
		const quizDuration = quiz.timepoints.reduce(
			(acc, timepoint) => Math.max(acc, timepoint.timeSeconds),
			0,
		);
		return Math.floor(quizDuration * fps) + fps * 6.5;
	});

	return (
		<AbsoluteFill style={{backgroundColor: 'white'}}>
			<Audio
				src={staticFile("musics/Santa's_Sleigh_Ride.mp3")}
				volume={0.2}
				startFrom={18 * fps}
			/>
			{quizzes.map((quiz, index) => (
				<Sequence
					key={index}
					name={`Quiz ${index + 1}`}
					from={sum(quizDurations.slice(0, index))}
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
					/>
				</Sequence>
			))}
		</AbsoluteFill>
	);
};
