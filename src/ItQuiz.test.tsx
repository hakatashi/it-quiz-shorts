import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import {ItQuiz} from './ItQuiz';

describe('<ItQuiz />', () => {
	const defaultProps = {
		volumes: 5,
		date: '2024-01-01',
		voiceId: 'tsumugi',
		quizIndex: 1,
		clauses: ['This is a test question'],
		difficulty: 3,
		quizId: 1,
		questionSpeechFileName: 'test-question.wav',
		timepoints: [
			{
				timeSeconds: 1.0,
				markName: 'c1',
			},
		],
		answer: 'Test Answer',
		alternativeAnswers: ['Alternative Answer'],
		answerSpeechFileName: 'test-answer.wav',
		voiceVolume: 1.0,
		questionVolume: 1.0,
		answerImage: null,
	};

	it('renders without crashing', () => {
		render(<ItQuiz {...defaultProps} />);
		expect(screen.getByTestId('absolute-fill-1')).toBeInTheDocument();
	});

	it('renders the background image', () => {
		render(<ItQuiz {...defaultProps} />);
		const backgroundImage = screen.getByTestId('img-1');
		expect(backgroundImage).toBeInTheDocument();
		expect(backgroundImage).toHaveAttribute('src', '/static/images/quiz.png');
	});

	it('renders quiz content with correct quiz number', () => {
		render(<ItQuiz {...defaultProps} />);
		const quizNumber = screen.getByText('第1問');
		expect(quizNumber).toBeInTheDocument();
	});

	it('renders difficulty text', () => {
		render(<ItQuiz {...defaultProps} />);
		const difficultyText = screen.getByText('難易度★★★☆☆ (難しい)');
		expect(difficultyText).toBeInTheDocument();
	});
});
