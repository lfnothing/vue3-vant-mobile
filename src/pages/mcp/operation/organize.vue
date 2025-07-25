<script setup lang="ts">
import _ from 'lodash'
import useMcpStore from '@/stores/modules/mcp'
import { callTool } from '@/utils/presenter/mcpPresenter/client'
import type { McpToolOperation, property, Workflow } from '@/utils/shared/presenter'

let oldDescription = ''
const operations = ref<McpToolOperation[]>([])
const defineOperations = ref<McpToolOperation[]>([])

interface StateItem {
  id: string
  show: boolean
  saveShow: boolean
  columns: { text: string, value: string }[]
  toolDesc: string
  showPicker: boolean
  operationDesc: string
  properties: property[]
  saveDescription: string
}

const baseState = ref<StateItem>({
  id: '',
  show: false,
  saveShow: false,
  columns: [],
  showPicker: false,
  properties: [],
  toolDesc: '',
  operationDesc: '',
  saveDescription: '',
})

function handleShow(item: McpToolOperation) {
  baseState.value.id = `${item.tool.server}/${item.tool.name}`
  baseState.value.show = true
  baseState.value.operationDesc = item.description
  baseState.value.toolDesc = item.tool.description
  baseState.value.properties = item.tool.inputSchema.properties
}

function handleDelete(item: McpToolOperation) {
  useMcpStore().deleteOpDf(item.id)
  init()
}

function handlePush({ selectedValues }) {
  const selected = operations.value.filter(item => item.id === selectedValues[0])
  if (selected.length > 0) {
    const value = _.cloneDeep(selected[0])
    value.id = crypto.randomUUID()
    useMcpStore().pushOpDf(value)
  }
  baseState.value.showPicker = false
  init()
}

async function handleExec() {
  for (const operation of defineOperations.value) {
    if (operation.tool.server === '自定义工作流') {
      const workflows = useMcpStore().workflows

      for (const workflow of workflows) {
        if (workflow.id !== operation.tool.id) {
          continue
        }

        for (let i = 0; i < workflow.paramRedefines.length; i++) {
          const operaId = workflow.paramRedefines[i].operaId
          const paramId = workflow.paramRedefines[i].paramId

          for (let j = 0; j < workflow.toolOperations.length; j++) {
            if (workflow.toolOperations[j].id !== operaId) {
              continue
            }

            workflow.toolOperations[j].tool.inputSchema.properties[paramId].value = operation.tool.inputSchema.properties[i].value
          }
        }

        for (const operation of workflow.toolOperations) {
          let forName = ''
          let forValue = []
          const params = {}

          const mcp = useMcpStore().mcpConfigs.filter(item => item.name === operation.tool.server)
          for (const property of operation.tool.inputSchema.properties) {
            if (property.type === 'string') {
              const str = property.value as string

              if (str.startsWith('[') && str.endsWith(']')) {
                forName = property.name
                forValue = str.slice(1, str.length - 1).split('')
                forValue = forValue.filter(item => item !== ',')
              }
              else {
                params[property.name] = property.value
              }
            }
            else {
              params[property.name] = property.value
            }
          }

          for (let k = -1; k < forValue.length; k++) {
            if (k > -1) {
              params[forName] = forValue[k]
            }

            if (k === -1 && forValue.length > 0) {
              continue
            }

            const { s } = await callTool(mcp[0], operation.tool.name, params)
            if (s) {
              showNotify({ type: 'success', message: `操作${operation.description}执行成功` })
            }
            else {
              showNotify({ type: 'danger', message: `操作${operation.description}执行失败` })
            }
          }
        }
      }
    }
    else {
      const params = {}
      const mcp = useMcpStore().mcpConfigs.filter(item => item.name === operation.tool.server)

      let forName = ''
      let forValue = []

      for (const property of operation.tool.inputSchema.properties) {
        if (property.type === 'string') {
          const str = property.value
          if (str && str.startsWith('[') && str.endsWith(']')) {
            forName = property.name
            forValue = str.slice(1, str.length - 1).split('')
            forValue = forValue.filter(item => item !== ',')
          }
          else {
            params[property.name] = property.value
          }
        }
        else if (property.type === 'number') {
          params[property.name] = Number(property.value)
        }
        else if (property.type === 'boolean') {
          params[property.name] = property.value === 'true'
        }
        else {
          params[property.name] = property.value
        }
      }

      for (let i = 0; i < forValue.length + 1; i++) {
        if (forValue.length > 0 && i === forValue.length) {
          break
        }

        if (i < forValue.length) {
          params[forName] = forValue[i]
        }

        const { s } = await callTool(mcp[0], operation.tool.name, params)
        if (s) {
          showNotify({ type: 'success', message: `操作${operation.description}执行成功` })
        }
        else {
          showNotify({ type: 'danger', message: `操作${operation.description}执行失败` })
        }
      }
    }
  }
}

function handleSave() {
  baseState.value.saveShow = true
}

function handleOpen() {
  oldDescription = baseState.value.saveDescription
}

function handleCancel() {
  if (baseState.value.saveDescription === oldDescription) {
    return
  }

  baseState.value.saveDescription = oldDescription
}

function handleConfirm() {
  if (baseState.value.saveDescription === '') {
    showNotify({ type: 'danger', message: '请输入工作流名称' })
    return
  }

  // const toolOperations: McpToolOperation[] = []
  // for (const operation of useMcpStore().mcpToolOperationDefines) {
  //   if (operation.tool.server === '自定义工作流') {
  //     const workflow = useMcpStore().getWf(operation.id)
  //     for(const tool of workflow.toolOperations) {
  //       for(let i = 0; i < workflow.paramRedefines.length;i++) {

  //       }
  //     }
  //   } else {
  //     toolOperations.push(operation)
  //   }
  // }

  const wf: Workflow = {
    id: crypto.randomUUID(),
    name: baseState.value.saveDescription,
    paramRedefines: [],
    toolOperations: _.cloneDeep(useMcpStore().mcpToolOperationDefines),
  }

  useMcpStore().pushWf(wf)
  baseState.value.saveDescription = ''
  showNotify({ type: 'success', message: '保存成功' })
}

function init() {
  operations.value = []
  defineOperations.value = []
  baseState.value.columns = []
  const cacheOp = useMcpStore().mcpToolOperations
  const cacheDf = useMcpStore().mcpToolOperationDefines
  operations.value.push(..._.cloneDeep(cacheOp))
  defineOperations.value.push(..._.cloneDeep(cacheDf))
  baseState.value.columns = operations.value.map((item) => {
    return { text: item.description, value: item.id }
  })
}

onBeforeMount(() => {
  init()
})
</script>

<template>
  <DemoBlock card title="编排操作">
    <van-cell-group inset>
      <van-swipe-cell v-for="(item, index) in defineOperations" :key="index">
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
    <div style="margin: 16px;">
      <van-button round block type="primary" native-type="submit" @click="baseState.showPicker = true">
        添加
      </van-button>
    </div>
    <div v-if="defineOperations.length > 0" style="margin: 16px;">
      <van-button round block type="primary" native-type="submit" @click="handleExec">
        执行
      </van-button>
    </div>
    <div v-if="defineOperations.length > 0" style="margin: 16px;">
      <van-button round block type="primary" native-type="submit" @click="handleSave">
        保存
      </van-button>
    </div>
  </DemoBlock>

  <van-dialog v-model:show="baseState.saveShow" show-cancel-button @open="handleOpen" @cancel="handleCancel" @confirm="handleConfirm">
    <van-cell-group inset>
      <van-field v-model="baseState.saveDescription" placeholder="输入工作流名称" />
    </van-cell-group>
  </van-dialog>

  <van-popup
    v-model:show="baseState.showPicker"
    round
    teleport="body"
    position="bottom"
  >
    <van-picker
      title="操作选项"
      :columns="baseState.columns"
      @cancel="baseState.showPicker = false"
      @confirm="handlePush"
    />
  </van-popup>

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
          <van-field v-model="item.value" :label="item.name" readonly />
          <van-cell :value="item.description" value-class="text-align-left" />
        </div>
      </van-cell-group>
    </DemoBlock>
  </van-popup>
</template>

<route lang="json5">
{
  name: 'mcp/operation/organize',
  meta: {
    title: '🔧 mcp操作编排',
    i18n: 'menus.mcpOperationOrganize'
  },
}
</route>
