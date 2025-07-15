<script setup lang="ts">
import { routeWhiteList } from '@/config/routes'
// import { useTouch } from '@/composables/use-touch'
// import { useEventListener } from '@vant/use'

const route = useRoute()
// const touch = useTouch()
const router = useRouter()

function onBack() {
  if (window.history.state.back)
    history.back()
  else
    router.replace('/')
}

const { t } = useI18n()

const title = computed(() => {
  if (!route.meta)
    return ''

  return route.meta.i18n ? t(route.meta.i18n) : (route.meta.title || '')
})

const showLeftArrow = computed(() => route.name && routeWhiteList.includes(route.name))

// 滑动事件监听还有问题
// function onTouchMove(event: TouchEvent) {
//   touch.start(event)

//   touch.move(event)

//   if (!showLeftArrow.value && !touch.isTap.value) {
//     event.preventDefault()
//     onBack()
//   }
// }

// useEventListener('touchmove', onTouchMove)
</script>

<template>
  <!--
    title               标题
    fixed               是否固定在顶部
    clickable           是否开启两侧按钮的点击反馈
    placeholder         固定在顶部时，是否在标签位置生成一个等高的占位元素
    safe-area-inset-top 开启顶部安全区适配

    todo van-clearfix   清除浮动未生效
  -->
  <VanNavBar
    :title="title"
    :left-arrow="!showLeftArrow"
    clickable safe-area-inset-top placeholder fixed
    class="van-clearfix"
    @click-left="onBack"
  />
</template>
