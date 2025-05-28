import {Audio, Img, spring, staticFile, useCurrentFrame} from 'remotion';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {z} from 'zod';

export const endingSchema = z.object({});

export const Ending: React.FC<z.infer<typeof endingSchema>> = () => {
	const {fps} = useVideoConfig();
	const frame = useCurrentFrame();

	const textScale = spring({
		frame,
		fps,
		durationInFrames: 10,
	});

	return (
		<AbsoluteFill>
			<Audio
				src={staticFile('soundeffects/決定ボタンを押す1.mp3')}
				volume={0.7}
			/>
			<Img src={staticFile('images/opening1.png')} />
			<Audio
				src={staticFile(
					'voices/tsumugi/あなたは何問わかった コメント欄で教えてね.wav',
				)}
				volume={2.5}
				useWebAudioApi
				crossOrigin="anonymous"
			/>
			<Img
				src={staticFile('images/あなたは何問解けた@2x.png')}
				className="ending_text"
				style={{
					transform: `translateX(-50%) scale(calc(${textScale} / 2))`,
				}}
			/>
			<AbsoluteFill className="ending_information">
				問題不備・誤植・誤字などの連絡は
				<br />
				コメント欄か x.com/hakatashi まで!
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
