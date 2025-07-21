import { defineStore } from 'pinia'
import type { McpBak } from '@/utils/shared/presenter'

const useMcpBakStore = defineStore('mcpBak', () => {
  const mcpBak = ref<McpBak[]>([])

  // 备份 config
  // const backConfig = (configs: McpConfig[]) => {

  // }

  // 备份 variables
  // const backVariables = (variables: McpVariable[]) => {

  // }

  //

  // 设置备份名称
  // const setBackName = (name: string) => {

  // }

  // 设置备份时间
  // const setBackTimestamp = (timestamp: int) => {

  // }

  // 设置备份
  // const backUp = (name: string, configs: McpConfig[], variables: McpVariable[], tools: McpTool[], toolOperations: McpToolOperation[], workflows: Workflow[]) => {
  //   setBackName('1')
  //   backConfig(configs)
  //   backVariables(variables)

  //   // ...
  //   setBackTimestamp(11)
  // }

  return {
    mcpBak,
    // backUp,
  }
}, {
  persist: true,
})

export default useMcpBakStore
