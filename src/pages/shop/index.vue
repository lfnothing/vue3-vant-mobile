<script lang="ts" setup>
// 注释设置代码规范
/* eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */

import { ref } from 'vue'
import { ElAmap, lazyAMapApiLoaderInstance, useGeolocation } from '@vuemap/vue-amap'
import type { ElAmapInstance } from '@vuemap/vue-amap'
import { queryValuation } from '@/api/amaps'
import { showToast } from 'vant'

interface StateItem {
  zoom: number
  center: [number, number]
  position: [number, number]
  markerVisible: boolean
  markDraggable: boolean
  // formattedAddress: string
  ret: any
  isloading: boolean
}

const baseState = ref<StateItem>({
  zoom: 12,
  center: [116.397428, 39.90923],
  position: [116.397428, 39.90923],
  markerVisible: true,
  markDraggable: true,
  // formattedAddress: '',
  ret: null,
  isloading: false,
})

// 这样就可以获取到ElAmap的组件实例类型
const mapRef = ref<ElAmapInstance>(null)
const showInfoWindow = ref(false)

function init(map: AMap.Map) {
  console.log('map init: ', map)
}

function handleDragend(eve: any) {
  baseState.value.position = eve.lnglat.toArray()
  baseState.value.center = eve.lnglat.toArray()
}
function handleMapClick() {
  baseState.value.isloading = true
  queryValuation(baseState.value.position.toLocaleString()).then((res) => {
    baseState.value.ret = res.ret.data
    console.log(res)
    showInfoWindow.value = true
  }).catch((error) => {
    console.error(error)
    showToast('数据加载失败，请稍后再试')
  }).finally(() => {
    baseState.value.isloading = false
  })
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
        // baseState.value.formattedAddress = currentPosition.formattedAddress
        console.log('currentPosition: ', currentPosition)
      })
      getCityInfo().then((cityResult) => {
        console.log('cityResult: ', cityResult)
      })
    })
  })
})

//
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
        :position="baseState.position"
        :visible="baseState.markerVisible"
        :draggable="baseState.markDraggable"
        @dragend="handleDragend"
      />
    </ElAmap>

    <van-row>
      <van-button
        round type="primary" size="large" :loading="baseState.isloading" loading-text="加载中..."
        @click="handleMapClick"
      >
        商铺评估
      </van-button>
    </van-row>
  </div>
  <div v-if="showInfoWindow" class="detail-panel">
    <van-row>
      <DemoBlock>
        位置名称
      </DemoBlock>
    </van-row>
    <van-field
      v-model="baseState.ret.address"
      rows="1"
      autosize
      type="textarea" readonly
    />

    <van-row>
      <DemoBlock>
        人流量
      </DemoBlock>
    </van-row>
    <van-radio-group v-model="baseState.ret.footTraffic" direction="horizontal" disabled>
      <van-radio :name="1">
        低
      </van-radio>
      <van-radio :name="10">
        中
      </van-radio>
      <van-radio :name="100">
        高
      </van-radio>
    </van-radio-group>

    <van-row>
      <DemoBlock>租金水平（元/月）</DemoBlock>
    </van-row>
    <van-field v-model="baseState.ret.rent" readonly />

    <van-row>
      <DemoBlock>附近人群分布</DemoBlock>
    </van-row>
    <van-field
      v-model="baseState.ret.nearbyPeopleDesc"
      rows="1"
      autosize
      type="textarea"
      readonly
    />

    <van-row>
      <DemoBlock>最近公交/地铁站距离（米）</DemoBlock>
    </van-row>
    <van-field v-model="baseState.ret.trafficDistance" readonly />

    <van-row>
      <DemoBlock>最近商圈距离（千米）</DemoBlock>
    </van-row>
    <van-field v-model="baseState.ret.commercialZoneDistance" readonly />

    <van-row>
      <DemoBlock>周边服务设施</DemoBlock>
    </van-row>
    <van-checkbox-group v-model="baseState.ret.nearbyServices" shape="square" disabled>
      <!-- direction="horizontal" :gutter="[150, 15]" -->
      <van-checkbox :name="0">
        写字楼
      </van-checkbox>
      <van-checkbox :name="1">
        学校
      </van-checkbox>
      <van-checkbox :name="2">
        医院
      </van-checkbox>
      <van-checkbox :name="3">
        购物中心
      </van-checkbox>
      <van-checkbox :name="4">
        住宅区
      </van-checkbox>
      <van-checkbox :name="5">
        公园
      </van-checkbox>
      <van-checkbox :name="6">
        停车场
      </van-checkbox>
    </van-checkbox-group>

    <van-row>
      <DemoBlock>综合评分</DemoBlock>
    </van-row>
    <van-rate
      v-model="baseState.ret.score"
      :count="10"
      color="#ffd21e"
      void-icon="star"
      void-color="#eee"
      readonly
    />
    <van-row>
      当前评分: {{ baseState.ret.score }} 星
    </van-row>
  </div>
<!-- </div> -->
</template>

<style lang="less">
.map-page-container {
  width: 100%;
  height: 100vw;
}
.detail-panel {
  padding-top: 60px;
}
.van-row {
  padding-top: 12px;
  padding-bottom: 4px;
  font-size: 14px;
}
.van-field {
  border-radius: 8px;
}

.van-radio {
  margin-right: 30px;
  font-size: 12px;
}
.van-radio__label {
  color: black;
}
.van-radio__icon--checked .van-icon {
  color: black !important;
  background-color: transparent;
}

.van-radio__icon:not(.van-radio__icon--checked) .van-icon {
  background-color: transparent;
}

.van-checkbox-group {
  display: flex;
  flex-wrap: wrap;
}

.van-checkbox {
  width: calc(50% - 10px); /* (2列布局) */
  margin-bottom: 4px;
}

.van-checkbox__label {
  color: black;
  font-size: 12px;
}

.van-checkbox__icon--checked .van-icon {
  color: black !important;
  background-color: transparent;
}

.van-checkbox__icon:not(.van-checkbox__icon--checked) .van-icon {
  background-color: transparent;
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
