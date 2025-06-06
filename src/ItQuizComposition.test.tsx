import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import {ItQuizComposition} from './ItQuizComposition';

describe('<ItQuizComposition />', () => {
	const defaultProps = {
		volumes: 5,
		date: '2024-01-01',
		voiceId: 'tsumugi',
		questionSpeechId: 'test-speech-id',
		introQuestionImageUrl: 'https://example.com/test-image.jpg',
		introQuestion: 'Test intro question',
		introQuestionImageCopyrightText: 'Test copyright',
		introQuestionImageMask: null,
		quizzes: [
			{
				clauses: ['Test question clause'],
				difficulty: 3,
				quizId: '1',
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
				answerImage: null,
			},
		],
	};

	it('renders without crashing', () => {
		render(<ItQuizComposition {...defaultProps} />);
		expect(screen.getByTestId('absolute-fill-1')).toBeInTheDocument();
	});

	it('renders the background music', () => {
		render(<ItQuizComposition {...defaultProps} />);
		const backgroundMusic = screen.getByTestId('audio-1');
		expect(backgroundMusic).toBeInTheDocument();
		expect(backgroundMusic).toHaveAttribute(
			'src',
			"/static/musics/Santa's_Sleigh_Ride.mp3",
		);
	});
});
