import type {Quiz} from './ItQuizComposition';

export const getQuizDuration = (quiz: Quiz) => {
	const quizDuration = quiz.timepoints.reduce(
		(acc, timepoint) => Math.max(acc, timepoint.timeSeconds),
		0,
	);
	let specialSeconds = 0;
	if (quiz.quizId === '3219') {
		specialSeconds = 2;
	}
	return quizDuration + 6.1 + specialSeconds;
};
