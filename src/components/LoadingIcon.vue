<template>
  <div class="loading-panel">
    <div class="el-icon-loading loading-icon"></div>
  </div>
</template>

<script>
export default {
  name: 'LoadingIcon',
  data () {
    return {
    }
  },
  methods: {
  }
}
</script>

<style>
  .loading-panel {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%,-50%);
  }

  .loading-icon {
    font-size: 32pt;
    color: white;
  }
</style>
