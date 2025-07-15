<script setup lang="ts">
import _ from 'lodash'
import useMcpStore from '@/stores/modules/mcp'
import type { McpToolOperation, property } from '@/utils/shared/presenter'

const operations = ref<McpToolOperation[]>([])

interface StateItem {
  id: string
  show: boolean
  toolDesc: string
  operationDesc: string
  properties: property[]
}

const baseState = ref<StateItem>({
  id: '',
  show: false,
  properties: [],
  toolDesc: '',
  operationDesc: '',
})

function handleShow(item: McpToolOperation) {
  baseState.value.id = `${item.tool.server}/${item.tool.name}`
  baseState.value.show = true
  baseState.value.operationDesc = item.description
  baseState.value.toolDesc = item.tool.description
  baseState.value.properties = item.tool.inputSchema.properties
}

function handleDelete(item: McpToolOperation) {
  useMcpStore().deleteOp(item.id)
  init()
}

function init() {
  operations.value = []
  const cache = useMcpStore().mcpToolOperations
  operations.value.push(..._.cloneDeep(cache))
}

onBeforeMount(() => {
  init()
})
</script>

<template>
  <DemoBlock v-if="operations.length !== 0" card title="管理操作">
    <van-cell-group inset>
      <van-swipe-cell v-for="(item, index) in operations" :key="index">
        <van-field
          :label="item.description"
          is-link
          readonly
          @click="handleShow(item)"
        />
        <template #right>
          <van-button square text="删除" type="danger" @click="handleDelete(item)" />
        </template>
      </van-swipe-cell>
    </van-cell-group>
  </DemoBlock>

  <van-popup
    v-model:show="baseState.show"
    round
    teleport="body"
    position="bottom"
    closeable
  >
    <DemoBlock card :title="baseState.operationDesc">
      <van-cell-group inset>
        <van-field
          v-model="baseState.id"
          readonly
        />
        <van-cell :value="baseState.toolDesc" value-class="text-align-left" />

        <div v-for="(item, index) in baseState.properties" :key="index">
          <van-field v-model="item.value" :label="item.name" />
          <van-cell :value="item.description" value-class="text-align-left" />
        </div>
      </van-cell-group>
    </DemoBlock>
  </van-popup>
</template>

<route lang="json5">
{
  name: 'mcp/operation/list',
  meta: {
    title: '🤔️ mcp操作列表',
    i18n: 'menus.mcpOperationList'
  },
}
</route>

<style lang="less">
.text-align-left {
  text-align: left;
}
</style>
