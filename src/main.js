import Vue from 'vue'
import App from './App.vue'
// 移除 vue-socket.io
// import VueSocketIO from 'vue-socket.io'
import Element from 'element-ui'
import VueResize from 'vue-resize'
import 'element-ui/lib/theme-chalk/index.css'
import 'vue-resize/dist/vue-resize.css'
import util from './comm/util'

Vue.config.productionTip = false

// --- 原生 WebSocket 管理服务 ---
const eventBus = new Vue() // 用于分发事件
const wsService = {
  ws: null,
  url: '',

  init (url) {
    this.url = url
    this.connect()
  },

  connect () {
    if (this.ws) {
      this.ws.close()
    }

    this.ws = new WebSocket(this.url)

    this.ws.onopen = () => {
      console.log('WS Connected')
      eventBus.$emit('connect')
    }

    this.ws.onclose = (e) => {
      console.log('WS Disconnected', e.reason)
      eventBus.$emit('disconnect', e.reason)
      // 简单的自动重连机制
      setTimeout(() => {
        console.log('WS Reconnecting...')
        this.connect()
      }, 3000)
    }

    this.ws.onerror = (err) => {
      console.error('WS Error', err)
    }

    this.ws.onmessage = (msg) => {
      try {
        // 假设服务器返回的也是 JSON 数组: ["函数名", 参数...]
        // 对应原有的 's2c' 事件
        const data = JSON.parse(msg.data)
        eventBus.$emit('s2c', data)
      } catch (e) {
        console.error('WS Message Parse Error', e)
      }
    }
  },

  // 代理 send 方法，供 util.js 调用
  get readyState () {
    return this.ws ? this.ws.readyState : 0
  },

  send (data) {
    if (this.ws) this.ws.send(data)
  }
}

// 挂载 $socket，保持接口兼容
Vue.prototype.$socket = wsService

// --- 注入全局 Mixin 模拟 sockets 选项行为 ---
Vue.mixin({
  mounted () {
    if (this.$options.sockets) {
      const conf = this.$options.sockets
      // 注册 connect 事件
      if (conf.connect) {
        this._ws_connect_handler = conf.connect.bind(this)
        eventBus.$on('connect', this._ws_connect_handler)
      }
      // 注册 disconnect 事件
      if (conf.disconnect) {
        this._ws_disconnect_handler = conf.disconnect.bind(this)
        eventBus.$on('disconnect', this._ws_disconnect_handler)
      }
      // 注册 s2c (消息) 事件
      if (conf.s2c) {
        this._ws_s2c_handler = (data) => {
          // vue-socket.io 的 s2c 接收到的是参数列表，我们保持一致
          conf.s2c.call(this, data)
        }
        eventBus.$on('s2c', this._ws_s2c_handler)
      }
    }
  },
  beforeDestroy () {
    // 组件销毁时解绑事件，防止内存泄漏
    if (this._ws_connect_handler) eventBus.$off('connect', this._ws_connect_handler)
    if (this._ws_disconnect_handler) eventBus.$off('disconnect', this._ws_disconnect_handler)
    if (this._ws_s2c_handler) eventBus.$off('s2c', this._ws_s2c_handler)
  }
})

// --- 初始化插件 ---
Vue.use(util)
Vue.use(Element)
Vue.use(VueResize)

// --- 启动 WebSocket ---
// 根据环境决定 URL
let wsUrl = ''
if (process.env.NODE_ENV === 'production') {
  wsUrl = 'ws://uno.example.com/ws' // 生产环境地址
} else {
  // 开发环境走代理:8080 -> :8081
  // 注意：WebSocket 协议头是 ws://
  wsUrl = 'ws://localhost:8080/ws'
}
wsService.init(wsUrl)

new Vue({
  render: h => h(App)
}).$mount('#app')
