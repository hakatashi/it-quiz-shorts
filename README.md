# it-quiz-shorts

[![Tests][test-image]][test-url]
[![Rendering][rendering-image]][rendering-url]

[test-image]: https://github.com/hakatashi/it-quiz-shorts/actions/workflows/test.yml/badge.svg
[test-url]: https://github.com/hakatashi/it-quiz-shorts/actions/workflows/test.yml
[rendering-image]: https://img.shields.io/github/actions/workflow/status/hakatashi/it-quiz-shorts/test.yml?label=rendering
[rendering-url]: https://nightly.link/hakatashi/it-quiz-shorts/workflows/test/main/rendered-assets.zip

[![image](https://github.com/user-attachments/assets/b07683f2-9bcb-4e77-9c81-017b0da5d729)](https://www.youtube.com/channel/UCmGXjoj98-4jDsR3ebWMP7A)

[ITクイズチャンネル](https://lit.link/itquiz)で公開しているITクイズのショート動画を生成するためのコードです。

## 使い方

```sh
# 生成するビデオの情報を data/videos.yaml に追加
npx tsx bin/generatePlan.mts [number of videos]

# data/videos.yaml を適切に編集する
vi data/videos.yaml

# data/videos.yaml に記載されたビデオのうち生成されてないものを自動で out ディレクトリに生成
npx tsx bin/generateVideos.mts
```

## Licenses

* [Santa's Sleigh Ride](https://dova-s.jp/bgm/play21688.html) by [ISSEI AIR](https://dova-s.jp/_contents/author/profile321.html)
  * Licensed under [DOVA-SYNDROME 音源利用ライセンス](https://dova-s.jp/_contents/license/)
* [Noto Sans Japanese](https://fonts.google.com/noto/specimen/Noto+Sans+JP) by Adobe
  * Licensed under [SIL Open Font License, Version 1.1](https://fonts.google.com/noto/specimen/Noto+Sans+JP/license)
* [Noto Serif Japanese](https://fonts.google.com/noto/specimen/Noto+Serif+JP) by Adobe
  * Licensed under [SIL Open Font License, Version 1.1](https://fonts.google.com/noto/specimen/Noto+Serif+JP/license)
* [Monaspace](https://monaspace.githubnext.com/) by GitHub
  * Licensed under [SIL Open Font License, Version 1.1](https://github.com/githubnext/monaspace/blob/main/LICENSE)
* [M+ FONTS](https://mplusfonts.github.io/) by The M+ FONTS Project Authors
  * Licensed under [SIL Open Font License, Version 1.1](https://github.com/coz-m/MPLUS_FONTS/blob/master/OFL.txt)
* Sound effects from [効果音ラボ](https://soundeffect-lab.info/)
  * See [license](https://soundeffect-lab.info/faq/)
