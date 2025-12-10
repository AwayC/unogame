export default {
  install (Vue, options) {
    Vue.prototype.$c2s = function (funcname, ...args) {
      // 修改：使用原生 WebSocket 发送 JSON 字符串
      // 协议格式假设为数组: ["函数名", 参数1, 参数2...]
      if (this.$socket && this.$socket.readyState === 1) { // 1 = OPEN
        this.$socket.send(JSON.stringify([funcname, ...args]))
      } else {
        console.warn('WebSocket 未连接，无法发送消息:', funcname)
      }
    }

    Vue.prototype.$s2cHandler = function (args) {
      // 保持原有逻辑不变，args 依然是数组 [funcname, ...params]
      let func = this[typeof args === 'string' ? args : args[0]]
      if (!func) {
        return
      }

      try {
        let newargs = []
        if (typeof args !== 'string') {
          for (let i = 1; i < args.length; ++i) {
            newargs.push(args[i])
          }
        }
        func.apply(this, newargs)
      } catch (ex) {
        console.error(`Unexpected error while dispatch s2c msg ${args[0]}`)
        console.error(ex)
      }
    }
  }
}
