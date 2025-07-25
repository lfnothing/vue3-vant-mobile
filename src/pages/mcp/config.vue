<script setup lang="ts">
// 注释设置代码规范
/* eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */

import { showNotify } from 'vant'
import _ from 'lodash'
import useMcpStore from '@/stores/modules/mcp'
import useMcpBakStore from '@/stores/modules/mcpBak'
import type { McpBak } from '@/utils/shared/presenter'
import dayjs from 'dayjs'

interface StateItem {
  backup: McpBak
  show: boolean
  title: string
  showTimestamp: string
}

const baseState = ref<StateItem>({
  backup: {
    id: '',
    name: '',
    timestamp: 0,
    configs: [],
    variables: [],
    toolOperations: [],
    toolOperationDefines: [],
    workflows: [],

  },
  show: false,
  title: '',
  showTimestamp: '',

})

const backups = ref<McpBak[]>([])

function init() {
  backups.value = useMcpBakStore().mcpBaks
}

onBeforeMount(() => {
  init()
})

function handleShow(item: McpBak) {
  baseState.value.backup.id = item.id
  baseState.value.backup.timestamp = item.timestamp
  baseState.value.showTimestamp = dayjs(baseState.value.backup.timestamp).format('YYYY-MM-DD HH:mm:ss')
  baseState.value.backup.name = item.name
  baseState.value.backup.configs = _.cloneDeep(item.configs)
  baseState.value.backup.variables = _.cloneDeep(item.variables)
  baseState.value.backup.toolOperations = _.cloneDeep(item.toolOperations)
  baseState.value.backup.toolOperationDefines = _.cloneDeep(item.toolOperationDefines)
  baseState.value.backup.workflows = _.cloneDeep(item.workflows)
  baseState.value.show = true
  baseState.value.title = '配置详情'
}

function handleAdd() {
  baseState.value.backup.id = ''
  baseState.value.backup.name = ''
  baseState.value.backup.configs = []
  baseState.value.backup.timestamp = Date.now()
  baseState.value.backup.variables = []
  baseState.value.backup.toolOperations = []
  baseState.value.backup.toolOperationDefines = []
  baseState.value.backup.workflows = []

  baseState.value.show = true
  baseState.value.title = '添加配置'
}

function handleClean() {
  showConfirmDialog({
    title: '清空配置',
    message:
    '确定要清空所有配置吗？',
  })
    .then(() => {
      useMcpStore().clean()
      init()
      showNotify({ type: 'success', message: '清空成功' })
    })
    .catch(() => {
      showNotify({ type: 'warning', message: '操作已取消' })
    })
}

function handleDelete(backup: McpBak) {
  console.log(toRaw(backups.value))
  useMcpBakStore().delBak(backup.id)
  init()
  console.log(toRaw(backups.value))
  showNotify({ type: 'success', message: '删除成功' })
}

function handleRecover() {
  useMcpStore().recover(
    baseState.value.backup.configs,
    baseState.value.backup.variables,
    baseState.value.backup.toolOperations,
    baseState.value.backup.toolOperationDefines,
    baseState.value.backup.workflows,
  )
  baseState.value.title = '配置详情'
  showNotify({ type: 'success', message: '还原成功' })
}
//

function handleSave() {
  // 自动生成信息
  baseState.value.backup.id = crypto.randomUUID()
  baseState.value.showTimestamp = dayjs(baseState.value.backup.timestamp).format('YYYY-MM-DD HH:mm:ss')
  // 自动备份其他信息
  baseState.value.backup.configs = _.cloneDeep(useMcpStore().mcpConfigs)
  baseState.value.backup.variables = _.cloneDeep(useMcpStore().mcpVariables)
  baseState.value.backup.toolOperations = _.cloneDeep(useMcpStore().mcpToolOperations)
  baseState.value.backup.toolOperationDefines = _.cloneDeep(useMcpStore().mcpToolOperationDefines)
  baseState.value.backup.workflows = _.cloneDeep(useMcpStore().workflows)
  useMcpBakStore().pushBak(_.cloneDeep(baseState.value.backup))
  init()
  showNotify({ type: 'success', message: '操作成功' })
}
</script>

<template>
  <DemoBlock card title="配置列表">
    <van-cell-group inset>
      <van-swipe-cell v-for="item in backups" :key="item.id">
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
      <van-button round block type="danger" @click="handleClean">
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
          :readonly="baseState.title === '配置详情'"
        />
        <van-field
          v-if="baseState.title === '配置详情'"
          v-model="baseState.showTimestamp"
          label="时间"
          readonly
        />
      </van-cell-group>
      <div style="margin: 16px;">
        <van-button v-if="baseState.title === '添加配置'" round block type="primary" native-type="submit" @click="handleSave">
          保存
        </van-button>

        <van-button v-if="baseState.title === '配置详情'" round block type="success" native-type="submit" @click="handleRecover">
          还原
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
