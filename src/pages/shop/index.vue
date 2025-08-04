<script lang="ts" setup>
// 注释设置代码规范
/* eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */

import { ref } from 'vue'
import { ElAmap, lazyAMapApiLoaderInstance, useGeolocation } from '@vuemap/vue-amap'
import type { ElAmapInstance } from '@vuemap/vue-amap'
import { queryPlaceAround } from '@/api/amap'

interface StateItem {
  zoom: number
  center: [number, number]
  position: [number, number]
  markerVisible: boolean
  markDraggable: boolean
  bus: any
  metro: any
}

const baseState = ref<StateItem>({
  zoom: 12,
  center: [116.397428, 39.90923],
  position: [116.397428, 39.90923],
  markerVisible: true,
  markDraggable: true,
  bus: null,
  metro: null,
})

// 这样就可以获取到ElAmap的组件实例类型
const mapRef = ref<ElAmapInstance>(null)

function init(map: AMap.Map) {
  console.log('map init: ', map)
}

function handleQueryMetro() {
  queryPlaceAround({ location: baseState.value.center.toLocaleString(), keywords: '地铁站' }).then((res) => {
    baseState.value.bus = res.pois
    baseState.value.bus.forEach((item: any) => {
      item.position = item.location.split(',').map(Number)
    })
  }).catch(() => {
    baseState.value.metro = null
  })
}

function handleQueryBusStation() {
  queryPlaceAround({ location: baseState.value.center.toLocaleString(), keywords: '公交站' }).then((res) => {
    baseState.value.bus = res.pois
    baseState.value.bus.forEach((item: any) => {
      item.position = item.location.split(',').map(Number)
    })
  }).catch(() => {
    baseState.value.bus = null
  })
}

onBeforeMount(() => {
  lazyAMapApiLoaderInstance.then(() => {
    useGeolocation({ enableHighAccuracy: true, needAddress: true }).then((res) => {
      const { getCurrentPosition } = res

      getCurrentPosition().then((currentPosition) => {
        baseState.value.center = currentPosition.position.toArray()
        baseState.value.position = currentPosition.position.toArray()
        console.log('currentPosition: ', currentPosition)
      }).catch(error => console.log(error))
    }).catch(error => console.log(error))
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

      <!--
        地铁站点信息
      -->
      <div v-for="(item, index) in baseState.bus" :key="index">
        <ElAmapMarker
          :position="item.position"
          :visible="true"
          :title="item.name"
        />
      </div>

      <!--
        公交站点信息
      -->
      <div v-for="(item, index) in baseState.bus" :key="index">
        <ElAmapMarker
          :position="item.position"
          :visible="true"
          :title="item.name"
        />
      </div>
    </ElAmap>
  </div>
  <DemoBlock card title="操作">
    <div style="margin: 16px">
      <van-button round block type="primary" native-type="submit" @click="handleQueryMetro">
        获取地铁站点信息
      </van-button>
    </div>
    <div style="margin: 16px">
      <van-button round block type="primary" native-type="submit" @click="handleQueryBusStation">
        获取公交站点信息
      </van-button>
    </div>
  </DemoBlock>
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
