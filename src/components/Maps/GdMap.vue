<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AMapLoader from '@amap/amap-jsapi-loader'

const mapRef = ref<HTMLDivElement>()
const showPicker = ref(false)

/** 目标坐标（示例：天安门） */
const lng = 116.397428
const lat = 39.90923

/** 初始化地图 */
onMounted(async () => {
  window._AMapSecurityConfig = { securityJsCode: 'eb55fa225e704d63d40948a8067b89ac' }

  const AMap = await AMapLoader.load({
    key: '786b49e04633f0f32b44b6af707e312e',
    version: '2.0',
    plugins: ['AMap.Geocoder', 'AMap.Marker'],
  })

  const map = new AMap.Map(mapRef.value!, {
    zoom: 14,
    center: [lng, lat],
  })

  const marker = new AMap.Marker({ position: [lng, lat] })
  map.add(marker)

  // 点击标记 → 弹出导航选择
  marker.on('click', () => (showPicker.value = true))
})

/** 跳转对应地图 App */
function toMap(type: 'gd' | 'tx' | 'bd') {
  const urlMap = {
    gd: `https://uri.amap.com/marker?position=${lng},${lat}`,
    tx: `https://apis.map.qq.com/uri/v1/marker?marker=coord:${lat},${lng}`,
    bd: `http://api.map.baidu.com/marker?location=${lat},${lng}&output=html`,
  }
  window.location.href = urlMap[type]
}
</script>

<template>
  <!-- 地图容器 -->
  <div ref="mapRef" class="map-box" />

  <!-- Vant 底部弹窗：选导航 App -->
  <van-popup v-model:show="showPicker" round position="bottom">
    <van-cell title="高德地图" clickable @click="toMap('gd')" />
    <van-cell title="腾讯地图" clickable @click="toMap('tx')" />
    <van-cell title="百度地图" clickable @click="toMap('bd')" />
  </van-popup>
</template>

<style scoped>
.map-box {
  width: 100%;
  height: 70vh;
}
</style>
