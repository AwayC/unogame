import Vue from 'vue'
import App from './App.vue'
import VueSocketIO from 'vue-socket.io'
import Element from 'element-ui'
import VueResize from 'vue-resize'
import 'element-ui/lib/theme-chalk/index.css'
import 'vue-resize/dist/vue-resize.css'
import util from './comm/util'

Vue.config.productionTip = false

Vue.use(util)
Vue.use(Element)
Vue.use(VueResize)

if (process.env.NODE_ENV === 'production') {
  Vue.use(new VueSocketIO({
    debug: false,
    connection: 'uno.example.com',
    options: { path: '/ws' }
  }))
} else {
  Vue.use(new VueSocketIO({
    debug: true,
    connection: 'localhost:8080',
    options: { path: '/ws' }
  }))
}

new Vue({
  render: h => h(App)
}).$mount('#app')
