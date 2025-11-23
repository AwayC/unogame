<template>
  <div class="panel">
    <div style="margin: 4px 4px">创建角色</div>
    <el-input style="margin: 4px 4px" placeholder="请输入昵称（支持中文）" v-model="nickname" :disabled="disabled"></el-input>
    <el-button style="margin: 4px 4px" type="primary" @click="onConfirm" :disabled="disabled">确认</el-button>
  </div>
</template>

<script>
import errc from '../comm/errc'

export default {
  name: 'CreateRolePanel',
  data () {
    return {
      nickname: '',
      disabled: false
    }
  },
  methods: {
    onConfirm () {
      this.disabled = true
      this.$c2s('create_role_req', this.nickname)
    },

    // 服务器消息
    create_role_rsp (code) {
      this.disabled = false
      if (code === errc.ERR_API_NICK_TOO_SHORT) {
        this.$message.error('创建角色失败：昵称过短')
      } else if (code === errc.ERR_API_NICK_TOO_LONG) {
        this.$message.error('创建角色失败：昵称过长')
      } else if (code === errc.ERR_API_NICK_INVALID) {
        this.$message.error('创建角色失败：无效字符')
      } else if (code === errc.ERR_API_NICK_IN_USE) {
        this.$message.error('创建角色失败：昵称已被使用')
      } else if (code !== errc.ERR_OK) {
        this.$message.error(`创建角色失败（Code：${code}）`)
      }
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
  .panel {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 35vmin;
    transform: translate(-50%,-50%);
    background: linear-gradient(0deg, rgba(255,255,255,1), rgba(255,255,255,0.5));
    border: solid 1px rgba(0, 0, 0, 0.5);
    border-radius: 1vmin;
    box-shadow: #2c3e50 1px 1px 8px;
    padding: 2vmin;
    font-size: 2vmin;
    text-align: center;
  }
</style>
