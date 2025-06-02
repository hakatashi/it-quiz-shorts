import '@testing-library/jest-dom';
import React from 'react';
import {vi, beforeEach} from 'vitest';

// Track element counts for unique test IDs
let absoluteFillCount = 0;
let audioCount = 0;
let imgCount = 0;
let sequenceCount = 0;

// Mock remotion modules for testing
vi.mock('remotion', () => ({
	AbsoluteFill: ({
		children,
		className,
		...props
	}: React.PropsWithChildren<
		{className?: string} & Record<string, unknown>
	>) => {
		const testId = className
			? `absolute-fill-${className}`
			: `absolute-fill-${++absoluteFillCount}`;
		return React.createElement(
			'div',
			{
				'data-testid': testId,
				className,
				...props,
			},
			children,
		);
	},
	Audio: ({src, ...props}: {src: string} & Record<string, unknown>) => {
		const testId = `audio-${++audioCount}`;
		return React.createElement('audio', {
			'data-testid': testId,
			src,
			...props,
		});
	},
	Img: ({
		src,
		className,
		...props
	}: {src: string; className?: string} & Record<string, unknown>) => {
		const testId = className ? `img-${className}` : `img-${++imgCount}`;
		return React.createElement('img', {
			'data-testid': testId,
			className,
			src,
			alt: '',
			...props,
		});
	},
	Sequence: ({
		children,
		durationInFrames,
		...props
	}: React.PropsWithChildren<
		{durationInFrames?: number} & Record<string, unknown>
	>) => {
		const testId = `sequence-${++sequenceCount}`;
		return React.createElement(
			'div',
			{
				'data-testid': testId,
				'data-duration': durationInFrames,
				...props,
			},
			children,
		);
	},
	staticFile: (path: string) => `/static/${path}`,
	useCurrentFrame: () => 30,
	useVideoConfig: () => ({
		fps: 30,
		durationInFrames: 300,
		width: 1080,
		height: 1920,
	}),
	spring: () => 1,
	interpolate: () => 1,
	Easing: {
		out: () => 1,
		in: () => 1,
		inOut: () => 1,
		bezier: () => () => 1,
	},
}));

// Mock @remotion/fonts
vi.mock('@remotion/fonts', () => ({
	loadFont: vi.fn(() => Promise.resolve()),
}));

// Reset counters before each test
beforeEach(() => {
	absoluteFillCount = 0;
	audioCount = 0;
	imgCount = 0;
	sequenceCount = 0;
});
