import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import {Ending} from './Ending';

describe('Ending Component', () => {
	const defaultProps = {
		voiceId: 'test-voice-id',
	};

	it('renders without crashing', () => {
		render(<Ending {...defaultProps} />);
		expect(screen.getByTestId('absolute-fill-1')).toBeInTheDocument();
	});

	it('renders the background image', () => {
		render(<Ending {...defaultProps} />);
		const backgroundImage = screen.getByTestId('img-1');
		expect(backgroundImage).toBeInTheDocument();
		expect(backgroundImage).toHaveAttribute(
			'src',
			'/static/images/opening1.png',
		);
	});
});
