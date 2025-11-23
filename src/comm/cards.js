import assert from 'assert'

/**
 * 卡片定义
 *   低3位表示颜色
 *     0  - 万能
 *     1  - 红色
 *     2  - 黄色
 *     3  - 蓝色
 *     4  - 绿色
 *   低4~7位表示功能
 *     0  - 无功能，仅用于表示纯某种花色的牌
 *     1  - 0
 *     2  - 1
 *     3  - 2
 *     4  - 3
 *     5  - 4
 *     6  - 5
 *     7  - 6
 *     8  - 7
 *     9  - 8
 *     10 - 9
 *     11 - 跳过
 *     12 - 反向
 *     13 - +2
 *     14 - +4
 */

const COLOR_ALL = 0
const COLOR_RED = 1
const COLOR_YELLOW = 2
const COLOR_BLUE = 3
const COLOR_GREEN = 4

const FUNC_NONE = 0
const FUNC_0 = 1
const FUNC_1 = 2
const FUNC_2 = 3
const FUNC_3 = 4
const FUNC_4 = 5
const FUNC_5 = 6
const FUNC_6 = 7
const FUNC_7 = 8
const FUNC_8 = 9
const FUNC_9 = 10
const FUNC_SKIP = 11
const FUNC_REVERS = 12
const FUNC_DRAW2 = 13
const FUNC_DRAW4 = 14
const FUNC_CHGCOLOR = 15

const COLOR_NAMES = {
  [COLOR_ALL]: '全色',
  [COLOR_RED]: '红',
  [COLOR_YELLOW]: '黄',
  [COLOR_BLUE]: '蓝',
  [COLOR_GREEN]: '绿'
}

const FUNC_NAMES = {
  [FUNC_NONE]: '纯色',
  [FUNC_0]: '0',
  [FUNC_1]: '1',
  [FUNC_2]: '2',
  [FUNC_3]: '3',
  [FUNC_4]: '4',
  [FUNC_5]: '5',
  [FUNC_6]: '6',
  [FUNC_7]: '7',
  [FUNC_8]: '8',
  [FUNC_9]: '9',
  [FUNC_SKIP]: '禁',
  [FUNC_REVERS]: '反向',
  [FUNC_DRAW2]: '+2',
  [FUNC_DRAW4]: '+4',
  [FUNC_CHGCOLOR]: '换色'
}

function getColor (c) {
  let ret = c & 7
  assert(isValidColor(ret))
  return ret
}

function getFunc (c) {
  let ret = (c >> 3) & 15
  assert(isValidFunc(ret))
  return ret
}

function composeCard (c, f) {
  assert(isValidColor(c))
  assert(isValidFunc(f))
  return (c & 7) | ((f & 15) << 3)
}

function decomposeCard (c) {
  let color = getColor(c)
  let func = getFunc(c)
  return { color: color, func: func }
}

function isValidColor (c) {
  return c >= COLOR_ALL && c <= COLOR_GREEN
}

function isValidFunc (f) {
  return f >= FUNC_NONE && f <= FUNC_CHGCOLOR
}

function isValidCard (c) {
  let color = c & 7
  if (!isValidColor(color)) {
    return false
  }
  let func = (c >> 3) & 15
  return isValidFunc(func)
}

export default {
  COLOR_ALL,
  COLOR_RED,
  COLOR_YELLOW,
  COLOR_BLUE,
  COLOR_GREEN,

  FUNC_NONE,
  FUNC_0,
  FUNC_1,
  FUNC_2,
  FUNC_3,
  FUNC_4,
  FUNC_5,
  FUNC_6,
  FUNC_7,
  FUNC_8,
  FUNC_9,
  FUNC_SKIP,
  FUNC_REVERS,
  FUNC_DRAW2,
  FUNC_DRAW4,
  FUNC_CHGCOLOR,

  COLOR_NAMES,
  FUNC_NAMES,

  getColor,
  getFunc,
  composeCard,
  decomposeCard,
  isValidColor,
  isValidFunc,
  isValidCard
}
