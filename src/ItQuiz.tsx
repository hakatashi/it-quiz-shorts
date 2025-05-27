import { loadFont } from "@remotion/fonts";
import { Audio, spring, staticFile } from "remotion";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";

loadFont({
  family: "Noto Sans Japanese",
  url: staticFile("fonts/NotoSansJP-Bold.ttf"),
  weight: "600",
}).then(() => console.log("Font loaded!"));

export const itQuizSchema = z.object({
  clauses: z.array(z.string()),
  timepoints: z.array(z.object({
    timeSeconds: z.number(),
    markName: z.string(),
  })),
});

const extractMarkIndex = (markName: string | null | undefined) =>
	markName === null || markName === undefined
		? Number.NaN
		: Number.parseInt(markName.match(/c(\d+)/)?.[1] ?? '');

interface ClauseInformation {
	html: string;
	duration: number;
	hiddenRatio: number;
}

export const ItQuiz: React.FC<z.infer<typeof itQuizSchema>> = ({
  clauses,
  timepoints,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const timestamp = frame / fps;

	const sortedTimepoints = 
		timepoints.sort(
			(a, b) => extractMarkIndex(a.markName) - extractMarkIndex(b.markName),
		);

  const clauseInformation: ClauseInformation[] = [];
  let previousMarkIndex = -1;
  let offset = 0;

  for (const timepoint of sortedTimepoints) {
    const markIndex = extractMarkIndex(timepoint.markName);
    const timeSeconds = timepoint.timeSeconds ?? 0;
    const clause = clauses
      .slice(previousMarkIndex + 1, markIndex + 1)
      .join('')
      .replaceAll(' ', '\xa0');

    const duration = timeSeconds - offset;
    let hiddenRatio = 1;
    if (timestamp > timeSeconds) {
      hiddenRatio = 0;
    } else if (timestamp < offset) {
      hiddenRatio = 1;
    } else {
      hiddenRatio = 1 - (timestamp - offset) / duration;
    }

    clauseInformation.push({
      html: clause,
      duration,
      hiddenRatio,
    });

    offset = timeSeconds;
    previousMarkIndex = markIndex;
  }

  // A <AbsoluteFill> is just a absolutely positioned <div>!
  return (
    <AbsoluteFill style={{ backgroundColor: "white" }}>
      <Audio src={staticFile('musics/Santa\'s_Sleigh_Ride.mp3')} volume={0.2} startFrom={18 * fps}/>
      <Audio src={staticFile('speeches/test.mp3')} volume={2} />
      <AbsoluteFill
        style={{
          fontFamily: "Noto Sans Japanese",
          fontSize: 72,
          color: "#222",
          display: "block",
        }}
        className="quiz"
      >
        {clauseInformation.map((clause, index) => (
          <span
            key={index}
            style={{
              display: 'inline-block',
              // @ts-expect-error: Type doesn't support CSS variables
              '--hidden-ratio': clause.hiddenRatio,
            }}
            className="quiz_clause"
            dangerouslySetInnerHTML={{ __html: clause.html }}
          />
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
