import {
	Audio,
	Img,
	Sequence,
	spring,
	staticFile,
	useCurrentFrame,
} from 'remotion';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {z} from 'zod';

const getVoiceName = (voiceId: string) => {
	switch (voiceId) {
		case 'tsumugi':
			return '春日部つむぎ';
		case 'metan':
			return '四国めたん';
		case 'zundamon':
			return 'ずんだもん';
		default:
			throw new Error(`Unknown voiceId: ${voiceId}`);
	}
};

export const openingSchema = z.object({
	volumes: z.number().min(1),
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	voiceId: z.string().nonempty(),
	questionSpeechId: z.string().nonempty(),
	introQuestionImageUrl: z.string().nonempty(),
	introQuestion: z.string().nonempty(),
	introQuestionImageCopyrightText: z.string(),
	introQuestionImageMask: z.union([
		z.null(),
		z.object({
			imageWidth: z.number(),
			imageHeight: z.number(),
			top: z.number(),
			left: z.number(),
			width: z.number(),
			height: z.number(),
		}),
	]),
});

export const Opening: React.FC<z.infer<typeof openingSchema>> = ({
	volumes,
	date,
	voiceId,
	questionSpeechId,
	introQuestionImageUrl,
	introQuestion,
	introQuestionImageCopyrightText,
	introQuestionImageMask,
}) => {
	const {fps} = useVideoConfig();
	const frame = useCurrentFrame();

	const titleScale = spring({
		frame,
		fps,
		durationInFrames: 20,
	});

	const titleDuration = Math.floor(fps * 1.3);
	const introQuestionImageCopyrightTextLines =
		introQuestionImageCopyrightText.split('\n');

	const introQuestionImageMaskStyles: React.CSSProperties = {};
	if (introQuestionImageMask !== null) {
		const padding = 20;
		const zoom = Math.min(
			830 / introQuestionImageMask.imageWidth,
			610 / introQuestionImageMask.imageHeight,
		);
		const offsetX =
			(830 - introQuestionImageMask.imageWidth * zoom) / 2 + padding;
		const offsetY =
			(610 - introQuestionImageMask.imageHeight * zoom) / 2 + padding;
		introQuestionImageMaskStyles.top = `${introQuestionImageMask.top * zoom + offsetY}px`;
		introQuestionImageMaskStyles.left = `${introQuestionImageMask.left * zoom + offsetX}px`;
		introQuestionImageMaskStyles.width = `${introQuestionImageMask.width * zoom}px`;
		introQuestionImageMaskStyles.height = `${introQuestionImageMask.height * zoom}px`;
		introQuestionImageMaskStyles.fontSize = `${
			Math.min(introQuestionImageMask.width, introQuestionImageMask.height) *
			zoom *
			0.6
		}px`;
	}

	return (
		<AbsoluteFill>
			<Audio src={staticFile('soundeffects/和太鼓でドドン.mp3')} volume={0.7} />
			<Img src={staticFile('images/opening1.png')} />
			<Sequence durationInFrames={titleDuration}>
				<Audio
					src={staticFile(`voices/${voiceId}/ITクイズ5問.wav`)}
					volume={2.5}
					useWebAudioApi
					crossOrigin="anonymous"
				/>
				<Img
					src={staticFile('images/ITクイズ@2x.png')}
					className="title1"
					style={{
						transform: `translateX(-50%) scale(calc(${titleScale} / 2))`,
					}}
				/>
				<Img
					src={staticFile('images/5問@2x.png')}
					className="title2"
					style={{
						transform: `translateX(-50%) scale(calc(${titleScale} / 2))`,
					}}
				/>
				<AbsoluteFill className="quiz_volume quiz_volume_title">
					#{volumes} ({date})
				</AbsoluteFill>
				<AbsoluteFill className="title_information">
					問題作成: 博多市 (@hakatashi)
					<br />
					声: {getVoiceName(voiceId)} (VOICEVOX)
					<br />
					問読み: {questionSpeechId} (Google Cloud TTS)
				</AbsoluteFill>
			</Sequence>
			<Sequence from={titleDuration}>
				<Audio
					src={staticFile('soundeffects/決定ボタンを押す1.mp3')}
					volume={0.7}
				/>
				<Img
					src={staticFile('images/全部わかったら@2x.png')}
					className="intro1"
				/>
				<Img src={staticFile('images/ITマスター@2x.png')} className="intro2" />
				<AbsoluteFill className="intro_question_copyright_text">
					{introQuestionImageCopyrightTextLines.map((line, index) => (
						<>
							{line}
							{index < introQuestionImageCopyrightTextLines.length - 1 && (
								<br />
							)}
						</>
					))}
				</AbsoluteFill>
				<AbsoluteFill className="intro_question">
					<div className="intro_question_image_area">
						<Img src={introQuestionImageUrl} className="intro_question_image" />
						{introQuestionImageMask !== null && (
							<div
								className="intro_question_image_mask"
								style={introQuestionImageMaskStyles}
							>
								？
							</div>
						)}
					</div>
					<div className="intro_question_text_area">{introQuestion}</div>
				</AbsoluteFill>
				<Audio
					src={staticFile(
						`voices/${voiceId}/全部解けたらあなたもITマスター.wav`,
					)}
					volume={2.5}
					useWebAudioApi
					crossOrigin="anonymous"
				/>
			</Sequence>
		</AbsoluteFill>
	);
};
