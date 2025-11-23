import { Howl } from 'howler'
import cards from './cards'

// 声音定义：ID，内部名称，开始位置（毫秒），持续，组名称，描述
const SOUND_DEFS = [
  // 谷歌娘语音
  [ -1, 'g0', 0, 1000, '@谷歌娘', '0' ],
  [ -2, 'g1', 1000, 1000, '@谷歌娘', '1' ],
  [ -3, 'g2', 2000, 1000, '@谷歌娘', '2' ],
  [ -4, 'g3', 3000, 1000, '@谷歌娘', '3' ],
  [ -5, 'g4', 4000, 1000, '@谷歌娘', '4' ],
  [ -6, 'g5', 5000, 1000, '@谷歌娘', '5' ],
  [ -7, 'g6', 6000, 1000, '@谷歌娘', '6' ],
  [ -8, 'g7', 7000, 1000, '@谷歌娘', '7' ],
  [ -9, 'g8', 8000, 1000, '@谷歌娘', '8' ],
  [ -10, 'g9', 9000, 1000, '@谷歌娘', '9' ],
  [ -11, 'g_skip', 10000, 1000, '@谷歌娘', '禁' ],
  [ -12, 'g_reverse', 11000, 1000, '@谷歌娘', '转' ],
  [ -13, 'g_chg_color', 12000, 1000, '@谷歌娘', '换色' ],
  [ -14, 'g_draw2', 13000, 1000, '@谷歌娘', '加二' ],
  [ -15, 'g_draw4', 14000, 1000, '@谷歌娘', '加四' ],
  [ -16, 'g_report1', 15000, 1000, '@谷歌娘', '举报' ],
  [ -17, 'g_report2', 16000, 1000, '@谷歌娘', '别想逃' ],
  [ -18, 'g_uno', 17250, 1750, '@谷歌娘', 'uno' ],
  [ -19, 'g_start1', 19000, 2000, '@谷歌娘', '开始1' ],
  [ -20, 'g_start2', 21000, 2000, '@谷歌娘', '开始2' ],
  [ -21, 'g_start3', 23000, 2000, '@谷歌娘', '开始3' ],
  [ -22, 'g_win_me1', 25000, 3000, '@谷歌娘', '你赢了1' ],
  [ -23, 'g_win_me2', 28000, 3000, '@谷歌娘', '你赢了2' ],
  [ -24, 'g_win_other1', 31000, 3000, '@谷歌娘', '恭喜这位玩家' ],
  // 卢本伟
  [ 101, 'k_1', 56000, 2000, '五五开', '哎说句话好吗' ],
  [ 102, 'k_2', 58000, 2000, '五五开', '撒由那拉' ],
  [ 103, 'k_3', 60000, 1500, '五五开', '哎听得见我说话吗' ],
  [ 104, 'k_4', 62000, 2000, '五五开', '可以，不跟你多比比' ],
  [ 105, 'k_5', 64000, 1500, '五五开', '我没有开挂' ],
  [ 106, 'k_6', 66000, 1000, '五五开', '你好' ],
  [ 107, 'k_7', 67000, 1500, '五五开', '说话可以大声点吗' ],
  [ 108, 'k_8', 69000, 3500, '五五开', '牛逼啊这个人有操作的啊' ],
  [ 109, 'k_9', 73000, 1000, '五五开', '我很他妈强' ],
  // 其他
  [ 202, 'o_2', 75500, 1500, '其他', '想办法干他一炮' ],
  [ 203, 'o_3', 77000, 1000, '其他', '谢谢你啦' ],
  [ 204, 'o_4', 78000, 1000, '其他', '这就对了' ]
]

const SOUND_DEFS_TABLE = {}
const USER_VOICE_TABLE = {} // 展示表（展现给用户的数据）
let LOOKUP_TABLE = {} // 内部速查表（ID-Sprite）

for (let i = 0; i < SOUND_DEFS.length; ++i) {
  let e = SOUND_DEFS[i]

  SOUND_DEFS_TABLE[e[0]] = { name: e[1], group: e[4], desc: e[5] }
  LOOKUP_TABLE[e[0]] = e[1]

  if (e[0] < 0) { // 小于0作为内部使用
    continue
  }

  if (e[0] < 0) { // 隐藏晒你语音包
    continue
  }

  let group = USER_VOICE_TABLE[e[4]]
  if (!group) {
    group = []
    USER_VOICE_TABLE[e[4]] = group
  }

  group.push({ id: e[0], desc: e[5] })
}

// 声音对象
let soundSprite

function init () {
  // 创建SoundSprite
  if (!soundSprite) {
    // 生成Sprite列表
    let sprites = {}
    for (let i = 0; i < SOUND_DEFS.length; ++i) {
      let e = SOUND_DEFS[i]
      sprites[e[1]] = [e[2], e[3]]
    }

    // 基URL
    const baseUrl = process.env.BASE_URL

    soundSprite = new Howl({
      src: [ `${baseUrl}sounds/voices.mp3` ],
      sprite: sprites
    })
  }
}

function randomSelect (arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function playSoundByName (name) {
  if (!soundSprite || !name) {
    console.error('playSoundByName: bad args')
    return
  }
  soundSprite.play(name)
}

function playSoundById (id) {
  playSoundByName(LOOKUP_TABLE[id])
}

const CARD_FUNC_TO_SOUND = {
  [cards.FUNC_0]: 'g0',
  [cards.FUNC_1]: 'g1',
  [cards.FUNC_2]: 'g2',
  [cards.FUNC_3]: 'g3',
  [cards.FUNC_4]: 'g4',
  [cards.FUNC_5]: 'g5',
  [cards.FUNC_6]: 'g6',
  [cards.FUNC_7]: 'g7',
  [cards.FUNC_8]: 'g8',
  [cards.FUNC_9]: 'g9',
  [cards.FUNC_SKIP]: 'g_skip',
  [cards.FUNC_REVERS]: 'g_reverse',
  [cards.FUNC_DRAW2]: 'g_draw2',
  [cards.FUNC_DRAW4]: 'g_draw4',
  [cards.FUNC_CHGCOLOR]: 'g_chg_color'
}

function playCardSound (c, uno) {
  let func = cards.getFunc(c)
  let name = CARD_FUNC_TO_SOUND[func]
  if (name) {
    playSoundByName(name)
  }
  if (uno) {
    playSoundByName('g_uno')
  }
}

const EVENT_REPORT_SOUND = [ 'g_report1', 'g_report2' ]
const EVENT_START_SOUND = [ 'g_start1', 'g_start2', 'g_start3' ]
const EVENT_WIN_ME_SOUND = [ 'g_win_me1', 'g_win_me2' ]
const EVENT_WIN_OTHER_SOUND = [ 'g_win_other1' ]

function playReportSound () {
  playSoundByName(randomSelect(EVENT_REPORT_SOUND))
}

function playGameStartSound () {
  playSoundByName(randomSelect(EVENT_START_SOUND))
}

function playGameOverSound (meWin) {
  if (meWin) {
    playSoundByName(randomSelect(EVENT_WIN_ME_SOUND))
  } else {
    playSoundByName(randomSelect(EVENT_WIN_OTHER_SOUND))
  }
}

// Howler.volume(0.5);

export default {
  SOUND_DEFS_TABLE,
  USER_VOICE_TABLE,
  init,
  // 通用
  playSoundByName,
  playSoundById,
  // 系统声音
  playCardSound,
  playReportSound,
  playGameStartSound,
  playGameOverSound
}
