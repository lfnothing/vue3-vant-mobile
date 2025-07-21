<script setup lang="ts">
import { showNotify } from 'vant'
import _ from 'lodash'
import useMcpStore from '@/stores/modules/mcp'
import useMcpBakStore from '@/stores/modules/mcpBak'
import type { McpBak } from '@/utils/shared/presenter'

interface StateItem {
  backup: McpBak
  show: boolean
  title: string
}

const baseState = ref<StateItem>({
  backup: {
    id: '',
    name: '',
    configs: [],
    timestamp: 0,
  },
  show: false,
  title: '',
})

const backups = ref<McpBak[]>([])

function init() {
  backups.value = useMcpBakStore().mcpBaks
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
  baseState.value.backup.id = ''
  baseState.value.backup.name = ''
  baseState.value.backup.configs = []
  baseState.value.backup.timestamp = 0
  baseState.value.show = true
  baseState.value.title = '添加配置'
}

function handleDelete(config: McpConfig) {
  useMcpStore().deleteCf(config)
  init()
  showNotify({ type: 'success', message: '删除成功' })
}

function handleSave() {
  // if (baseState.value.title === '编辑配置') {
  //   useMcpStore().editCf(baseState.value.config)
  //   init()
  //   showNotify({ type: 'success', message: '操作成功' })
  // }
  // else if (baseState.value.title === '添加配置') {
  //   useMcpStore().pushCf(baseState.value.config)
  //   init()
  //   showNotify({ type: 'success', message: '操作成功' })
  // }

  // 自动生成信息
  baseState.value.backup.id = _.uniqueId()
  baseState.value.backup.timestamp = Date.now()

  // 自动备份其他信息
  baseState.value.backup.configs = _.cloneDeep(useMcpStore().mcpConfigs)

  useMcpBakStore().pushBak(baseState.value.backup)
}
</script>

<template>
  <DemoBlock card title="配置列表">
    <van-cell-group inset>
      <van-swipe-cell v-for="(item, index) in backups" :key="index">
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
      <van-button round block type="danger" native-type="submit" @click="handleAdd">
        清空配置
      </van-button>
    </div>
    <div style="margin: 16px;">
      <van-button round block type="primary" native-type="submit" @click="handleAdd">
        备份配置
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
          v-model="baseState.backup.name"
          label="名称"
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
        title: '👏 mcp配置管理',
        i18n: 'menus.mcpConfig'
    }
}
</route>
