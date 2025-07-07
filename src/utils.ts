import type {Quiz} from './ItQuizComposition';

export const getQuizDuration = (quiz: Quiz) => {
	const quizDuration = quiz.timepoints.reduce(
		(acc, timepoint) => Math.max(acc, timepoint.timeSeconds),
		0,
	);
	const specialSecondsMap: Record<string, number> = {
		'748': 3,
		'3219': 2,
	};
	const specialSeconds = specialSecondsMap[quiz.quizId] || 0;
	return quizDuration + 6.1 + specialSeconds;
};

export const getVoiceVolume = (voiceId: string): number => {
	switch (voiceId) {
		case 'himari':
			return 4;
		default:
			return 2.5;
	}
};
