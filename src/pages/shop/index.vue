<script lang="ts" setup>
// 注释设置代码规范
/* eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */

import { ref } from 'vue'
import { ElAmap, lazyAMapApiLoaderInstance, useGeolocation } from '@vuemap/vue-amap'
import type { ElAmapInstance } from '@vuemap/vue-amap'

interface StateItem {
  zoom: number
  center: [number, number]
  position: [number, number]
  markerVisible: true
  markDraggable: false
}

const baseState = ref<StateItem>({
  zoom: 12,
  center: [116.397428, 39.90923],
  position: [116.397428, 39.90923],
  markerVisible: true,
  markDraggable: false,
})

// 这样就可以获取到ElAmap的组件实例类型
const mapRef = ref<ElAmapInstance>(null)

function init(map: AMap.Map) {
  console.log('map init: ', map)
}

onBeforeMount(() => {
  lazyAMapApiLoaderInstance.then(() => {
    useGeolocation({
      enableHighAccuracy: true,
      needAddress: true,
    }).then((res) => {
      const { getCurrentPosition, getCityInfo } = res
      getCurrentPosition().then((currentPosition) => {
        baseState.value.center = currentPosition.position.toArray()
        baseState.value.position = currentPosition.position.toArray()
        console.log('currentPosition: ', currentPosition)
      })
      getCityInfo().then((cityResult) => {
        console.log('cityResult: ', cityResult)
      })
    })
  })
})
</script>

<template>
  <div class="map-page-container">
    <ElAmap
      ref="mapRef"
      :center="baseState.center"
      :zoom="baseState.zoom"
      @init="init"
    >
      <ElAmapMarker
        :position="baseState.center"
        :visible="baseState.markerVisible"
        :draggable="baseState.markDraggable"
      />
    </ElAmap>
  </div>
</template>

<style lang="less">
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
