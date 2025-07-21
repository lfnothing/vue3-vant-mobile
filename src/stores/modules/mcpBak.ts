import { defineStore } from 'pinia'
import type { McpBak, McpConfig, McpToolOperation, McpVariable, Workflow } from '@/utils/shared/presenter'

const useMcpBakStore = defineStore('mcpBak', () => {
  const mcpBaks = ref<McpBak[]>([])

  // 添加配置
  const pushBak = (name: string, configs: McpConfig[], variables: McpVariable[], toolOperations: McpToolOperation[], toolOperationDefines: McpToolOperation[], workflows: Workflow[]) => {
    mcpBaks.value.push({
      id: '',
      name,
      configs,
      variables,
      toolOperations,
      toolOperationDefines,
      workflows,
      timestamp: 0,
    })
  }

  // 删除配置
  const delBak = (id: string) => {
    mcpBaks.value = mcpBaks.value.filter(item => item.id !== id)
  }

  return {
    mcpBaks,
    pushBak,
    delBak,
  }
}, {
  persist: true,
})

export default useMcpBakStore
