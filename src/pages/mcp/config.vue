<script setup lang="ts">
import { showNotify } from 'vant'
import useMcpStore from '@/stores/modules/mcp'
import type { McpConfig } from '@/utils/shared/presenter'

interface StateItem {
  config: McpConfig
  show: boolean
  title: string
}

const baseState = ref<StateItem>({
  config: {
    id: 0,
    url: '',
    name: '',
  },
  show: false,
  title: '',
})

const configs = ref<McpConfig[]>([])

function init() {
  configs.value = useMcpStore().mcpConfigs
}

onBeforeMount(() => {
  init()
})

function handleShow(item: McpConfig) {
  baseState.value.config.id = item.id
  baseState.value.config.url = item.url
  baseState.value.config.name = item.name
  baseState.value.show = true
  baseState.value.title = '编辑配置'
}

function handleAdd() {
  baseState.value.config.id = 0
  baseState.value.config.url = ''
  baseState.value.config.name = ''
  baseState.value.show = true
  baseState.value.title = '添加配置'
}

function handleDelete(config: McpConfig) {
  useMcpStore().deleteCf(config)
  init()
  showNotify({ type: 'success', message: '删除成功' })
}

function handleSave() {
  if (baseState.value.title === '编辑配置') {
    useMcpStore().editCf(baseState.value.config)
    init()
    showNotify({ type: 'success', message: '操作成功' })
  }
  else if (baseState.value.title === '添加配置') {
    useMcpStore().pushCf(baseState.value.config)
    init()
    showNotify({ type: 'success', message: '操作成功' })
  }
}
</script>

<template>
  <DemoBlock card title="配置操作">
    <van-cell-group inset>
      <van-swipe-cell v-for="(item, index) in configs" :key="index">
        <van-field
          v-model="item.name"
          is-link
          readonly
          @click="handleShow(item)"
        />
        <template #right>
          <van-button square text="删除" type="danger" @click="handleDelete(item)" />
        </template>
      </van-swipe-cell>
    </van-cell-group>
    <div style="margin: 16px;">
      <van-button round block type="primary" native-type="submit" @click="handleAdd">
        添加
      </van-button>
    </div>
  </DemoBlock>

  <van-popup
    v-model:show="baseState.show"
    round
    teleport="body"
    position="bottom"
    closeable
  >
    <DemoBlock card :title="baseState.title">
      <van-cell-group inset>
        <van-field
          v-model="baseState.config.name"
          label="名称"
        />
        <van-field
          v-model="baseState.config.url"
          label="地址"
        />
      </van-cell-group>
      <div style="margin: 16px;">
        <van-button round block type="primary" native-type="submit" @click="handleSave">
          保存
        </van-button>
      </div>
    </DemoBlock>
  </van-popup>
</template>

<route lang="json5">
{
    name: 'mcp/config',
    meta: {
        title: '👏 配置mcp服务器',
        i18n: 'menus.mcpConfig'
    }
}
</route>
