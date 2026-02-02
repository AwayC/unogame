<template>
  <div class="landscape-layout">
    <el-dialog title="创建房间" :visible.sync="showCreateWindow" width="50vmin" :center="true" :modal="true" :show-close="false" :close-on-click-modal="false" :close-on-press-escape="false">
      <el-input placeholder="请输入房间标题" v-model="createWindowTitle" :disabled="createWindowDisabled"></el-input>
      <div class="dialog-column">
        <div class="dialog-row"><span>房间人数</span></div>
        <div class="dialog-row" style="flex: 1"><el-slider v-model="createWindowRoomSize" :step="1" :min="2" :max="20" show-stops></el-slider></div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="onCancelCreateRoom" :disabled="createWindowDisabled">取消</el-button>
        <el-button type="primary" @click="onCreateRoom" :disabled="createWindowDisabled">确定</el-button>
      </span>
    </el-dialog>

    <el-dialog title="个人资料" :visible.sync="showAccountInfoWindow" width="50vmin" :center="true" :modal="true" :show-close="false" :close-on-click-modal="false" :close-on-press-escape="false">
      <div class="dialog-column">
        <div class="dialog-row" style="flex: 1; text-align: center; font-weight: bold;">账号</div>
      </div>
      <div class="dialog-column">
        <div class="dialog-row"><span>UID</span></div>
        <div class="dialog-row" style="flex: 1; text-align: right;">{{ data.uid }}</div>
      </div>
      <div class="dialog-column">
        <div class="dialog-row"><span>用户名</span></div>
        <div class="dialog-row" style="flex: 1; text-align: right;">{{ data.name }}</div>
      </div>
      <div class="dialog-column">
        <div class="dialog-row"><span>密码</span></div>
        <div class="dialog-row" style="flex: 1; text-align: right;" v-if="!accountInfoWindowPasswordInput"></div>
        <div class="dialog-row" v-if="!accountInfoWindowPasswordInput"><el-button @click="onShowEditPassword" :disabled="accountInfoWindowDisabled">修改</el-button></div>
        <el-input class="dialog-row" style="flex: 1;" v-model="accountInfoPassword" v-if="accountInfoWindowPasswordInput" :disabled="accountInfoWindowDisabled" show-password></el-input>
      </div>
      <div class="dialog-column" v-if="accountInfoWindowPasswordInput">
        <div class="dialog-row"><span>确认</span></div>
        <el-input class="dialog-row" style="flex: 1;" v-model="accountInfoPassword2" :disabled="accountInfoWindowDisabled" show-password></el-input>
      </div>
      <div class="dialog-column">
        <div class="dialog-row"><span>邮箱</span></div>
        <div class="dialog-row" style="flex: 1; text-align: right;" v-if="!accountInfoWindowEmailInput">{{ data.email || '' }}</div>
        <div class="dialog-row" v-if="!accountInfoWindowEmailInput"><el-button @click="onShowEditEmail" :disabled="accountInfoWindowDisabled">修改</el-button></div>
        <el-input class="dialog-row" style="flex: 1;" v-model="accountInfoEmail" v-if="accountInfoWindowEmailInput" :disabled="accountInfoWindowDisabled"></el-input>
      </div>
      <div class="dialog-column" style="display: inline-block; line-height: 20px">
        * 邮箱信息会被用于展示头像，请至<a href="https://cn.gravatar.com/" target="_blank">gravatar</a>绑定你的头像。<br/>
        * 需要重新登录使修改生效。
      </div>
      <div class="dialog-column">
        <div class="dialog-row" style="flex: 1; text-align: center; font-weight: bold;">游戏账号</div>
      </div>
      <div class="dialog-column">
        <div class="dialog-row"><span>昵称</span></div>
        <div class="dialog-row" style="flex: 1; text-align: right;">{{ data.nick }}</div>
      </div>

      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="onUpdateAccountInfo" v-if="accountInfoWindowEmailInput | accountInfoWindowPasswordInput" :disabled="accountInfoWindowDisabled">更新资料</el-button>
        <el-button @click="onCloseAccountInfoWindow" :disabled="accountInfoWindowDisabled">关闭</el-button>
        <el-button type="danger" @click="onLogout" :disabled="accountInfoWindowDisabled">退出登录</el-button>
      </span>
    </el-dialog>

    <div class="layout-top">
      <span class="top-icon el-icon-circle-plus-outline" @click="onShowCreateRoom" title="创建房间"></span>
      <span class="top-icon float-right el-icon-s-custom" @click="onShowAccountInfo" title="个人资料"></span>
    </div>
    <div class="layout-content">
      <el-card class="box-card" v-for="e in rooms" v-bind:key="e.id">
        <span v-if="e.joinable" class="joinable-title" @click="onJoinRoom(e.id)">加入</span>
        <span v-if="!e.joinable" class="playing-title">{{ e.playing ? "游戏中": "不可加入" }} </span>
        <div class="title">{{ e.title }}</div>
        <div class="player-counter">{{ e.curr_players }} / {{ e.max_players }}</div>
      </el-card>
    </div>
    <div class="layout-bottom">
      <span class="online-label">{{ `当前在线玩家：${online}` }}</span>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import md5 from 'blueimp-md5'
import errc from '../comm/errc'

export default {
  name: 'LobbyPanel',
  props: {
    enable: Boolean,
    data: Object,
    token: String
  },
  data () {
    return {
      timer: null,
      rooms: [],
      online: 0,

      showCreateWindow: false,
      createWindowTitle: '',
      createWindowDisabled: false,
      createWindowRoomSize: 8,

      showAccountInfoWindow: false,
      accountInfoWindowDisabled: false,
      accountInfoWindowEmailInput: false,
      accountInfoWindowPasswordInput: false,
      accountInfoEmail: '',
      accountInfoPassword: '',
      accountInfoPassword2: '',
      accountInfoReqs: 0
    }
  },
  methods: {
    // 退出登录方法
    onLogout () {
      this.$confirm('确定要退出登录吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$emit('logout')
      }).catch(() => {
        // 取消
      })
    },
    releaseAccountInfoReqs () {
      this.accountInfoReqs = this.accountInfoReqs - 1
      if (this.accountInfoReqs <= 0) {
        this.accountInfoWindowDisabled = false
        this.accountInfoReqs = 0
      }
    },
    onUpdate () {
      if (this.enable) {
        this.$c2s('get_room_list_req')
      }
    },
    onCreateRoom () {
      this.$c2s('create_room_req', this.createWindowTitle, this.createWindowRoomSize)
      this.createWindowDisabled = true
    },
    onShowCreateRoom () {
      this.showCreateWindow = true
    },
    onCancelCreateRoom () {
      this.showCreateWindow = false
    },
    onJoinRoom (roomId) {
      this.$c2s('enter_room_req', roomId, false)
    },
    onShowAccountInfo () {
      this.showAccountInfoWindow = true
      this.accountInfoWindowDisabled = false
      this.accountInfoWindowEmailInput = false
      this.accountInfoWindowPasswordInput = false
    },
    onCloseAccountInfoWindow () {
      this.showAccountInfoWindow = false
    },
    onShowEditEmail () {
      this.accountInfoWindowEmailInput = true
      this.accountInfoEmail = this.data.email
      this.accountInfoPassword = this.accountInfoPassword2 = ''
    },
    onShowEditPassword () {
      this.accountInfoWindowPasswordInput = true
    },
    onUpdateAccountInfo () {
      // 前置检查
      if (this.accountInfoWindowEmailInput) {
        if (this.accountInfoEmail.length === 0) {
          this.$message.error('请输入邮箱地址')
          return
        }
      }
      if (this.accountInfoWindowPasswordInput) {
        if (this.accountInfoPassword.length === 0) {
          this.$message.error('请输入密码')
          return
        }
        if (this.accountInfoPassword.length < 3) {
          this.$message.error('密码过短')
          return
        }
        if (this.accountInfoPassword.length > 16) {
          this.$message.error('密码过长')
          return
        }
        if (this.accountInfoPassword !== this.accountInfoPassword2) {
          this.$message.error('两次密码不一致')
          return
        }
      }

      this.accountInfoReqs = 0
      if (this.accountInfoWindowEmailInput) {
        axios
          .post('/api/update_email', { token: this.token, email: this.accountInfoEmail })
          .then((res) => {
            this.releaseAccountInfoReqs()

            let data = res.data
            if (data.code !== errc.ERR_OK) {
              console.error(`Update email error, msg ${data.msg}, code ${data.code}`)
              if (data.code === errc.ERR_API_EMAIL_INVALID) {
                this.$message.error('修改邮箱地址失败：无效的邮箱地址或地址过长')
              } else {
                this.$message.error(`修改邮箱地址失败（Code: ${data.code}, Msg: ${data.msg}）`)
              }
            } else {
              this.$message.info('更新邮箱地址成功，请重新登录使之生效')
              this.$emit('logout')
            }
          })
          .catch((err) => {
            this.releaseAccountInfoReqs()

            console.error(err)
            this.$message.error(`更新邮件地址请求失败`)
          })
        this.accountInfoReqs = this.accountInfoReqs + 1
      }
      if (this.accountInfoWindowPasswordInput) {
        axios
          .post('/api/update_password', { token: this.token, password: md5(this.accountInfoPassword) })
          .then((res) => {
            this.releaseAccountInfoReqs()

            let data = res.data
            if (data.code !== errc.ERR_OK) {
              console.error(`Update password error, msg ${data.msg}, code ${data.code}`)
              if (data.code === errc.ERR_API_PASSWORD_TOO_LONG) {
                this.$message.error('修改密码失败：密码过长')
              } else if (data.code === errc.ERR_API_PASSWORD_TOO_SHORT) {
                this.$message.error('修改密码失败：密码过短')
              } else {
                this.$message.error(`修改密码失败（Code: ${data.code}, Msg: ${data.msg}）`)
              }
            } else {
              this.$message.info('更新密码成功，请重新登录')
              this.$emit('logout')
            }
          })
          .catch((err) => {
            this.releaseAccountInfoReqs()

            console.error(err)
            this.$message.error(`更新密码请求失败`)
          })
        this.accountInfoReqs = this.accountInfoReqs + 1
      }
      if (this.accountInfoReqs > 0) {
        this.accountInfoWindowDisabled = true
      } else {
        this.showAccountInfoWindow = false
      }
    },

    // 服务器事件
    get_room_list_rsp (code, rooms, online) {
      if (code === errc.ERR_OK) {
        this.rooms = rooms
        this.online = online
      } else {
        console.error(`Fetch room list error, code: ${code}`)
      }
    },
    create_room_rsp (code, room) {
      this.createWindowDisabled = false
      if (code === errc.ERR_API_ROOM_INVALID_TITLE) {
        this.$message.error('创建房间失败：无效标题')
      } else if (code === errc.ERR_API_ROOM_INVALID_PARAM) {
        this.$message.error('创建房间失败：无效参数')
      } else if (code !== errc.ERR_OK) {
        this.$message.error(`创建房间失败（Code：${code}）`)
      } else {
        // 由APP完成后续处理，这里仅隐藏窗口显示
        this.showCreateWindow = false
      }
    },
    enter_room_rsp (code, room) {
      if (code === errc.ERR_API_ROOM_NOT_FOUND) {
        this.$message.error('加入房间失败：房间已解散')
      } else if (code === errc.ERR_API_ROOM_IS_IN_GAME) {
        this.$message.error('加入房间失败：游戏中')
      } else if (code === errc.ERR_API_ROOM_IS_FULL) {
        this.$message.error('加入房间失败：房间已满')
      } else if (code !== errc.ERR_OK) {
        this.$message.error(`加入房间失败（Code：${code}）`)
      }
    },
    update_email_rsp (code, email) {
      this.accountInfoWindowDisabled = false
      if (code === errc.ERR_OK) {
        this.showAccountInfoWindow = false
        this.$message.info(`修改个人资料成功`)
      } else if (code === errc.ERR_API_EMAIL_INVALID) {
        this.$message.error(`修改个人资料失败：无效的邮箱地址`)
      } else if (code !== errc.ERR_OK) {
        this.$message.error(`修改个人资料失败（Code：${code}）`)
      }
    }
  },
  mounted () {
    this.timer = setInterval(this.onUpdate.bind(this), 3000)
    this.onUpdate() // 第一次挂载立即调用
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

<style scoped>
  .landscape-layout {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  /* 顶部样式 */
  .layout-top {
    position: relative;
    padding: 0.5vmin;
    height: 5vmin;
    background-color: #607d8b;
    display: block;
  }

  .layout-top>.top-icon {
    float: left;
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
  .layout-top .float-right {
    float: right;
  }

  /* 内容样式 */
  .layout-content {
    position: relative;
    overflow-x: hidden;
    overflow-y: auto;
    flex: 1;
    padding: 3vmin;
  }
  .layout-content .box-card {
    margin-left: auto;
    margin-right: auto;
    text-align: left;
    width: 80%;
    box-shadow: #607d8b 3px 3px 5px;
    padding: 0.01vmin;
    font-size: 3vmin;
    line-height: 3vmin;
    margin-bottom: 1vmin;
  }
  .box-card .joinable-title {
    float: right;
    margin-top: 0.01vmin;
    margin-right: 0.01vmin;
    cursor: pointer;
    color: #8bc34a;
  }
  .box-card .playing-title {
    float: right;
    margin-top: 0.01vmin;
    margin-right: 0.01vmin;
    color: #d35400;
  }
  .box-card .player-counter {
    margin-top: 0.5vmin;
    font-size: 2.5vmin;
    line-height: 2.5vmin;
  }

  /* 底部样式 */
  .layout-bottom {
    padding: 0.5vmin;
    height: 4vmin;
    background-color: #607d8b;
    text-align: center;
  }
  .layout-bottom>.online-label {
    font-size: 3vmin;
    line-height: 4vmin;
    color: #fcfcfc;
    text-shadow: #bdc3c7 1px 1px 2px;
    text-align: center;
  }

  .dialog-column {
    display: flex;
    flex-direction: row;
    height: 40px;
    line-height: 40px;
    margin-top: 4px;
    margin-bottom: 4px;
  }
  .dialog-column>.dialog-row {
    height: 40px;
    line-height: 40px;
    margin-left: 8px;
    margin-right: 8px;
  }
</style>
