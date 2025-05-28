import {Audio, Sequence, spring, staticFile} from 'remotion';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import { ItQuiz } from './ItQuiz';
import {z} from 'zod';

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

export const ItQuizComposition: React.FC<z.infer<typeof itQuizCompositionSchema>> = ({
	volumes,
	date,
	quizzes,
}) => {
	const {fps} = useVideoConfig();

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
					from={16 * fps * index}
					durationInFrames={16 * fps}
				>
					<ItQuiz
						volumes={volumes}
						date={date}
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
