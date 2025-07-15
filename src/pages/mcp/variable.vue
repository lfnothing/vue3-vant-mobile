<script setup lang="ts">
import useMcpStore from '@/stores/modules/mcp'
import type { McpVariable } from '@/utils/shared/presenter'

interface StateItem {
  var: McpVariable
  show: boolean
  title: string
}

const baseState = ref<StateItem>({
  var: {
    id: 0,
    name: '',
    value: '',
    handleMethod: 'none',
  },
  show: false,
  title: '',
})

const vars = ref<McpVariable[]>([])

function init() {
  vars.value = useMcpStore().mcpVariables
}

onBeforeMount(() => {
  init()
})

function handleShow(item: McpVariable) {
  baseState.value.var.id = item.id
  baseState.value.var.name = item.name
  baseState.value.var.value = item.value
  baseState.value.var.handleMethod = item.handleMethod
  baseState.value.show = true
  baseState.value.title = '编辑变量'
}

function handleAdd() {
  baseState.value.var.id = 0
  baseState.value.var.name = ''
  baseState.value.var.value = ''
  baseState.value.var.handleMethod = 'none'
  baseState.value.show = true
  baseState.value.title = '添加变量'
}

function handleDelete(v: McpVariable) {
  useMcpStore().deleteVar(v)
  init()
  showNotify({ type: 'success', message: '删除成功' })
}

function handleSave() {
  if (baseState.value.title === '编辑变量') {
    useMcpStore().editVar(baseState.value.var)
    init()
    showNotify({ type: 'success', message: '操作成功' })
  }
  else if (baseState.value.title === '添加变量') {
    useMcpStore().pushVar(baseState.value.var)
    init()
    showNotify({ type: 'success', message: '操作成功' })
  }
}
</script>

<template>
  <DemoBlock card title="变量定义">
    <van-cell-group inset>
      <van-swipe-cell v-for="(item, index) in vars" :key="index">
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
          v-model="baseState.var.name"
          label="名称"
        />
        <van-field
          v-model="baseState.var.value"
          label="值"
        />

        <van-field name="radio" label="值处理方式">
          <template #input>
            <van-radio-group v-model="baseState.var.handleMethod" direction="horizontal">
              <van-radio name="none">
                不处理
              </van-radio>
              <van-radio name="word-splite">
                按字母分割
              </van-radio>
            </van-radio-group>
          </template>
        </van-field>
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
    name: 'mcp/variable',
    meta: {
        title: '🔧 mcp变量定义',
        i18n: 'menus.mcpVariable'
    }
}
</route>
