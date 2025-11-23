<template>
  <div class="history-list" ref="list">
    <div v-for="(e, idx) in events" :key="idx" v-html="generateText(e)"></div>
  </div>
</template>

<script>
import cards from '../comm/cards'
import events from '../comm/events'

const SPECIAL_TEXT_UNO = 0
const SPECIAL_TEXT_AHEAD = 1
const SPECIAL_TEXT_DRAW = 2
const SPECIAL_TEXT_PUNISH = 3

function randomSelect (arr, random) {
  return arr[Math.floor(random * arr.length)]
}

export default {
  name: 'HistoryEventList',
  props: {
    events: Array
  },
  data () {
    return {}
  },
  methods: {
    generateCardText (c) {
      let color = cards.getColor(c)
      let func = cards.getFunc(c)
      let style = ''
      if (color === cards.COLOR_RED) {
        style = 'red'
      } else if (color === cards.COLOR_YELLOW) {
        style = 'yellow'
      } else if (color === cards.COLOR_BLUE) {
        style = 'blue'
      } else if (color === cards.COLOR_GREEN) {
        style = 'green'
      }
      return `<span class="label-card ${style}">${cards.COLOR_NAMES[color]}${cards.FUNC_NAMES[func]}</span>`
    },
    generatePlayerText (n) {
      return `<span class="label-player">${n}</span>`
    },
    generateNumberText (n) {
      return `<span class="label-number">${n}</span>`
    },
    generateSpecialText (n) {
      if (n === SPECIAL_TEXT_UNO) {
        return `<span class="label-uno">UNO</span>`
      } else if (n === SPECIAL_TEXT_AHEAD) {
        return `<span class="label-ahead">抢</span>`
      } else if (n === SPECIAL_TEXT_DRAW) {
        return `<span class="label-draw">续</span>`
      } else if (n === SPECIAL_TEXT_PUNISH) {
        return `<span class="label-punish">罚</span>`
      } else {
        return ''
      }
    },
    generateText (evt) {
      let e = evt.event
      if (e === events.EVENT_GAME_START) {
        return `游戏开始，本次由${this.generatePlayerText(evt.dealerNick)}坐庄`
      } else if (e === events.EVENT_GAME_OVER) {
        return `游戏结束，本轮赢家${this.generatePlayerText(evt.winnerNick)}`
      } else if (e === events.EVENT_PLAYER_JOIN) {
        return `${this.generatePlayerText(evt.nick)}加入了游戏`
      } else if (e === events.EVENT_PLAYER_LEFT) {
        if (evt.reason === events.PLAYER_LEFT_REASON_OFFLINE_KICK) {
          return `由于长时间掉线，${this.generatePlayerText(evt.nick)}被踢出了房间`
        } else if (evt.reason === events.PLAYER_LEFT_REASON_KICKED_BY_OWNER) {
          return `${this.generatePlayerText(evt.nick)}被房主请出了房间`
        } else {
          return `${this.generatePlayerText(evt.nick)}离开了游戏`
        }
      } else if (e === events.EVENT_FIRST_CARD) {
        return `初始牌已发放完毕，起始牌为${this.generateCardText(evt.card)}`
      } else if (e === events.EVENT_PLAY_CARD) {
        if (evt.ahead) {
          if (evt.withUno) {
            return `${this.generatePlayerText(evt.nick)}${this.generateSpecialText(SPECIAL_TEXT_AHEAD)}了${this.generateNumberText(1)}张${this.generateCardText(evt.card)}并发出了${this.generateSpecialText(SPECIAL_TEXT_UNO)}的声音`
          } else {
            return `${this.generatePlayerText(evt.nick)}抢了${this.generateNumberText(1)}张${this.generateCardText(evt.card)}`
          }
        } else {
          if (evt.withUno) {
            return `${this.generatePlayerText(evt.nick)}打出了${this.generateNumberText(1)}张${this.generateCardText(evt.card)}并发出了${this.generateSpecialText(SPECIAL_TEXT_UNO)}的声音`
          } else {
            return `${this.generatePlayerText(evt.nick)}打出了${this.generateNumberText(1)}张${this.generateCardText(evt.card)}`
          }
        }
      } else if (e === events.EVENT_DEAL_CARD) {
        if (evt.reason === events.DEAL_CARD_REASON_NORMAL) {
          return `${this.generatePlayerText(evt.nick)}抽取了${this.generateNumberText(evt.dealCount)}张牌`
        } else if (evt.reason === events.DEAL_CARD_REASON_DRAW) {
          let words = [ '', '，再接再厉', '，小心驶得万年船' ]
          let words2 = [ '，有点厉害哦', '，我滴个龟龟', '，有望挑战世界纪录', '，他是怎么做到的？' ]
          let w
          if (evt.dealCount < 10) {
            w = randomSelect(words, evt.random)
          } else {
            w = randomSelect(words2, evt.random)
          }
          return `${this.generatePlayerText(evt.nick)}被${this.generateSpecialText(SPECIAL_TEXT_DRAW)}了${this.generateNumberText(evt.dealCount)}张牌${w}`
        } else if (evt.reason === events.DEAL_CARD_REASON_BAD_UNO) {
          return `由于${this.generatePlayerText(evt.nick)}随便发出${this.generateSpecialText(SPECIAL_TEXT_UNO)}的声音，被系统${this.generateSpecialText(SPECIAL_TEXT_PUNISH)}了${this.generateNumberText(evt.dealCount)}张牌`
        } else if (evt.reason === events.DEAL_CARD_REASON_REPORT) {
          return `由于朝阳群众${this.generatePlayerText(evt.reportByNick)}的举报，${this.generatePlayerText(evt.nick)}被系统${this.generateSpecialText(SPECIAL_TEXT_PUNISH)}了${this.generateNumberText(evt.dealCount)}张牌`
        } else if (evt.reason === events.DEAL_CARD_REASON_LAST_CARD) {
          return `由于${this.generatePlayerText(evt.nick)}打出了最后一张功能牌，被系统追加了${this.generateNumberText(evt.dealCount)}张牌`
        }
      } else if (e === events.EVENT_UPDATE_SEATS) {
        return `房主重排了座位`
      } else if (e === events.EVENT_USE_VOICE) {
        return `${this.generatePlayerText(evt.nick)}发出了一句问候“${evt.desc}”`
      }
      return ''
    }
  },
  updated () {
    let elem = this.$refs.list
    elem.scrollTop = elem.scrollHeight
  }
}
</script>

<style>
  .history-list {
    background-color: rgba(0, 0, 0, 0.1);
    overflow-x: hidden;
    overflow-y: auto;
    white-space: normal;
    font-size: 2vmin;
    color: #2c3e50;
  }
  .history-list .label-card {
    margin-left: 1px;
    margin-right: 1px;
    font-weight: bold;
  }
  .history-list .label-card.red {
    color: #f44336;
  }
  .history-list .label-card.yellow {
    color: #ffc107;
  }
  .history-list .label-card.blue {
    color: #03a9f4;
  }
  .history-list .label-card.green {
    color: #4caf50;
  }
  .history-list .label-player {
    margin-left: 1px;
    margin-right: 1px;
    font-weight: bolder;
    color: #efefef;
  }
  .history-list .label-number {
    margin-left: 1px;
    margin-right: 1px;
    color: #FFDC00;
  }
  .history-list .label-uno {
    color: #f44336;
    font-weight: bolder;
  }
  .history-list .label-ahead {
    color: #f1c40f;
    font-weight: bolder;
  }
  .history-list .label-draw {
    color: #01FF70;
    font-weight: bolder;
  }
  .history-list .label-punish {
    color: #d35400;
    font-weight: bolder;
  }

  ::-webkit-scrollbar
  {
    width: 16px;
    height: 16px;
    background-color: transparent;
  }

  ::-webkit-scrollbar-track
  {
    /* box-shadow: inset 0 0 6px rgba(0,0,0,0.3);
    border-radius: 10px; */
    background-color: transparent;
  }

  ::-webkit-scrollbar-thumb
  {
    border-radius: 10px;
    box-shadow: inset 0 0 6px rgba(0,0,0,.3);
    background-color: #555;
  }
</style>
