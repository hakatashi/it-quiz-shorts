import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import {Opening} from './Opening';

describe('<Opening />', () => {
	const defaultProps = {
		volumes: 5,
		date: '2024-01-01',
		voiceId: 'tsumugi',
		questionSpeechId: 'test-speech-id',
		introQuestionImageUrl: 'https://example.com/test-image.jpg',
		introQuestion: 'Test intro question',
		introQuestionImageCopyrightText: 'Test copyright',
		introQuestionImageMask: null,
	};

	it('renders without crashing', () => {
		render(<Opening {...defaultProps} />);
		expect(screen.getByTestId('absolute-fill-1')).toBeInTheDocument();
	});

	it('renders the background image', () => {
		render(<Opening {...defaultProps} />);
		const backgroundImage = screen.getByTestId('img-1');
		expect(backgroundImage).toBeInTheDocument();
		expect(backgroundImage).toHaveAttribute(
			'src',
			'/static/images/opening1.png',
		);
	});

	it('renders the IT quiz logo', () => {
		render(<Opening {...defaultProps} />);
		const logoImage = screen.getByTestId('img-title1');
		expect(logoImage).toBeInTheDocument();
		expect(logoImage).toHaveAttribute(
			'src',
			'/static/images/ITクイズ@2x.png',
		);
	});

	it('renders the voice presenter name', () => {
		render(<Opening {...defaultProps} />);
		const voiceName = screen.getByText((content) => {
			return content.includes('春日部つむぎ');
		});
		expect(voiceName).toBeInTheDocument();
	});
});
