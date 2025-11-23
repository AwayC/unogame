export default {
  install (Vue, options) {
    Vue.prototype.$c2s = function (funcname, ...args) {
      this.$socket.emit('c2s', funcname, ...args)
    }
    Vue.prototype.$s2cHandler = function (args) {
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
