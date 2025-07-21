import { defineStore } from 'pinia'
import type { McpBak } from '@/utils/shared/presenter'

const useMcpBakStore = defineStore('mcpBak', () => {
  const mcpBaks = ref<McpBak[]>([])

  // 添加配置
  const pushBak = (bak: McpBak) => {
    mcpBaks.value.push(bak)
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
