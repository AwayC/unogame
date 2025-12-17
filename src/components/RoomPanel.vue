<template>
  <div class="landscape-layout">
    <el-dialog title="游戏结束" :visible.sync="showGameOverWindow" width="60vmin" :center="true" :modal="true" :show-close="true" :close-on-click-modal="true" :close-on-press-escape="true">
      <div class="gameover-panel">
        <div class="winner-content">
          恭喜
          <img class="winner-avatar" :src="getGameOverAvatarImgUrl(gameOverWindowWinnerEmail)" />
          <span class="winner-nickname">{{ gameOverWindowWinnerNick }}</span>
          逃出生天！
        </div>
        <div class="winner-stealer-content" v-if="gameOverWindowWinnerStealerNick !== ''">
          本轮点炮：<span class="winner-stealer-nickname">{{ gameOverWindowWinnerStealerNick }}</span>
        </div>
        <div class="good-event-list">
          <div class="good-event-list-item" v-for="(e, idx) in gameOverWindowStats" :key="idx" v-html="genGameOverStat(e)">
          </div>
        </div>
      </div>
    </el-dialog>

    <div class="layout-top">
      <span class="top-icon el-icon-s-home" @click="onLeaveRoom"></span>
      <span class="top-title" v-if="room">{{ room.title }} ({{room.curr_players}}/{{room.max_players}})</span>
    </div>
    <div class="layout-content" ref="cardDesk">
      <div class="content-player-card" v-bind:class="{ thinking: isThinking(p.uid) }"
        v-bind:style="{ left: p.cardLeft + 'px', top: p.cardTop + 'px' }" v-for="(p, idx) in cardDeskPlayers" v-bind:key="idx">
        <div class="player-card-avatar">
          <img :src="getAvatarImgUrl(p.email)" />
        </div>
        <div class="player-card-other">
          <!-- 昵称 -->
          <div class="player-card-nick">{{ p.nick }}</div>
          <!-- 是否房主、是否准备、是否庄、是否上把赢家 -->
          <div class="player-card-status">
            <span class="el-icon-user-solid" style="color: #34495e" title="房主" v-if="room.owner === p.uid"></span>
            <span class="el-icon-s-flag" style="color: #27ae60" title="就绪" v-if="room.state === 0 && p.ready"></span>
            <span class="el-icon-star-on" style="color: #f1c40f" title="赢家" v-if="room.last_win === p.uid"></span>
            <span class="el-icon-link" style="color: #2c3e50" title="断开连接" v-if="p.offline"></span>
            <span class="el-icon-circle-close" style="color: #ff4757; cursor: pointer;" title="请出房间" @click="onKickPlayer(p.uid)"
              v-if="room.state === 0 && room.owner === uid && p.uid !== uid" ></span>
          </div>
          <!-- 靠右上悬浮：倒计时 -->
          <div class="player-card-timer" title="倒计时" v-show="room.game_state >= 4 && isThinking(p.uid)">{{ Math.floor(room.timer / 10) }}</div>
          <!-- 靠右下悬浮：手牌数 -->
          <div class="player-card-rest-card" title="剩余手牌" v-show="room.state === 1">{{ p.restCount }}</div>
          </div>
        </div>
      <div class="content-desk-status-before"></div>
      <div class="content-desk-status">
        <div class="spinner" v-if="room && room.state === 1" v-bind:class="{ cw: room.direction === 1, ccw: room.direction === -1 }"></div>
        <div class="draw-counter" v-if="room && room.state === 1 && room.draw > 0">{{ `+${room.draw}` }}</div>
        <img class="current-card" v-if="room && room.state === 1 && room.game_state >= 4" title="当前牌面" :class="{ 'show-color': room.last_chg_color > 0 }"
          :src="`${publicPath}card-imgs/${room.last}.png`" />
        <span class="el-icon-caret-right current-arrow" v-if="room && room.state === 1 && room.game_state >= 4 && room.last_chg_color > 0"></span>
        <img class="current-color" v-if="room && room.state === 1 && room.game_state >= 4 && room.last_chg_color > 0" title="当前颜色"
          :src="`${publicPath}card-imgs/${room.last_chg_color}.png`" />
        <HistoryEventList class="event-list" :events="events"></HistoryEventList>
      </div>
      <div class="content-desk-status-after"></div>
      <resize-observer @notify="onContentResize" />
    </div>
    <div class="layout-bottom">
      <div class="bottom-actions">
        <!-- 房间操作 -->
        <el-popover placement="top" width="180" v-model="useVoicePanelVisible">
          <el-tabs v-model="useVoicePanelActiveName">
            <el-tab-pane class="voice-list" v-for="(v, k) in userVoices" :key="k" :label="k" :name="k">
              <div class="voice-list-item" v-for="(v2, idx) in v" :key="idx" @click="onUseVoice(v2.id)">
                {{ v2.desc }}
              </div>
            </el-tab-pane>
          </el-tabs>
          <el-button class="bottom-action-btn" slot="reference" :disabled="useVoiceCoolingDownTimer !== 0">
            问候{{ useVoiceCoolingDownTimer > 0 ? `(${Math.floor(useVoiceCoolingDownTimer / 10) + 1})`: '' }}
          </el-button>
        </el-popover>
        <el-button class="bottom-action-btn" v-if="canShowReady" @click="onGameReady">准备</el-button>
        <el-button class="bottom-action-btn" v-if="canShowStart" @click="onGameChangeSeats">重排座位</el-button>
        <el-button class="bottom-action-btn" v-if="canShowStart" @click="onGameStart">开局</el-button>
        <!-- 游戏操作 -->
        <el-button class="bottom-action-btn" v-if="room && room.game_state === 4 && room.last_can_report >= 0 && room.last_can_report !== uid" @click="onReportNoUno">举报</el-button>
        <el-button class="bottom-action-btn" v-if="room && room.game_state === 4 && room.seq[room.cursor] === uid && !needChgColor"
          @click="onDealCard">拿牌</el-button>
        <el-checkbox-button class="el-button bottom-action-checkbox" v-model="withUno" v-if="selectedCard > 0 && !needChgColor">UNO</el-checkbox-button>
        <el-button class="bottom-action-btn" v-if="selectedCard > 0 && !needChgColor" @click="onPlayCard(null)">{{ room.seq[room.cursor] === uid ? '出牌': '抢牌' }}</el-button>
        <!-- 换色操作 -->
        <el-button class="bottom-action-btn" v-if="needChgColor" @click="onPlayCard(1)">
          换<span style="color: #f44336; font-weight: bold">红</span>色
        </el-button>
        <el-button class="bottom-action-btn" v-if="needChgColor" @click="onPlayCard(2)">
          换<span style="color: #ffc107; font-weight: bold">黄</span>色
        </el-button>
        <el-button class="bottom-action-btn" v-if="needChgColor" @click="onPlayCard(3)">
          换<span style="color: #03a9f4; font-weight: bold">蓝</span>色
        </el-button>
        <el-button class="bottom-action-btn" v-if="needChgColor" @click="onPlayCard(4)">
          换<span style="color: #4caf50; font-weight: bold">绿</span>色
        </el-button>
      </div>
      <div class="bottom-card-pool" v-show="room && room.state === 1" ref="cardPool">
        <div v-for="(card, idx) in myCardList" :key="idx" :title="card.name" :style="{ 'z-index': idx, left: `${card.left}px` }"
          :class="{ 'uno-card': true, selected: selectedCard === card.c, forbidden: !canCardBeSelected(card.c) }" @click="onSelectCard(card.c)">
            <img class="uno-card-img" :src="`${publicPath}card-imgs/${card.c}.png`" />
            <span class="uno-card-count" v-show="card.count > 1">{{ `x${card.count}` }}</span>
        </div>
        <resize-observer @notify="onCardPoolResize" />
      </div>
    </div>
  </div>
</template>

<script>
import md5 from 'blueimp-md5'
import errc from '../comm/errc'
import cards from '../comm/cards'
import events from '../comm/events'
import sounds from '../comm/sounds'
import HistoryEventList from './HistoryEventList.vue'

function vh (v) {
  var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
  return (v * h) / 100
}

function vw (v) {
  var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
  return (v * w) / 100
}

function vmin (v) {
  return Math.min(vh(v), vw(v))
}

// function vmax (v) {
//   return Math.max(vh(v), vw(v))
// }

export default {
  name: 'RoomPanel',
  components: {
    HistoryEventList
  },
  props: {
    uid: Number
  },
  data () {
    return {
      timer: null,
      publicPath: process.env.BASE_URL,
      userVoices: sounds.USER_VOICE_TABLE,

      room: null,
      events: [],

      // 视口大小
      vpWidth: 1,
      vpHeight: 1,
      cardPoolWidth: 1,
      cardPoolHeight: 1,

      // 玩家操作
      lastClickTime: 0, // 上次点击时间（用于模拟双击）
      selectedCard: -1, // 选中的卡
      withUno: false,
      needChgColor: false,
      useVoicePanelVisible: false,
      useVoicePanelActiveName: '',
      useVoiceCoolingDownTimer: 0,

      // 获胜界面
      showGameOverWindow: false,
      gameOverWindowWinnerEmail: '',
      gameOverWindowWinnerNick: '',
      gameOverWindowWinnerStealerNick: '',
      gameOverWindowStats: []
    }
  },
  computed: {
    canShowReady () {
      return this.room && this.room.state === 0 && this.room.owner !== this.uid && !this.room.players[this.uid].ready
    },
    canShowStart () {
      return this.room && this.room.state === 0 && this.room.owner === this.uid
    },
    cardDeskPlayers () {
      let ret = []
      if (!this.room) {
        return ret
      }

      // 计算偏移，使得 room.seq[room.cursor + offset] == uid 且 room.cursor + offset = 0
      let offset = 0
      for (let i = 0; i < this.room.seq.length; ++i) {
        if (this.room.seq[i] === this.uid) {
          offset = -i
          break
        }
      }

      // 计算玩家列表
      // 算法：先根据最小视口大小将卡片挂在一个正方形范围内，然后再缩放到长方形范围。这样可以最大程度避免UI重叠和各种奇怪的排位。
      const D2R = Math.PI / 180
      const RESERVED_X_MARGIN = vmin(2) // 保留的横向边框距离
      const RESERVED_Y_MARGIN = vmin(2) // 保留的纵向边框距离
      let pcw = vmin(30 + 3) // 玩家卡片宽度
      let pch = vmin(10 + 2) // 玩家卡片高度
      let pcol = vmin(3)
      let pcot = vmin(1)
      let hpcw = pcw / 2 // 玩家卡片半宽度
      let hpch = pch / 2 // 玩家卡片半高度
      let hvw = this.vpWidth / 2 // 视口半宽度
      let hvh = this.vpHeight / 2 // 视口半高度
      let bhvw = Math.max(1, hvw - hpcw - RESERVED_X_MARGIN) // 减去卡片宽度和保留边距后的半宽度
      let bhvh = Math.max(1, hvh - hpch - RESERVED_Y_MARGIN) // 减去卡片高度和保留边距后的半高度
      let rot = 360 / this.room.curr_players // 旋转切分角度
      let minw = Math.min(bhvw, bhvh) // 用于计算的正方形大小
      let scaleX = 1
      let scaleY = 1
      if (this.vpWidth - RESERVED_X_MARGIN > this.vpHeight - RESERVED_Y_MARGIN) {
        scaleX = (this.vpWidth - RESERVED_X_MARGIN) / (this.vpHeight - RESERVED_Y_MARGIN)
      } else {
        scaleY = (this.vpHeight - RESERVED_Y_MARGIN) / (this.vpWidth - RESERVED_X_MARGIN)
      }
      for (let i = 0; i < this.room.seq.length; ++i) {
        let uid = this.room.seq[i]
        let player = this.room.players[uid]
        if (!player) {
          continue
        }
        let p = { uid: uid, nick: player.nick, email: player.email || '', ready: player.ready, restCount: player.rest_count, offline: player.offline, cardLeft: 0, cardTop: 0 }
        let angle = 90 + rot * (i + offset)
        let factor = Math.min(minw / Math.abs(Math.cos(angle * D2R)), minw / Math.abs(Math.sin(angle * D2R)))
        let offsetX = Math.cos(angle * D2R) * factor
        let offsetY = Math.sin(angle * D2R) * factor

        // 缩放到合适
        offsetX = offsetX * scaleX
        offsetY = offsetY * scaleY

        let x = offsetX + hvw
        let y = offsetY + hvh

        p.cardLeft = x - hpcw
        p.cardTop = y - hpch

        // 越界调整
        if (p.cardLeft < RESERVED_X_MARGIN / 2) {
          p.cardLeft = RESERVED_X_MARGIN / 2
        } else if (p.cardLeft + pcw + RESERVED_X_MARGIN / 2 > this.vpWidth) {
          p.cardLeft = this.vpWidth - RESERVED_X_MARGIN / 2 - pcw
        }

        // 头像偏移
        p.cardLeft = p.cardLeft + pcol
        p.cardTop = p.cardTop + pcot

        ret.push(p)
      }
      return ret
    },
    myCardList () {
      let ret = []
      if (this.room) {
        let m = {}
        for (let i = 0; i < this.room.my_cards.length; ++i) {
          let c = this.room.my_cards[i]
          if (!m[c]) {
            m[c] = 0
          }
          m[c] = m[c] + 1
        }
        for (let v in m) {
          v = Number(v)

          let color = cards.getColor(v)
          let func = cards.getFunc(v)
          let name = `${cards.COLOR_NAMES[color]}${cards.FUNC_NAMES[func]}`
          let count = m[v]

          let pair = { c: v, name: name, count: count, color: color, func: func, left: 0 }
          ret.push(pair)
        }
        ret.sort((a, b) => {
          if (a.color < b.color) {
            return -1
          } else if (a.color > b.color) {
            return 1
          } else {
            if (a.func < b.func) {
              return -1
            } else if (a.func > b.func) {
              return 1
            } else {
              return 0
            }
          }
        })

        // 计算坐标
        const RESERVED_X_MARGIN = vmin(2) // 保留的横向边框距离
        const RESERVED_Y_MARGIN = vmin(1) // 保留的纵向边框距离
        const RESERVED_CARD_MARGIN = vmin(1) // 保留的卡片间距
        let vw = this.cardPoolWidth - RESERVED_X_MARGIN // 视口宽度
        let vh = this.cardPoolHeight - RESERVED_Y_MARGIN // 视口高度
        let cw = vh / 150 * 100 // 卡片宽度
        let lenThreshold = vw - cw
        let lenMax = Math.max(0, ret.length - 1) * (RESERVED_CARD_MARGIN + cw)
        let realLen = Math.min(lenMax, lenThreshold)
        let realMargin = realLen / Math.max(1, ret.length - 1)
        let totalLeft = vw / 2 - (realLen + cw) / 2 + RESERVED_X_MARGIN / 2
        for (let i = 0; i < ret.length; ++i) {
          ret[i].left = totalLeft + realMargin * i
        }
      }
      return ret
    }
  },
  methods: {
    reset () {
      this.room = null
      this.events = []
    },
    isThinking (uid) {
      if (!this.room) {
        return false
      }
      if (this.room.state === 0) {
        return false
      }
      return this.room.seq[this.room.cursor] === uid
    },

    // --- START AVATAR MODIFICATIONS ---

    // 负责计算 Gravatar URL，接受 vmin 作为参数
    getGravatarUrlBySize (email, sizeVmin) {
      email = email || ''
      email = email.trim().toLowerCase()

      if (!sizeVmin || sizeVmin <= 0) {
        sizeVmin = 12 // 默认使用最大的玩家卡片头像尺寸 12vmin
      }

      const targetPixelSize = Math.ceil(vmin(sizeVmin * 2))

      return `https://www.gravatar.com/avatar/${md5(email)}?s=${targetPixelSize}&d=mp`
    },

    getAvatarImgUrl (email) {
      return this.getGravatarUrlBySize(email, 12)
    },

    getGameOverAvatarImgUrl (email) {
      return this.getGravatarUrlBySize(email, 6)
    },

    // --- END AVATAR MODIFICATIONS ---

    genGameOverStat (stat) {
      let text = events.GAME_FINAL_STAT_EVENT_TABLE[stat.id]
      if (!text) {
        return ''
      }
      return text.replace('{nick}', `<span class="good-event-list-item-nickname">${stat.nick}</span>`)
        .replace('{counter}', `<span class="good-event-list-item-counter">${stat.counter}</span>`)
    },
    canCardBeSelected (c) {
      if (!this.room || this.room.state !== 1 || this.room.game_state !== 4) {
        return false
      }
      // 如果可以抢牌
      if (this.room.last === c && this.room.can_play_ahead) {
        return true
      }
      // 如果轮到我
      if (this.uid === this.room.seq[this.room.cursor]) {
        // 完全一样肯定是可以跟牌的
        if (this.room.last === c) {
          return true
        }

        let color = cards.getColor(c)
        let func = cards.getFunc(c)
        let lastColor = cards.getColor(this.room.last)
        let lastFunc = cards.getFunc(this.room.last)

        // 如果是罚牌状态
        if (this.room.draw > 0) {
          // 如果上张是黑色卡
          if (lastColor === cards.COLOR_ALL) {
            // 那么只能跟黑色
            if (color !== cards.COLOR_ALL) {
              return false
            }
            // 如果是+2罚牌，则可以跟+4，否则只能跟+4
            // +2后跟王牌+2的逻辑属于相同牌规则，之前判断过了
            if (lastFunc === cards.FUNC_DRAW2 && func === cards.FUNC_DRAW4) {
              return true
            }
            return false // +4后跟+4的情况属于相同牌规则，之前判断过了
          }

          // 如果上张是+2
          if (lastFunc === cards.FUNC_DRAW2) {
            // 可以接任意+2
            if (func === cards.FUNC_DRAW2) {
              return true
            }
            // 可以接同色+4或者王牌+4
            if (func === cards.FUNC_DRAW4 && (color === lastColor || color === cards.COLOR_ALL)) {
              return true
            }
            return false
          }

          // 如果上张是+4
          if (lastFunc === cards.FUNC_DRAW4) {
            // 可以接任意+4
            if (func === cards.FUNC_DRAW4) {
              return true
            }
            return false
          }
          return false
        }

        // 对于上一张是全色牌的情况，可以衔接选择的颜色的牌
        if (lastColor === cards.COLOR_ALL && this.room.last_chg_color === color) {
          return true
        }

        // 其他情况，可以跟同色、同功能或者无颜色的牌
        if ((color === lastColor || color === cards.COLOR_ALL) || func === lastFunc) {
          return true
        }
      }
      return false
    },
    cancelSelect () {
      this.selectedCard = -1
      this.withUno = false
      this.needChgColor = false
    },

    // UI事件
    onContentResize () {
      this.vpWidth = Math.max(1, this.$refs.cardDesk.clientWidth)
      this.vpHeight = Math.max(1, this.$refs.cardDesk.clientHeight)
    },
    onCardPoolResize () {
      this.cardPoolWidth = Math.max(1, this.$refs.cardPool.clientWidth)
      this.cardPoolHeight = Math.max(1, this.$refs.cardPool.clientHeight)
    },
    onLeaveRoom () {
      this.$c2s('leave_room_req', this.room.id)
    },
    onGameReady () {
      this.$c2s('get_ready_req', this.room.id)
    },
    onGameStart () {
      this.$c2s('start_game_req', this.room.id)
    },
    onGameChangeSeats () {
      this.$c2s('shuffle_room_seats_req', this.room.id)
    },
    onReportNoUno () {
      this.$c2s('game_report_no_uno_req', this.room.id)
    },
    onSelectCard (c) {
      // 由于dblclick事件不怎么好用，这里手动计算双击
      let now = Date.now()
      let dblclick = false
      if (now - this.lastClickTime < 500) { // 500ms内认为是双击
        dblclick = true
      }
      this.lastClickTime = now

      // 检查是否可选
      if (this.canCardBeSelected(c)) {
        if (c === this.selectedCard) {
          if (dblclick) {
            this.onPlayCard(null) // 如果双击，则直接发牌
          } else {
            this.cancelSelect() // 否则取消
          }
        } else {
          this.selectedCard = c
        }
      } else if (c === this.selectedCard) {
        this.cancelSelect() // 容错
      }
    },
    onPlayCard (chgColor) {
      if (this.selectedCard <= 0) {
        return
      }

      // 简单来说，全色牌需要选择颜色
      if (cards.getColor(this.selectedCard) === cards.COLOR_ALL) {
        if (!chgColor) {
          // 如果选中的牌需要用户选择颜色
          this.needChgColor = true
          return
        }
      } else {
        chgColor = cards.COLOR_ALL
      }

      this.$c2s('game_play_card_req', this.room.id, this.selectedCard, this.withUno, chgColor)
      this.cancelSelect()
    },
    onDealCard () {
      this.$c2s('game_deal_card_req', this.room.id)
    },
    onUseVoice (id) {
      this.$c2s('room_use_voice_req', this.room.id, id)
      this.useVoicePanelVisible = false
    },
    onKickPlayer (uid) {
      this.$c2s('room_kickout_player_req', this.room.id, uid)
    },
    onUpdate () {
      if (this.useVoiceCoolingDownTimer > 0) {
        this.useVoiceCoolingDownTimer = this.useVoiceCoolingDownTimer - 0.5
        if (this.useVoiceCoolingDownTimer < 0) {
          this.useVoiceCoolingDownTimer = 0
        }
      }

      if (!this.room || this.room.state !== 1) {
        return
      }
      if (this.room.timer > 0) {
        this.room.timer = this.room.timer - 0.5
        if (this.room.timer < 0) {
          this.room.timer = 0
        }
      }
    },

    // 服务器事件
    create_room_rsp (code, room) {
      if (code === errc.ERR_OK) {
        // console.log(room)
        this.room = room
      }
    },
    enter_room_rsp (code, room) {
      if (code === errc.ERR_OK) {
        // console.log(room)
        this.room = room
      }
    },
    leave_room_rsp (code) {
      if (code === errc.ERR_OK) {
        console.log(`Successfully left room`)
        this.reset()
      } else if (code === errc.ERR_API_ROOM_CANNOT_LEAVE_AT_THIS_TIME) {
        this.$message.error(`离开房间失败：此时不能离开房间`)
      } else {
        this.$message.error(`离开房间失败（Code：${code}）`)
      }
    },
    get_ready_rsp (code) {
      if (code === errc.ERR_OK) {
        this.room.players[this.uid].ready = true
      } else {
        this.$message.error(`准备失败（Code：${code}）`)
      }
    },
    start_game_rsp (code) {
      if (code === errc.ERR_API_ROOM_NOT_READY) {
        this.$message.error(`开局失败：有玩家尚未准备好`)
      } else if (code !== errc.ERR_OK) {
        this.$message.error(`开局失败（Code：${code}）`)
      } else {
        console.log('Start game successfully')
      }
    },
    shuffle_room_seats_rsp (code) {
      if (code === errc.ERR_API_ROOM_NOT_OWNER) {
        this.$message.error(`重排座位失败：不是房主`)
      } else if (code === errc.ERR_API_ROOM_UPDATE_SEAT_COOLDOWN) {
        this.$message.error(`重排座位失败：冷却中`)
      } else if (code !== errc.ERR_OK) {
        this.$message.error(`重排座位失败（Code：${code}）`)
      } else {
        console.log('Rearrange seats successfully')
      }
    },
    room_use_voice_rsp (code) {
      if (code === errc.ERR_API_ROOM_USE_VOICE_COOLDOWN) {
        this.$message.error(`使用语音失败：冷却中`)
      } else if (code !== errc.ERR_OK) {
        this.$message.error(`使用语音失败（Code：${code}）`)
      } else {
        console.log('Use voice successfully')
        this.useVoiceCoolingDownTimer = 100
      }
    },
    room_kickout_player_rsp (code) {
      if (code === errc.ERR_API_ROOM_NOT_OWNER) {
        this.$message.error(`踢出玩家失败：不是房主`)
      } else if (code === errc.ERR_API_ROOM_PLAYER_NOT_FOUND) {
        this.$message.error(`踢出玩家失败：未找到玩家`)
      } else if (code !== errc.ERR_OK) {
        this.$message.error(`踢出玩家失败（Code：${code}）`)
      } else {
        console.log('Kickout player successfully')
      }
    },
    room_event_ntf (roomId, sender, event, ...args) {
      if (!this.room) {
        console.error(`Room is null, ignore event ${event}`)
        return
      } else if (this.room.id !== roomId) {
        console.error(`Room id mismatched, ignore event ${event}`)
        return
      }

      let func = this['event_' + event]
      if (!func) {
        return
      }

      try {
        let newargs = [sender]
        for (let i = 0; i < args.length; ++i) {
          newargs.push(args[i])
        }
        func.apply(this, newargs)
      } catch (ex) {
        console.error(`Unexpected error while dispatch game event ${event}`)
        console.error(ex)
      }
    },
    game_play_card_rsp (code) {
      if (code !== errc.ERR_OK) {
        this.$message.error(`出牌失败（Code：${code}）`)
      }
    },
    game_deal_card_req (code) {
      if (code !== errc.ERR_OK) {
        this.$message.error(`发牌失败（Code：${code}）`)
      }
    },
    game_report_no_uno_rsp (code) {
      if (code === errc.ERR_API_GAME_CANNOT_REPORT_NO_UNO) {
        this.$message.error(`此时不能举报`)
      } else if (code !== errc.ERR_OK) {
        this.$message.error(`举报失败（Code：${code}）`)
      } else {
        this.$message({ message: '举报成功', type: 'success' })
      }
    },

    // 房间消息
    event_be_kicked (sender) {
      this.reset()
      this.$message.error(`您被房主请出了房间`)
    },
    event_player_left (sender, reason) {
      // console.log(`Player left, uid ${sender}, reason ${reason}`)

      let player = this.room.players[sender]

      delete this.room.players[sender]
      this.room.curr_players = this.room.curr_players - 1
      for (let i = 0; i < this.room.seq.length; ++i) {
        if (this.room.seq[i] === sender) {
          this.room.seq.splice(i, 1)
          break
        }
      }

      // 生成事件
      events.pushPlayerLeftEvent(this.events, player, reason)
    },
    event_player_ready (sender) {
      // console.log(`Player ready, uid ${sender}`)

      this.room.players[sender].ready = true
    },
    event_player_joined (sender, player) {
      // console.log(`Player join, uid ${sender}`)

      this.$set(this.room.players, sender, player)
      this.room.curr_players = this.room.curr_players + 1
      this.room.seq.push(sender)

      // 生成事件
      events.pushPlayerJoinEvent(this.events, player)
    },
    event_owner_changed (sender, owner) { // ignore sender
      // console.log(`Owner changed -> ${owner}`)
      this.room.owner = owner
    },
    event_game_start (sender, room) {
      // console.log(`Game start`)
      this.room = room
      this.cancelSelect() // 取消选择

      // 生成事件
      events.pushGameStartEvent(this.events, this.room.players[this.room.dealer])

      // 播放音效
      sounds.playGameStartSound()
    },
    event_game_dismiss () {
      // console.log(`Game dismissed`)
      this.reset()
    },
    event_player_win (sender, winner) { // ignore sender
      // console.log(`Game Over, winner ${winner}`)
      this.room.state = 0
      this.room.game_state = 0
      this.room.last_win = winner
      this.cancelSelect() // 取消选择

      // 生成事件
      events.pushGameOverEvent(this.events, this.room.players[winner])

      // 播放音效
      sounds.playGameOverSound(this.uid === winner)
    },
    event_game_stat (sender, stat, winner, winnerStealer) {
      let winnerPlayer = this.room.players[winner]
      this.gameOverWindowWinnerEmail = (winnerPlayer ? winnerPlayer.email : '')
      this.gameOverWindowWinnerNick = (winnerPlayer ? winnerPlayer.nick : '#unknown')

      let winnerStealerPlayer = (winnerStealer ? this.room.players[winnerStealer] : null)
      this.gameOverWindowWinnerStealerNick = (winnerStealerPlayer ? winnerStealerPlayer.nick : '')

      for (let i = 0; i < stat.length; ++i) {
        let player = this.room.players[stat[i].uid]
        stat[i].nick = (player ? player.nick : '#unknown')
      }
      this.gameOverWindowStats = stat

      this.showGameOverWindow = true
    },
    event_thinking (sender, uid, timer, last, lastChgColor, direction, draw, lastCanReport, canPlayAhead) { // ignore sender
      // console.log(`Thinking, uid ${uid}, timer ${timer}, last ${last}, last_chg_color ${lastChgColor}, direction ${direction}, draw ${draw}, lastCanReport ${lastCanReport}`)

      // 重新计算cursor
      for (let i = 0; i < this.room.seq.length; ++i) {
        if (this.room.seq[i] === uid) {
          this.room.cursor = i
          break
        }
      }
      // console.log(`Select cursor ${this.room.cursor}, uid ${this.room.seq[this.room.cursor]}`)

      // 刷新状态
      this.room.timer = timer
      this.room.last = last
      this.room.last_chg_color = lastChgColor
      this.room.direction = direction
      this.room.draw = draw
      this.room.last_can_report = lastCanReport
      this.room.can_play_ahead = canPlayAhead
      this.cancelSelect() // 取消选择
    },
    event_first_card (sender, c) { // ignore sender
      // console.log(`First card ${c}`)

      // 刷新状态
      this.room.game_state = 4
      this.room.last = c
      this.room.can_play_ahead = true

      // 生成事件
      events.pushFirstCardEvent(this.events, c)
    },
    event_card_deal (uid, restCount, dealCount, dealCards, reason, reportBy, cursor) {
      // console.log(`Card deal ${uid}, rest ${restCount}, dealCount ${dealCount}, dealCards ${dealCards}, reason ${reason}, reportBy ${reportBy}`)

      // 刷新游标
      this.room.cursor = cursor

      // 刷新玩家计数
      let player = this.room.players[uid]
      player.rest_count = restCount

      // 如果是我的牌，则放入内存
      if (uid === this.uid) {
        for (let i = 0; i < dealCards.length; ++i) {
          this.room.my_cards.push(dealCards[i])
        }
      }

      // 刷新状态
      if (reason === events.DEAL_CARD_REASON_REPORT) {
        this.room.last_can_report = -1 // 已经被罚牌了，则当前可举报标记清空
      }
      this.cancelSelect() // 取消选择

      // 生成事件
      events.pushCardDealEvent(this.events, player, dealCount, reason, reportBy ? this.room.players[reportBy] : null)

      // 播放音效
      if (reason === events.DEAL_CARD_REASON_REPORT) {
        sounds.playReportSound()
      }
    },
    event_card_play (uid, c, needUno, withUno, restCount, cards, ahead) {
      // console.log(`Card play ${uid}, card ${c}, needUno ${needUno}, withUno ${withUno}, restCount ${restCount}, cards ${cards}, ahead ${ahead}`)

      // 刷新玩家计数
      let player = this.room.players[uid]
      player.rest_count = restCount

      // 如果是我的牌，则刷新
      if (uid === this.uid) {
        this.room.my_cards = cards
      }

      // 刷新状态
      this.cancelSelect() // 取消选择

      // 生成事件
      events.pushCardPlayEvent(this.events, player, c, withUno, ahead)

      // 播放声音
      sounds.playCardSound(c, withUno)
    },
    event_player_online (uid) {
      // console.log(`Player online ${uid}`)

      // 刷新玩家状态
      let player = this.room.players[uid]
      player.offline = false
    },
    event_player_offline (uid) {
      // console.log(`Player offline ${uid}`)

      // 刷新玩家状态
      let player = this.room.players[uid]
      player.offline = true
    },
    event_update_seats (sender, seq) { // 忽略sender
      // console.log(`Update seats`)

      // 更新座位排列
      this.room.seq = seq

      // 所有玩家非准备
      for (let u in this.room.players) {
        this.room.players[u].ready = false
      }

      // 生成事件
      events.pushUpdateSeatsEvent(this.events)
    },
    event_use_voice (sender, uid, voiceId) { // 忽略sender
      let player = this.room.players[uid]

      // 生成事件
      events.pushUseVoiceEvent(this.events, player, sounds.SOUND_DEFS_TABLE[voiceId])

      // 播放音效
      sounds.playSoundById(voiceId)
    }
  },
  mounted () {
    this.timer = setInterval(this.onUpdate.bind(this), 50)
    this.onUpdate() // 第一次挂载立即调用

    // 初始化的时候选一个页签显示
    for (let k in this.userVoices) {
      this.useVoicePanelActiveName = k
      break
    }

    // 强制触发大小刷新
    this.onContentResize()
    this.onCardPoolResize()
  },
  beforeDestroy () {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  },
  sockets: {
    s2c (args) {
      return this.$s2cHandler(args)
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
  .landscape-layout {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  /* 顶部样式 */
  .layout-top {
    padding: 0.5vmin;
    height: 5vmin;
    background-color: #607d8b;
    display: flex;
    flex-direction: row;
  }

  .layout-top>.top-icon {
    font-size: 5vmin;
    line-height: 5vmin;
    color: #fcfcfc;
    text-shadow: #bdc3c7 1px 1px 2px;
    cursor: pointer;
  }
  .layout-top>.top-icon:hover{
    color: #03a9f4;
    text-shadow: #bdc3c7 0px 0px 2px;
    transform: translate(1px, 1px);
  }

  .layout-top>.top-title {
    font-size: 4vmin;
    line-height: 5vmin;
    color: #fcfcfc;
    text-shadow: #bdc3c7 1px 1px 2px;
    text-align: center;
    flex: 1;
  }

  /* 内容样式 */
  .layout-content {
    flex: 1;
    position: relative;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .layout-content .content-player-card {
    position: absolute;
    width: 30vmin;
    height: 10vmin;
    background: linear-gradient(0deg, rgba(255,255,255,1), rgba(255,255,255,0.5));
    border: solid 1px rgba(0, 0, 0, 0.5);
    border-radius: 1vmin;
    box-shadow: #2c3e50 1px 1px 8px;
    z-index: 1;
  }
  .content-player-card.thinking {
    box-shadow: #ffeb3b 0px 0px 12px;
    background: #ffffff;
  }
  .content-player-card .player-card-avatar {
    position: absolute;
    left: -3vmin;
    top: -1vmin;
    bottom: -1vmin;
    width: 12vmin;
  }
  .content-player-card .player-card-avatar>img {
    position: absolute;
    border-radius: 6vmin;
    left: 0;
    top: 0;
    width: 12vmin;
    height: 12vmin;
    background-color: #607d8b;
    box-shadow: #2c3e50 1px 1px 4px;
  }
  .content-player-card.thinking .player-card-avatar>img {
    box-shadow: #ffeb3b 0px 0px 12px;
  }
  .content-player-card .player-card-other {
    position: absolute;
    left: 9.5vmin;
    top: 1vmin;
    bottom: 1vmin;
    right: 1vmin;
  }
  .content-player-card .player-card-nick {
    height: 3.5vmin;
    font-size: 3.5vmin;
    line-height: 3.5vmin;
    margin-bottom: 1vmin;
    font-weight: bold;
  }
  .content-player-card .player-card-status {
    height: 3.5vmin;
    font-size: 3.5vmin;
    line-height: 3.5vmin;
  }
  .content-player-card .player-card-timer {
    position: absolute;
    top: -0.5vmin;
    right: -0.5vmin;
    z-index: 1;
    font-size: 3.6vmin;
    height: 4vmin;
    width: 4vmin;
    border: solid 1px #bdc3c7;
    background-color: #f1c40f;
    text-align: center;
  }
  .content-player-card .player-card-rest-card {
    position: absolute;
    bottom: -0.5vmin;
    right: -0.5vmin;
    z-index: 1;
    font-size: 3.6vmin;
    height: 4vmin;
    width: 4vmin;
    border: solid 1px #bdc3c7;
    background-color: #ecf0f1;
    text-align: center;
  }

  .content-desk-status-before {
    flex: 1;
  }

  .content-desk-status {
    width: 60vmin;
    height: 60vmin;
    margin-left: auto;
    margin-right: auto;
    position: relative;
  }
  .content-desk-status .spinner {
    position: absolute;
    left: 0;
    top: 0;
    filter: blur(0.5vmin);
    opacity: 0.5;
    width: 100%;
    height: 100%;
  }
  .content-desk-status .spinner.cw {
    background: url('../assets/spinner-cw.gif') center center no-repeat;
    background-size: contain;
  }
  .content-desk-status .spinner.ccw {
    background: url('../assets/spinner-ccw.gif') center center no-repeat;
    background-size: contain;
  }
  .content-desk-status .current-card {
    position: absolute;
    top: 15vmin;
    left: 25vmin;
    width: 10vmin;
  }
  .content-desk-status .current-card.show-color {
    left: 15vmin !important;
  }
  .content-desk-status .current-arrow {
    position: absolute;
    top: 20vmin;
    left: 27.5vmin;
    width: 5vmin;
    height: 5vmin;
    text-shadow: #2c3e50 3px 3px;
    color: #fcfcfc;
    font-size: 5vmin;
    line-height: 5vmin;
  }
  .content-desk-status .current-color {
    position: absolute;
    top: 15vmin;
    right: 15vmin;
    width: 10vmin;
  }
  .content-desk-status .draw-counter {
    position: absolute;
    left: 0;
    top: 25vmin;
    width: 100%;
    font-size: 10vmin;
    line-height: 10vmin;
    z-index: 1;
    text-align: center;
    color: #fcfcfc;
    text-shadow: 1vmin 1vmin 5vmin #2c3e50,
      -1px -1px 0 #000,
      1px -1px 0 #000,
      -1px 1px 0 #000,
      1px 1px 0 #000;
    font-weight: bolder;
  }
  .content-desk-status .event-list {
    position: absolute;
    left: 5vmin;
    right: 5vmin;
    bottom: 15vmin;
    max-height: 10vmin;
    z-index: 1000;
  }

  .content-desk-status-after {
    flex: 1;
  }

  /* 底部样式 */
  .layout-bottom {
    height: 30vmin;
    display: flex;
    flex-direction: column;
  }

  .layout-bottom>.bottom-actions {
    text-align: center;
    height: 7vmin;
    /* background-color: #bdc3c7; */
  }

  .layout-bottom .bottom-action-btn {
    margin-top: 1vmin;
    margin-bottom: 1vmin;
    margin-left: 10px;
    font-size: 3vmin;
    padding: 0.5vmin;
  }

  .layout-bottom .bottom-action-checkbox {
    margin-top: 1vmin;
    margin-bottom: 1vmin;
    margin-left: 10px;
    font-size: 3vmin;
    padding: 0.5vmin;
  }
  .layout-bottom .bottom-action-checkbox.el-checkbox-button.is-checked {
    background-color: #409EFF;
    border-color: #409EFF;
    -webkit-box-shadow: -1px 0 0 0 #8cc5ff;
    box-shadow: -1px 0 0 0 #8cc5ff;
  }
  .layout-bottom .bottom-action-checkbox .el-checkbox-button__inner {
    line-height: inherit !important;
    vertical-align: inherit !important;
    border: none !important;
    border-left: 0 !important;
    color: inherit !important;
    transition: none !important;
    padding: 0 !important;
    font-size: inherit !important;
  }
  .layout-bottom .bottom-action-checkbox.el-checkbox-button.is-checked .el-checkbox-button__inner {
    color: #FFF !important;
    background-color: transparent !important;
    box-shadow: none !important;
  }

  .layout-bottom .bottom-card-pool {
    flex: 1;
    overflow-x: auto;
    overflow-y: hidden;
    position: relative;
    text-align: center;
    white-space: nowrap;
  }

  .uno-card {
    position: absolute;
    cursor: pointer;
    top: 2vmin;
    bottom: 0.5vmin;
    transition: transform 0.2s ease-in-out;
  }
  .uno-card .uno-card-img {
    height: 100%;
  }
  .uno-card .uno-card-count {
    position: absolute;
    font-size: 3vmin;
    left: 0.3vmin;
    bottom: 0.1vmin;
    border: solid 1px black;
    background-color: rgb(251, 251, 0, 0.8);
  }
  .uno-card>img {
    filter: grayscale(40%);
  }
  .uno-card:hover>img {
    filter: grayscale(0%) brightness(100%);
  }
  .uno-card.selected>img {
    filter: grayscale(0%) brightness(120%) blur(0.01vmin);
  }
  .uno-card.forbidden {
    cursor: not-allowed !important;
  }
  .uno-card:hover {
    transform: translateY(-2vmin);
  }
  .uno-card.selected {
    transform: translateY(-2vmin);
  }

  .voice-list {
    overflow-y: auto;
    height: 180px;
  }
  .voice-list-item {
    cursor: pointer;
    margin-bottom: 4px;
  }
  .voice-list-item:hover {
    color: #409EFF;
    font-weight: bold;
  }

  .gameover-panel {
    text-align: center;
  }
  .gameover-panel .winner-content {
    font-size: 3vmin;
    line-height: 6vmin;
  }
  .gameover-panel .winner-avatar {
    border-radius: 3vmin;
    width: 6vmin;
    height: 6vmin;
    background-color: #607d8b;
    box-shadow: #2c3e50 1px 1px 4px;
    vertical-align: -25%;
    margin-left: 1vmin;
    margin-right: 0.5vmin;
  }
  .gameover-panel .winner-nickname {
    font-size: 4vmin;
    margin-right: 1vmin;
    color: #f6b93b;
    font-weight: bolder;
  }
  .gameover-panel .winner-stealer-content {
    margin-top: 1vmin;
    font-size: 2vmin;
    line-height: 3vmin;
  }
  .gameover-panel .winner-stealer-content .winner-stealer-nickname {
    font-size: 2.5vmin;
    color: #fa983a;
    font-weight: bold;
  }
  .gameover-panel .good-event-list {
    font-size: 2vmin;
    margin-top: 2vmin;
  }
  .gameover-panel .good-event-list-item {
    margin-top: 1vmin;
  }
  .gameover-panel .good-event-list-item .good-event-list-item-nickname {
    font-weight: bold;
  }
  .gameover-panel .good-event-list-item .good-event-list-item-counter {
    font-weight: bold;
    color: #e55039;
  }
</style>
