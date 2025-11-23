<template>
  <div>
    <div class="panel">
      <img class="logo-img" alt="logo" src="../assets/main-logo.png">
      <div class="panel-ui-container" v-if="!register">
        <el-input placeholder="请输入登录名" v-model="username" :disabled="disabled"></el-input>
        <el-input placeholder="请输入密码" v-model="password" :disabled="disabled" show-password @keyup.enter.native="onLogin"></el-input>
        <el-button @click="onGotoRegister" :disabled="disabled">注册</el-button>
        <el-button type="primary" @click="onLogin" :disabled="disabled">登录</el-button>
      </div>
      <div class="panel-ui-container" v-if="register">
        <el-input placeholder="请输入登录名（仅英文字母、数字或下划线）" v-model="username" :disabled="disabled"></el-input>
        <el-input placeholder="请输入密码" v-model="password" :disabled="disabled" show-password></el-input>
        <el-input placeholder="再确认密码" v-model="password2" :disabled="disabled" show-password></el-input>
        <el-input placeholder="请输入邮箱" v-model="email" :disabled="disabled"></el-input>
        <el-button @click="onCancel" :disabled="disabled">返回</el-button>
        <el-button type="primary" @click="onRegister" :disabled="disabled">注册</el-button>
      </div>
    </div>
    <div class="copyright">
      本游戏仅供内部娱乐之用，不用于亦不包含商业用途。所用素材均来源网络，如若侵权请联系作者下架。
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import md5 from 'blueimp-md5'
import errc from '../comm/errc'
import sounds from '../comm/sounds'

export default {
  name: 'LoginPanel',
  data () {
    return {
      register: false,
      username: '',
      password: '',
      password2: '',
      email: '',
      disabled: false
    }
  },
  methods: {
    onLogin () {
      // 由于音频策略限制，必须在用户事件中初始化音频
      sounds.init()

      axios
        .post('/api/login', { name: this.username, password: md5(this.password) })
        .then((res) => {
          this.disabled = false

          let data = res.data
          if (data.code !== errc.ERR_OK) {
            console.error(`Login error, msg ${data.msg}, code ${data.code}`)
            if (data.code === errc.ERR_API_BAD_PASSWORD) {
              this.$message.error('登录失败：用户名或密码错误')
            } else {
              this.$message.error(`登录失败（Code: ${data.code}, Msg: ${data.msg}）`)
            }
          } else {
            this.$emit('login', data.data.token)
          }

          this.password = ''
        })
        .catch((err) => {
          console.error(err)
          this.disabled = false
          this.$message.error(err)
        })
      this.disabled = true
    },
    onGotoRegister () {
      this.register = true
    },
    onCancel () {
      this.register = false
      this.password = ''
    },
    onRegister () {
      // 由于音频策略限制，必须在用户事件中初始化音频
      sounds.init()

      if (this.email.length === 0) {
        this.$message.error('请输入邮箱地址')
        return
      }
      if (this.password.length === 0) {
        this.$message.error('请输入密码')
        return
      }
      if (this.password.length < 3) {
        this.$message.error('密码过短')
        return
      }
      if (this.password.length > 16) {
        this.$message.error('密码过长')
        return
      }
      if (this.password !== this.password2) {
        this.$message.error('两次密码不一致')
        return
      }

      axios
        .post('/api/register', { name: this.username, password: md5(this.password), email: this.email })
        .then((res) => {
          this.disabled = false

          let data = res.data
          if (data.code !== errc.ERR_OK) {
            console.error(`Register error, msg ${data.msg}, code ${data.code}`)
            if (data.code === errc.ERR_API_NAME_TOO_LONG) {
              this.$message.error('注册失败：用户名过长')
            } else if (data.code === errc.ERR_API_NAME_TOO_SHORT) {
              this.$message.error('注册失败：用户名过短')
            } else if (data.code === errc.ERR_API_PASSWORD_TOO_LONG) {
              this.$message.error('注册失败：密码过长')
            } else if (data.code === errc.ERR_API_PASSWORD_TOO_SHORT) {
              this.$message.error('注册失败：密码过短')
            } else if (data.code === errc.ERR_API_NAME_INVALID) {
              this.$message.error('注册失败：用户名包含非法字符')
            } else if (data.code === errc.ERR_API_EMAIL_INVALID) {
              this.$message.error('注册失败：无效的邮箱地址或地址过长')
            } else if (data.code === errc.ERR_DB_EXISTS) {
              this.$message.error('注册失败：用户已存在')
            } else {
              this.$message.error(`注册失败（Code: ${data.code}, Msg: ${data.msg}）`)
            }
            return
          }

          this.$emit('login', data.data.token)

          this.password = ''
          this.password2 = ''
          this.email = ''
          this.register = false
        })
        .catch((err) => {
          console.error(err)
          this.disabled = false
          this.$message.error(err)
        })
      this.disabled = true
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .panel {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%,-50%);
    text-align: center;
  }

  .panel-ui-container {
    width: 45vmin;
    margin-top: 2vmin;
  }
  .panel-ui-container .el-input {
    margin-bottom: 2vmin;
  }
  .panel-ui-container .el-button {
    margin-left: 2vmin;
    margin-right: 2vmin;
  }

  .logo-img {
    position: relative;
    width: 35vmin;
    height: 35vmin;
  }

  .copyright {
    position: absolute;
    left: 10px;
    bottom: 10px;
    font-size: 12px;
    color: white;
  }
</style>
