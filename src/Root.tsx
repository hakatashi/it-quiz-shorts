import './index.css';
import {Composition} from 'remotion';
import {ItQuiz, itQuizSchema} from './ItQuiz';

// Each <Composition> is an entry in the sidebar!

export const RemotionRoot: React.FC = () => {
	return (
		<>
			<Composition
				id="ItQuiz"
				component={ItQuiz}
				durationInFrames={30 * 20}
				fps={30}
				width={1080}
				height={1920}
				schema={itQuizSchema}
				defaultProps={{
					volumes: 1,
					date: '2025-05-28',
					difficulty: 4,
					quizId: 3541,
					clauses: [
						'2つの',
						'<ruby><rb>目玉</rb><rp>（</rp><rt>めだま</rt><rp>）</rp></ruby>が',
						'マウスポインタの',
						'動きを',
						'追いかけるという',
						'シンプル',
						'かつ',
						'ユーモラスな',
						'動作が',
						'特徴の',
						'、',
						'X',
						' ',
						'Window',
						' ',
						'Systemの',
						'デモアプリケーションは',
						'何でしょう',
						'？',
					],
					timepoints: [
						{timeSeconds: 0.4717082977294922, markName: 'c0'},
						{timeSeconds: 0.9032917022705078, markName: 'c1'},
						{timeSeconds: 1.7866665124893188, markName: 'c2'},
						{timeSeconds: 2.233541250228882, markName: 'c3'},
						{timeSeconds: 2.9400413036346436, markName: 'c4'},
						{timeSeconds: 3.3521244525909424, markName: 'c5'},
						{timeSeconds: 3.6071245670318604, markName: 'c6'},
						{timeSeconds: 4.235750198364258, markName: 'c7'},
						{timeSeconds: 4.622208595275879, markName: 'c8'},
						{timeSeconds: 5.2409162521362305, markName: 'c9'},
						{timeSeconds: 5.512332916259766, markName: 'c10'},
						{timeSeconds: 5.94849967956543, markName: 'c12'},
						{timeSeconds: 6.30983304977417, markName: 'c14'},
						{timeSeconds: 6.820750713348389, markName: 'c15'},
						{timeSeconds: 7.8650431632995605, markName: 'c16'},
						{timeSeconds: 8.490041732788086, markName: 'c17'},
						{timeSeconds: 9.066541666666666, markName: 'c18'},
					],
					answer: 'xeyes',
					alternativeAnswers: [
					],
				}}
			/>
		</>
	);
};
