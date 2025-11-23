const GAME_FINAL_STAT_EVENT_TABLE = {
  '1': '{nick}被人举报罚了{counter}张牌',
  '2': '{nick}一共被人加抽了{counter}张牌',
  '3': '{nick}偷偷摸摸抽了{counter}张黑+4',
  '4': '{nick}一共打了{counter}张+4',
  '5': '热心群众{nick}举报了他人{counter}次',
  '6': '{nick}总是忘记喊UNO，被人举报了{counter}次',
  '7': '{nick}一共拿到了{counter}次UNO',
  '8': '{nick}阻止了其他人{counter}次逃出生天的机会',
  '9': '{nick}有{counter}次吃下了从自己开始的罚牌',
  '10': '{nick}在一次罚牌中吃到了{counter}张牌'
}

const PRESERVED_EVENTS = 20 // 保留的事件数

const DEAL_CARD_REASON_NORMAL = 0 // 正常发牌
const DEAL_CARD_REASON_DRAW = 1 // 罚牌
const DEAL_CARD_REASON_BAD_UNO = 2 // 乱喊UNO
const DEAL_CARD_REASON_REPORT = 3 // 没喊UNO被举报
const DEAL_CARD_REASON_LAST_CARD = 4 // 以功能牌结束需要加罚

const PLAYER_LEFT_REASON_NORMAL = 0 // 玩家正常退出
const PLAYER_LEFT_REASON_OFFLINE_KICK = 1 // 断线被踢出
const PLAYER_LEFT_REASON_KICKED_BY_OWNER = 2 // 被房主踢出

const EVENT_GAME_START = 1 // 游戏开始
const EVENT_GAME_OVER = 2 // 游戏结束
const EVENT_PLAYER_JOIN = 3 // 玩家加入
const EVENT_PLAYER_LEFT = 4 // 玩家离开\
const EVENT_UPDATE_SEATS = 5 // 重排座位
const EVENT_USE_VOICE = 6 // 使用音效

const EVENT_FIRST_CARD = 100 // 起始牌
const EVENT_PLAY_CARD = 101 // 打出了一张牌
const EVENT_DEAL_CARD = 102 // 发了一张牌

function pushGameStartEvent (events, dealerPlayer) {
  if (events.length >= PRESERVED_EVENTS) {
    events.splice(0, 1)
  }
  events.push({
    event: EVENT_GAME_START,
    dealerNick: dealerPlayer.nick
  })
}

function pushGameOverEvent (events, winnerPlayer) {
  if (events.length >= PRESERVED_EVENTS) {
    events.splice(0, 1)
  }
  events.push({
    event: EVENT_GAME_OVER,
    winnerNick: winnerPlayer.nick
  })
}

function pushFirstCardEvent (events, c) {
  if (events.length >= PRESERVED_EVENTS) {
    events.splice(0, 1)
  }
  events.push({
    event: EVENT_FIRST_CARD,
    card: c
  })
}

function pushCardPlayEvent (events, player, c, withUno, ahead) {
  if (events.length >= PRESERVED_EVENTS) {
    events.splice(0, 1)
  }
  events.push({
    event: EVENT_PLAY_CARD,
    nick: player.nick,
    card: c,
    withUno: withUno,
    ahead: ahead
  })
}

function pushCardDealEvent (events, player, dealCount, reason, reportBy) {
  if (events.length >= PRESERVED_EVENTS) {
    events.splice(0, 1)
  }
  events.push({
    event: EVENT_DEAL_CARD,
    random: Math.random(),
    nick: player.nick,
    dealCount: dealCount,
    reason: reason,
    reportByNick: reportBy ? reportBy.nick : ''
  })
}

function pushPlayerJoinEvent (events, player) {
  if (events.length >= PRESERVED_EVENTS) {
    events.splice(0, 1)
  }
  events.push({
    event: EVENT_PLAYER_JOIN,
    nick: player.nick
  })
}

function pushPlayerLeftEvent (events, player, reason) {
  if (events.length >= PRESERVED_EVENTS) {
    events.splice(0, 1)
  }
  events.push({
    event: EVENT_PLAYER_LEFT,
    nick: player.nick,
    reason: reason
  })
}

function pushUpdateSeatsEvent (events) {
  if (events.length >= PRESERVED_EVENTS) {
    events.splice(0, 1)
  }
  events.push({
    event: EVENT_UPDATE_SEATS
  })
}

function pushUseVoiceEvent (events, player, voice) {
  if (events.length >= PRESERVED_EVENTS) {
    events.splice(0, 1)
  }
  events.push({
    event: EVENT_USE_VOICE,
    nick: player.nick,
    desc: voice.desc
  })
}

export default {
  GAME_FINAL_STAT_EVENT_TABLE,

  DEAL_CARD_REASON_NORMAL,
  DEAL_CARD_REASON_DRAW,
  DEAL_CARD_REASON_BAD_UNO,
  DEAL_CARD_REASON_REPORT,
  DEAL_CARD_REASON_LAST_CARD,

  PLAYER_LEFT_REASON_NORMAL,
  PLAYER_LEFT_REASON_OFFLINE_KICK,
  PLAYER_LEFT_REASON_KICKED_BY_OWNER,

  EVENT_GAME_START,
  EVENT_GAME_OVER,
  EVENT_PLAYER_JOIN,
  EVENT_PLAYER_LEFT,
  EVENT_UPDATE_SEATS,
  EVENT_USE_VOICE,

  EVENT_FIRST_CARD,
  EVENT_PLAY_CARD,
  EVENT_DEAL_CARD,

  pushGameStartEvent,
  pushGameOverEvent,
  pushFirstCardEvent,
  pushCardPlayEvent,
  pushCardDealEvent,
  pushPlayerJoinEvent,
  pushPlayerLeftEvent,
  pushUpdateSeatsEvent,
  pushUseVoiceEvent
}
