<script lang="ts" setup>
// 注释设置代码规范
/* eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */

import { ref } from 'vue'
import { ElAmap } from '@vuemap/vue-amap'
import type { ElAmapInstance } from '@vuemap/vue-amap'

const zoom = ref(12)
const center = ref([121.59996, 31.197646])
function init(map: AMap.Map) {
  console.log('map init: ', map)
}

// 这样就可以获取到ElAmap的组件实例类型
const mapRef = ref<ElAmapInstance>(null)
</script>

<template>
  <div class="map-page-container">
    <ElAmap
      ref="mapRef"
      :center="center"
      :zoom="zoom"
      @init="init"
    />
  </div>
</template>

<style>
.map-page-container {
  width: 100%;
  height: 100vw;
}
</style>

<route lang="json5">
{
  name: 'shop',
  meta: {
    title: 'shop',
    i18n: 'menus.shop'
  }
}
</route>
