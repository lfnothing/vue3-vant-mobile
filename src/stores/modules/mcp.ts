import { defineStore } from 'pinia'
import type { McpConfig, McpTool, McpToolOperation, McpVariable, property, Workflow } from '@/utils/shared/presenter'

const useMcpStore = defineStore('mcp', () => {
  const mcpConfigs = ref<McpConfig[]>([])
  const mcpVariables = ref<McpVariable[]>([])
  const mcpToolOperations = ref<McpToolOperation[]>([])
  const mcpToolOperationDefines = ref<McpToolOperation[]>([])
  const tools = ref<McpTool[]>([])
  const workflows = ref<Workflow[]>([])

  const pushCf = (config: McpConfig) => {
    mcpConfigs.value.push({
      id: mcpConfigs.value.length + 1,
      name: config.name,
      url: config.url,
    })
  }

  const workflowToTool = (workflow: Workflow) => {
    const defaultName = '自定义工作流'
    if (mcpConfigs.value.filter(item => item.name === defaultName).length === 0) {
      mcpConfigs.value.push({
        id: mcpConfigs.value.length + 1,
        name: defaultName,
        url: '',
      })
    }

    const properties: property[] = []
    for (const param of workflow.paramRedefines) {
      const op = workflow.toolOperations.filter(item => item.id === param.operaId)

      properties.push({
        name: param.reDefineName,
        type: op ? op[0].tool.inputSchema.properties[param.paramId].type : 'unknown',
        value: undefined,
        description: op ? op[0].tool.inputSchema.properties[param.paramId].description : 'unknown',
        // todo 修正 required 赋值
        required: false,
      })
    }

    if (tools.value.filter(item => item.id === workflow.id).length === 0) {
      tools.value.push ({
        id: workflow.id,
        name: workflow.name,
        server: defaultName,
        description: workflow.name,
        inputSchema: {
          type: 'object',
          properties,
        },
      })
    }
    else {
      tools.value.forEach((item) => {
        if (item.id === workflow.id) {
          item.name = workflow.name
          item.description = workflow.name
          item.inputSchema = {
            type: 'object',
            properties,
          }
        }
      })
    }
  }

  const editCf = (config: McpConfig) => {
    mcpConfigs.value.forEach((item) => {
      if (item.id === config.id) {
        item.url = config.url
        item.name = config.name
      }
    })
  }

  const deleteCf = (config: McpConfig) => {
    mcpConfigs.value = mcpConfigs.value.filter(item => item.id !== config.id)
    mcpConfigs.value.forEach((item, index) => {
      if (item.id !== index + 1) {
        item.id = index + 1
      }
    })
  }

  // 清空
  const recoverCf = (configs: McpConfig[]) => {
    mcpConfigs.value = configs
  }

  // 清空
  const cleanCf = () => {
    mcpConfigs.value = []
  }

  const pushVar = (v: McpVariable) => {
    mcpVariables.value.push({
      id: mcpVariables.value.length + 1,
      name: v.name,
      value: v.value,
      handleMethod: v.handleMethod,
    })
  }

  const editVar = (v: McpVariable) => {
    mcpVariables.value.forEach((item) => {
      if (item.id === v.id) {
        item.name = v.name
        item.value = v.value
        item.handleMethod = v.handleMethod
      }
    })
  }

  const deleteVar = (v: McpVariable) => {
    mcpVariables.value = mcpVariables.value.filter(item => item.id !== v.id)
    mcpVariables.value.forEach((item, index) => {
      if (item.id !== index + 1) {
        item.id = index + 1
      }
    })
  }

  const recoverVar = (variables: McpVariable[]) => {
    mcpVariables.value = variables
  }

  const cleanVar = () => {

  }

  const pushOp = (record: McpToolOperation) => {
    mcpToolOperations.value.push(record)
  }

  const pushOpDf = (record: McpToolOperation) => {
    mcpToolOperationDefines.value.push(record)
  }

  const deleteOp = (i: string) => {
    mcpToolOperations.value = mcpToolOperations.value.filter(item => item.id !== i)
  }

  const deleteOpDf = (i: string) => {
    mcpToolOperationDefines.value = mcpToolOperationDefines.value.filter(item => item.id !== i)
  }

  const pushWf = (wf: Workflow) => {
    workflows.value.push(wf)
  }

  const editWf = (wf: Workflow) => {
    workflows.value.forEach((item) => {
      if (item.id === wf.id) {
        item.name = wf.name
      }
    })
  }

  const getWf = (id: string) => {
    const wf = workflows.value.filter(item => item.id === id)
    return wf ? toRaw(wf[0]) : null
  }

  // 清空配置
  const clean = () => {
    cleanCf()
    cleanVar()
    // ...
  }

  // 还原配置
  const recover = (configs: McpConfig[], variables: McpVariable[]) => {
    recoverCf(configs)
    recoverVar(variables)
    // ...
  }

  return {
    mcpConfigs,
    mcpVariables,
    tools,
    workflows,
    workflowToTool,
    pushCf,
    editCf,
    deleteCf,
    pushVar,
    editVar,
    deleteVar,
    mcpToolOperations,
    mcpToolOperationDefines,
    pushOp,
    deleteOp,
    pushOpDf,
    deleteOpDf,
    pushWf,
    editWf,
    getWf,
    clean,
    recover,
  }
}, {
  persist: true,
})

export default useMcpStore
