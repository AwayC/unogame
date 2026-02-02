<template>
  <div id="app">
    <LoadingIcon v-if="state === 0 || state === 2 || state === 5" />
    <LoginPanel v-show="state === 1" v-on:login="onLogin" />
    <CreateRolePanel v-show="state === 3" />
    <LobbyPanel v-if="state === 4" :enable="state === 4" :data="data" :token="token" @logout="onLogout" />
    <RoomPanel v-if="state >= 2" v-show="state === 6" :uid="data.uid" />
  </div>
</template>

<script>
import assert from 'assert'
import errc from './comm/errc'
import sounds from './comm/sounds'
import LoadingIcon from './components/LoadingIcon.vue'
import LoginPanel from './components/LoginPanel.vue'
import CreateRolePanel from './components/CreateRolePanel.vue'
import LobbyPanel from './components/LobbyPanel.vue'
import RoomPanel from './components/RoomPanel.vue'

const STATE_CONNECTING = 0 // 连接中
const STATE_NOT_LOGGED = 1 // 尚未登录
const STATE_LOGINING = 2 // 登陆中
const STATE_CREATE_ROLE = 3 // 需要创建角色
const STATE_LOGGED = 4 // 登录了
const STATE_REENTERING_ROOM = 5 // 加入游戏中
const STATE_PLAYING = 6 // 游戏中

export default {
  name: 'app',
  data () {
    return {
      state: STATE_CONNECTING,

      // 客户端状态
      token: '', // Token
      data: { uid: -1 }, // 客户端状态
      username: ''
    }
  },
  components: {
    LoadingIcon,
    LoginPanel,
    CreateRolePanel,
    LobbyPanel,
    RoomPanel
  },
  // 【修改点 1】添加 created 钩子，页面刷新时恢复 Token
  created () {
    const savedToken = localStorage.getItem('uno_token')
    if (savedToken) {
      console.log('App created: Found saved token, restoring...')
      this.token = savedToken
      // 注意：此时 Socket 可能还没连上，逻辑会交给 sockets.connect 处理
    }
  },
  methods: {
    reset () { // 重置系统状态
      this.state = STATE_CONNECTING
      this.data = {}
    },

    // UI事件
    onLogin (token) {
      console.log(`Login, token ${token}`)
      sounds.init()
      this.token = token
      this.state = STATE_LOGINING

      // 【修改点 2】确保 Token 被保存 (防止 LoginPanel 没存)
      localStorage.setItem('uno_token', token)

      console.log(`Emit login reqeust`)
      this.$c2s('login_req', this.token)
    },
    onLogout () {
      console.log(`Logout`)
      // 【修改点 3】主动退出，清除 Token 并刷新页面
      localStorage.removeItem('uno_token')
      this.$c2s('logout_req')
      location.reload()
    },

    // 服务器事件
    create_role_ntf () {
      console.log(`Create role ntf`)
      assert(this.state === STATE_LOGINING)
      this.state = STATE_CREATE_ROLE
    },
    create_role_rsp (code) {
      if (code === errc.ERR_OK) {
        console.log(`Create role ok`)
        this.state = STATE_LOGINING // 刷新状态重走登录
      }
    },
    login_rsp (code, token, data) {
      assert(this.state === STATE_LOGINING)
      if (code !== errc.ERR_OK) {
        console.error(`login_rsp code ${code}`)

        // 登录失败，此时需要清空Token，然后重新发起登录
        this.$message.error(`登录失败（Code: ${code}）`)
        this.token = ''

        // 【修改点 4】登录失败（可能是 Token 过期），清除本地非法 Token
        localStorage.removeItem('uno_token')

        this.reset()
        return
      }

      // 登录成功，赋值
      console.log(`Login successfully`)
      // console.log(data)
      this.token = token // 刷新Token

      // 【修改点 5】登录成功，更新本地 Token (服务器可能返回更新的 Token)
      localStorage.setItem('uno_token', token)

      this.data = data
      this.state = STATE_LOGGED

      // 如果身上还有room_id，则请求加入房间
      if (this.data.room_id && this.data.room_id > 0) {
        this.$c2s('enter_room_req', this.data.room_id, true)
        this.state = STATE_REENTERING_ROOM
      }
    },
    logout_ntf (reason) {
      console.log(`ticked by server ${reason}`)

      // 被服务器主动踢出
      this.token = ''
      this.data = {}
      this.state = STATE_NOT_LOGGED

      // 【修改点 6】被踢出时，也要清除本地 Token，防止刷新后死循环自动登录
      localStorage.removeItem('uno_token')

      if (reason === 'kick-out') {
        this.$message.error('您被服务器踢出，可能是发生了顶号等情况')
      } else if (reason !== 'ok') {
        this.$message.error(`异常登出（${reason}）`)
      }
    },
    create_room_rsp (code, room) {
      assert(this.state === STATE_LOGGED)
      if (code === errc.ERR_OK) {
        console.log(`Create room successfully, room_id ${room.id}`)
        this.state = STATE_PLAYING
      }
    },
    enter_room_rsp (code, room) {
      assert(this.state === STATE_REENTERING_ROOM || this.state === STATE_LOGGED)
      if (code === errc.ERR_OK) {
        console.log(`Enter room successfully, room_id ${room.id}`)
        this.state = STATE_PLAYING
        return
      }
      this.state = STATE_LOGGED
    },
    leave_room_rsp (code) {
      assert(this.state === STATE_PLAYING)
      if (code === errc.ERR_OK) {
        this.state = STATE_LOGGED
      }
    },
    room_event_ntf (roomId, sender, event, ...args) {
      if (event === 'game_dismiss') {
        assert(this.state === STATE_PLAYING)
        this.state = STATE_LOGGED
      } else if (event === 'be_kicked') {
        assert(this.state === STATE_PLAYING)
        this.state = STATE_LOGGED
      }
    },
    update_email_rsp (code, email) {
      if (code === errc.ERR_OK) {
        this.data.email = email
      }
    }
  },
  sockets: {
    connect () {
      console.log('Socket connected')

      // 如果已经有token，则跳过登录页面尝试直接发起登录请求，否则需要用户提供
      if (this.token === '') {
        this.state = STATE_NOT_LOGGED
      } else {
        // 【关键逻辑】如果 created 里恢复了 token，这里会自动进入登录流程
        this.state = STATE_LOGINING
        this.onLogin(this.token)
      }
    },
    disconnect (reason) {
      console.log(`Socket disconnected: ${reason}`)
      if (reason === 'io server disconnect') {
        this.$socket.connect()
      } else {
        this.$message.error(`服务器连接断开（${reason}）`)
      }

      this.reset()
    },
    s2c (args) {
      return this.$s2cHandler(args)
    }
  }
}
</script>

<style>
html {
  margin: 0px;
  width: 100%;
  height: 100%;
}

body {
  margin: 0px;
  width: 100%;
  height: 100%;
  background: radial-gradient(#c0392b -24%, #8a2b20 100%);
}

#app {
  width: 100%;
  height: 100%;
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
