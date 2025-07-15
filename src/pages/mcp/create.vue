<script setup lang="ts">
// todo workflow 添加删除的操作
import useMcpStore from '@/stores/modules/mcp'
import type { McpToolOperation, ParamRedefine, property, Workflow } from '@/utils/shared/presenter'

interface StateItem {
  id: string
  text: string
  show: boolean
  showPicker: boolean
  columns: { text: string, value: string }[]
  wf: Workflow
  opItem: McpToolOperation
  toolDesc: string
  properties: property[]
  operationDesc: string
}

const baseState = ref<StateItem>({
  id: '',
  text: '',
  show: false,
  showPicker: false,
  columns: [],
  wf: null,
  opItem: undefined,
  toolDesc: '',
  properties: [],
  operationDesc: '',
})

function handleChooseWf({ selectedValues }) {
  const selected = baseState.value.columns.filter(item => item.value === selectedValues[0])
  if (selected.length > 0) {
    baseState.value.wf = useMcpStore().getWf(selected[0].value)
    baseState.value.text = baseState.value.wf ? baseState.value.wf.name : ''
  }

  baseState.value.showPicker = false
}

function handleShow(item: McpToolOperation) {
  baseState.value.id = `${item.tool.server}/${item.tool.name}`
  baseState.value.show = true
  baseState.value.opItem = item
  baseState.value.operationDesc = item.description
  baseState.value.toolDesc = item.tool.description
  baseState.value.properties = item.tool.inputSchema.properties
}

function handleClickParam(index: number) {
  for (const param of baseState.value.wf.paramRedefines) {
    if (param.operaId === baseState.value.opItem.id && param.paramId === index) {
      return
    }
  }

  const property = baseState.value.properties[index]
  baseState.value.wf.paramRedefines.push({
    operaId: baseState.value.opItem.id,
    operaName: baseState.value.opItem.description,
    paramId: index,
    paramName: property.name,
    reDefineName: '',
  })
}

function handleDelete(param: ParamRedefine) {
  baseState.value.wf.paramRedefines = baseState.value.wf.paramRedefines.filter(item => item.operaId !== param.operaId || item.paramId !== param.paramId)
}

// todo 添加 workflow 修改名称的功能
function handleSave() {
  baseState.value.wf.paramRedefines = baseState.value.wf.paramRedefines.filter(item => item.reDefineName !== '')
  // useMcpStore().editWf(baseState.value.wf)
  useMcpStore().workflowToTool(toRaw(baseState.value.wf))
  showNotify({ type: 'success', message: `操作成功` })
}

function init() {
  baseState.value.columns = useMcpStore().workflows.map((item) => {
    return { text: item.name, value: item.id }
  })
}

onBeforeMount(() => {
  init()
})
</script>

<template>
  <DemoBlock card title="创建mcp工具">
    <van-cell-group inset>
      <van-field
        v-model="baseState.text"
        is-link
        readonly
        label="工作流"
        placeholder="请选择工作流"
        @click="baseState.showPicker = true"
      />
      <van-popup
        v-model:show="baseState.showPicker"
        round
        teleport="body"
        position="bottom"
      >
        <van-picker
          title="工作流选项"
          :columns="baseState.columns"
          @cancel="baseState.showPicker = false"
          @confirm="handleChooseWf"
        />
      </van-popup>
    </van-cell-group>
  </DemoBlock>
  <DemoBlock v-if="baseState.text !== ''" card title="提取参数">
    <van-cell-group inset>
      <van-swipe-cell v-for="(item, index) in baseState.wf.toolOperations" :key="index">
        <van-field
          :label="item.description"
          is-link
          readonly
          @click="handleShow(item)"
        />
      </van-swipe-cell>
    </van-cell-group>
  </DemoBlock>

  <DemoBlock v-if="baseState.text !== '' && baseState.wf.paramRedefines.length > 0" card title="参数定义">
    <van-cell-group inset>
      <van-swipe-cell v-for="(item, index) in baseState.wf.paramRedefines" :key="index">
        <van-field :key="index" v-model="item.reDefineName" :label="item.paramName" placeholder="请输入参数描述" />
        <template #right>
          <van-button square text="删除" type="danger" @click="handleDelete(item)" />
        </template>
      </van-swipe-cell>
    </van-cell-group>
  </DemoBlock>

  <DemoBlock v-if="baseState.text !== '' && baseState.wf.paramRedefines.length > 0" card title="新工具如下">
    <van-cell-group inset>
      <van-cell :title="baseState.wf.name" />
      <van-cell v-for="(item, index) in baseState.wf.paramRedefines" :key="index" :title="item.reDefineName" />
    </van-cell-group>
    <div style="margin: 16px;">
      <van-button round block type="primary" native-type="submit" @click="handleSave">
        保存
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
    <DemoBlock card :title="baseState.operationDesc">
      <van-cell-group inset>
        <van-field
          v-model="baseState.id"
          readonly
        />
        <van-cell :value="baseState.toolDesc" value-class="text-align-left" />

        <div v-for="(item, index) in baseState.properties" :key="index">
          <van-field v-model="item.value" :label="item.name" readonly @click-right-icon="handleClickParam(index)">
            <template #right-icon>
              <div style="cursor: pointer;">
                <van-icon name="plus" />
              </div>
            </template>
          </van-field>

          <van-cell :value="item.description" value-class="text-align-left" />
        </div>
      </van-cell-group>
    </DemoBlock>
  </van-popup>
</template>

<route lang="json5">
{
  name: 'mcp/create',
  meta: {
    title: '🔧 创建mcp工具',
    i18n: 'menus.mcpCreate'
  },
}
</route>

<style lang="less">
.text-align-left {
  text-align: left;
}
</style>
