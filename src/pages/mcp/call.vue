<script setup lang="ts">
// 注释设置代码规范
/* eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
import { callTool, listTools } from '@/utils/presenter/mcpPresenter/client'
import { showNotify } from 'vant'
import type { CascaderOption } from 'vant'
import type { McpTool, McpToolOperation, McpVariable, property } from '@/utils/shared/presenter'
import useMcpStore from '@/stores/modules/mcp'
import _ from 'lodash'

interface StateItem {
  show: boolean
  id: number | string | undefined
  paramIdx: number | string | undefined
  text: string
  tools: McpTool[]
  output: string
  options?: CascaderOption[]
  columns: { text: string, value: number }[]
  saveShow: boolean
  showPicker: boolean
  saveDescription: string
  execSuccess: boolean
}

let oldDescription = ''
const toolsParams = ref({})
const toolsDescription = {}
const variables = ref<McpVariable[]>([])

const baseState = ref<StateItem>({
  show: false,
  id: undefined,
  paramIdx: undefined,
  text: '',
  tools: [],
  output: '',
  options: [],
  columns: [],
  saveShow: false,
  showPicker: false,
  saveDescription: '',
  execSuccess: false,
})

function onFinish({ selectedOptions }) {
  let text = ''
  for (const option of selectedOptions) {
    text += option.text
    text += '/'
  }
  text = text.slice(0, -1)
  baseState.value.show = false
  baseState.value.text = text
  baseState.value.output = ''
  baseState.value.saveDescription = ''
  baseState.value.execSuccess = false
}

async function handleExec() {
  if (typeof baseState.value.id !== 'number') {
    return
  }

  const tool = baseState.value.tools[baseState.value.id]
  if (tool.server === '自定义工作流') {
    const workflows = useMcpStore().workflows

    for (const workflow of workflows) {
      if (workflow.id !== tool.id) {
        continue
      }

      for (let i = 0; i < toolsParams.value[baseState.value.id].length; i++) {
        const operaId = workflow.paramRedefines[i].operaId
        const paramId = workflow.paramRedefines[i].paramId

        for (let j = 0; j < workflow.toolOperations.length; j++) {
          if (workflow.toolOperations[j].id !== operaId) {
            continue
          }

          workflow.toolOperations[j].tool.inputSchema.properties[paramId].value = toolsParams.value[baseState.value.id][i].value
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

          const { c, s } = await callTool(mcp[0], operation.tool.name, params)
          baseState.value.output = c
          baseState.value.execSuccess = s
        }
      }
    }
  }
  else {
    let forName = ''
    let forValue = []
    const params = {}

    const mcp = useMcpStore().mcpConfigs.filter(item => item.name === tool.server)
    for (const param of toolsParams.value[baseState.value.id]) {
      if (param.type === 'string') {
        const str = param?.value as string

        if (str && str.startsWith('[') && str.endsWith(']')) {
          forName = param.name
          forValue = str.slice(1, str.length - 1).split('')
          forValue = forValue.filter(item => item !== ',')
        }
        else {
          params[param.name] = param.value
        }
      }
      else if (param.type === 'number') {
        params[param.name] = Number(param.value)
      }
      else {
        params[param.name] = param.value
      }
    }

    for (let i = -1; i < forValue.length; i++) {
      if (i > -1) {
        params[forName] = forValue[i]
      }

      if (i === -1 && forValue.length > 0) {
        continue
      }

      const { c, s } = await callTool(mcp[0], tool.name, params)
      baseState.value.output = c
      baseState.value.execSuccess = s
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
    showNotify({ type: 'danger', message: '请输入操作描述' })
    return
  }

  const properties: property[] = []
  for (const param of toolsParams.value[baseState.value.id]) {
    if (!_.identity(param.value)) {
      continue
    }

    properties.push(_.cloneDeep(param))
  }

  const tool = baseState.value.tools[baseState.value.id]
  const operation: McpToolOperation = {
    id: _.uniqueId(),
    tool: {
      id: tool.id,
      name: tool.name,
      server: tool.server,
      description: tool.description,
      inputSchema: {
        type: tool.inputSchema.type,
        properties,
      },
    },
    description: baseState.value.saveDescription,
  }

  useMcpStore().pushOp(operation)
  baseState.value.saveDescription = ''
  showNotify({ type: 'success', message: '保存成功' })
}

function handleShowVars(index: number) {
  baseState.value.paramIdx = index
  baseState.value.showPicker = true
}

function handleChooseVar({ selectedValues }) {
  const selected = variables.value.filter(item => item.id === selectedValues[0])
  if (selected.length > 0) {
    for (let i = 0; i < toolsParams.value[baseState.value.id].length; i++) {
      if (i === baseState.value.paramIdx) {
        if (selected[0].handleMethod === 'none') {
          toolsParams.value[baseState.value.id][i].value = selected[0].value
        }
        else if (selected[0].handleMethod === 'word-splite') {
          toolsParams.value[baseState.value.id][i].value = `[${selected[0].value.split('')}]`
        }
        else {
          // else
        }
        break
      }
    }
  }

  baseState.value.showPicker = false
}

async function init() {
  let i = 0
  const mcps = useMcpStore().mcpConfigs
  for (const mcp of mcps) {
    const tools = mcp.url ? await listTools(mcp) : useMcpStore().tools
    baseState.value.tools.push(..._.cloneDeep(tools))
  }

  for (const mcp of mcps) {
    baseState.value.options.push({
      text: mcp.name,
      value: mcp.name,
      children: [],
    })

    baseState.value.tools.forEach((val, idx) => {
      if (val.server !== mcp.name) {
        return
      }

      baseState.value.options[i].children.push({
        text: val.name,
        value: idx,
      })

      toolsDescription[idx] = val.description

      const properties = []
      for (const property of val.inputSchema.properties) {
        properties.push({
          name: property.name,
          type: property.type,
          value: property.value,
          required: property.required,
          description: property.description,
        })
      }
      toolsParams.value[idx] = properties
    })
    i++
  }

  variables.value = []
  const cacheVars = useMcpStore().mcpVariables
  variables.value.push(..._.cloneDeep(cacheVars))
  baseState.value.columns = variables.value.map((item) => {
    return { text: item.name, value: item.id }
  })
}

onBeforeMount(() => {
  init()
})
</script>

<template>
  <DemoBlock card title="选择 mcp tool">
    <van-cell-group inset>
      <van-field
        v-model="baseState.text"
        is-link
        readonly
        label="tool"
        placeholder="请选择 tool"
        @click="baseState.show = true"
      />
      <van-popup
        v-model:show="baseState.show"
        round
        teleport="body"
        position="bottom"
      >
        <van-cascader
          v-model="baseState.id"
          :show-header="true"
          title="mcp tool"
          :options="baseState.options"
          @close="baseState.show = false"
          @finish="onFinish"
        />
      </van-popup>
      <van-cell v-if="toolsDescription[baseState.id]" :value="toolsDescription[baseState.id]" value-class="text-align-left" />
    </van-cell-group>
  </DemoBlock>

  <DemoBlock v-if="toolsDescription[baseState.id]" card title="输入 tool 参数">
    <van-cell-group inset>
      <div v-for="(item, index) in toolsParams[baseState.id]" :key="index">
        <van-field
          :key="index"
          v-model="item.value"
          :required="item.required"
          :value="item.value"
          clearable
          :name="item.name"
          :label="item.name"
          @click-right-icon="handleShowVars(index)"
        >
          <template #right-icon>
            <div style="cursor: pointer;">
              <van-icon name="more-o" />
            </div>
          </template>
        </van-field>
        <van-cell :value="item.description" value-class="text-align-left" />
      </div>
    </van-cell-group>

    <div style="margin: 16px;">
      <van-button round block type="primary" native-type="submit" @click="handleExec">
        执行
      </van-button>
    </div>
  </DemoBlock>

  <DemoBlock v-if="toolsDescription[baseState.id]" card title="返回参数">
    <van-cell :value="baseState.output" value-class="text-align-left" />
    <div v-if="baseState.execSuccess" style="margin: 16px;">
      <van-button round block type="primary" native-type="submit" @click="handleSave">
        保存操作
      </van-button>
    </div>
  </DemoBlock>

  <van-dialog v-model:show="baseState.saveShow" show-cancel-button @open="handleOpen" @cancel="handleCancel" @confirm="handleConfirm">
    <van-cell-group inset>
      <van-field v-model="baseState.saveDescription" placeholder="输入操作描述" />
    </van-cell-group>
  </van-dialog>

  <van-popup
    v-model:show="baseState.showPicker"
    round
    teleport="body"
    position="bottom"
  >
    <van-picker
      title="变量选项"
      :columns="baseState.columns"
      @cancel="baseState.showPicker = false"
      @confirm="handleChooseVar"
    />
  </van-popup>
</template>

<route lang="json5">
{
  name: 'mcp/call',
  meta: {
    title: '🔧 执行mcp工具',
    i18n: 'menus.mcpCall'
  },
}
</route>

<style lang="less">
.mcp-container {
  display: flex;
  flex-direction: column;
  height: 500px;
}

.mcp-tools-container {
  flex: 1 1 0%;
}

.mcp-tools-playground-container {
  flex: none;
  position: relative;
}

.text-align-left {
  text-align: left;
}
</style>
