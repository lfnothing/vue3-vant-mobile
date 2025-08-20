<script lang="ts" setup>
// 注释设置代码规范
/* eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */

import { ref } from 'vue'
import { ElAmap, lazyAMapApiLoaderInstance, useGeolocation } from '@vuemap/vue-amap'
import type { ElAmapInstance } from '@vuemap/vue-amap'
import { queryValuation } from '@/api/amaps'
import { showToast } from 'vant'
import markdownit from 'markdown-it'

interface StateItem {
  zoom: number
  center: [number, number]
  position: [number, number]
  markerVisible: boolean
  markDraggable: boolean
  ret: any
  retAI: any
  isloading: boolean
  isAIloading: boolean

  displayText: string // 当前显示的文字
  typingIndex: number // 当前打字位置
  typingDelta: number // 打字时间间隔，单位（毫秒)
  typingInterval: any // 打字周期性执行器

  autoScroll: boolean // 是否自动滚到底
}

const baseState = ref<StateItem>({
  zoom: 12,
  center: [116.397428, 39.90923],
  position: [116.397428, 39.90923],
  markerVisible: true,
  markDraggable: true,
  ret: null,
  retAI: '',
  isloading: false,
  isAIloading: false,

  displayText: '',
  typingIndex: 0,
  typingDelta: 60,
  typingInterval: null,
  autoScroll: true, // 用户手动往上滑了为false停止自动滚
})

// 这样就可以获取到ElAmap的组件实例类型
const mapRef = ref<ElAmapInstance>(null)
const showInfoWindow = ref(false)
const showReportPopup = ref(false)
const hasReportGenerated = ref(false)
const reportScroll = ref<HTMLElement>()

function init(map: AMap.Map) {
  console.log('map init: ', map)
}

function handleDragend(eve: any) {
  baseState.value.position = eve.lnglat.toArray()
  baseState.value.center = eve.lnglat.toArray()
}

function handleMapClick() {
  baseState.value.isloading = true
  // 1. 重新获取就又变回生成报告按钮
  // 2. 显示信息也清空
  hasReportGenerated.value = false
  showReportPopup.value = false
  // 清空ai 清空显示的内容 打字位置归0 清理定时器
  baseState.value.retAI = ''
  baseState.value.displayText = ''
  baseState.value.typingIndex = 0
  // 是否存在定时器 存在就停止 再清空
  if (baseState.value.typingInterval) {
    clearInterval(baseState.value.typingInterval)
    baseState.value.typingInterval = null
  }
  queryValuation(baseState.value.position.join(',')).then((res) => {
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

function handleReportClick() {
  // 要把按钮为真直接显示
  if (hasReportGenerated.value) {
    showReportPopup.value = true
    return
  }
  const source = new EventSource(`http://raspberrypi.local:3001/api/v1/shop/valuationByAI/stream?location=${baseState.value.position.join(',')}`)
  source.onmessage = (e) => {
    if (e.data === '[DONE]') {
      stopTypingText()
      source.close()
      return
    }

    const { delta } = JSON.parse(e.data)
    baseState.value.retAI += delta
  }
  startTypingText()
  showReportPopup.value = true
  hasReportGenerated.value = true

  nextTick(() => {
    // if (!reportScroll.value) return
    // baseState.value.autoScroll = true
    reportScroll.value.scrollTop = reportScroll.value.scrollHeight // 先滚到底
    // 手动上滑的开关 onscroll回调 位置实时决定 autoScroll 是 true 还是 false
    reportScroll.value.onscroll = () => {
      // 距离底部 ≤20px 视为到底部又开始自动滚动
      baseState.value.autoScroll = reportScroll.value.scrollHeight - reportScroll.value.scrollTop - reportScroll.value.clientHeight <= 20
      //  scrollHeight 总高度  scrollTop 滚动条当前距离顶部的高度  clientHeight 可视区域高度
    }
  })
}

// 开始打字
function startTypingText() {
// 检查是否已经设置了定时器
  if (!baseState.value.typingInterval) {
    baseState.value.typingInterval = setInterval(typingText, baseState.value.typingDelta)
  }
}

// 打字
function typingText() {
  const md = markdownit()
  if (baseState.value.typingIndex < baseState.value.retAI.length) {
    baseState.value.displayText = md.render(baseState.value.retAI.substring(0, baseState.value.typingIndex + 1))
    baseState.value.typingIndex++
    // 打字过程滚动同步
    nextTick(() => {
      if (reportScroll.value && baseState.value.autoScroll) {
        reportScroll.value.scrollTop = reportScroll.value.scrollHeight // 滚动到最新内容
      }
    })

    // 检查是否存在滚动容器
    //   if (reportScroll.value) {
    //     // 存在就调用scrollTo方法
    //     reportScroll.value.scrollTo({
    //       // 表示将滚动条定位到该元素的‌内容总高度‌处(内容最底部)
    //       top: reportScroll.value.scrollHeight,
    //       behavior: 'smooth',
    //     })
    //   }
  }
}

// 睡眠等待
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 停止打字
async function stopTypingText() {
  // 检查打字是否完成
  while (baseState.value.typingIndex < baseState.value.retAI.length) {
    await sleep(baseState.value.typingDelta)
  }
  clearInterval(baseState.value.typingInterval)
  baseState.value.typingInterval = null
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
        <template #icon>
          <div class="i-mdi:shop-edit-outline" />
        </template>
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
      <DemoBlock>最近商圈距离（米）</DemoBlock>
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

    <van-row>
      <van-button
        round type="success" size="large" :loading="baseState.isAIloading" loading-text="加载中..."
        @click="handleReportClick"
      >
        <template #icon>
          <div class="i-tabler:robot" />
        </template>
        <!-- panduan -->
        {{ hasReportGenerated ? '查看已分析报告' : '生成AI文字分析报告' }}
      </van-button>
    </van-row>

    <van-popup
      v-model:show="showReportPopup"
      round
      position="bottom"
      :style="{ height: '70%' }"
    >
      <div class="report-content">
        <van-nav-bar
          title="AI选址分析报告"
        >
          <template #right>
            <van-icon name="cross" style="color:darkgray;font-size:28px" @click="showReportPopup = false" />
          </template>
        </van-nav-bar>
        <div ref="reportScroll" class="markdown-container">
          <span v-html="baseState.displayText" />
        </div>
      </div>
    </van-popup>
  </div>
</template>

<style lang="less">
.markdown-container {
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e6eaed;
  width: auto;
  height: calc(70vh - 50px); /* 要去掉顶部导航的高度 */
  overflow-y: auto;
}
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
.report-content .van-nav-bar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: white;
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
<!-- 修改这个弹出页面自动下滑部分现在随着数据的更新跳到最新出现的一行是需要实现的但是应该再修改满足数据生成下滑到底部的同时我也可以自己进行上滑操作看之前的数据这个时候底部的数据仍然保持更新 用最简单的方式实现可以修改方法 -->
