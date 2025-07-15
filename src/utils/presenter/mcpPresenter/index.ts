import type {
  McpToolDefinition,
} from '@/utils/shared/presenter'
import { getClientsInfo } from './client'
import type { Client } from '@modelcontextprotocol/sdk/client/index.js'
import type { ListToolsResult } from '@modelcontextprotocol/sdk/types.js'

// 定义MCP工具接口
interface MCPTool {
  id: string
  name: string
  type: string
  description: string
  serverName: string
  inputSchema: {
    properties: Record<string, Record<string, unknown>>
    required: string[]
    [key: string]: unknown
  }
}

// 定义工具转换接口
interface OpenAITool {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: {
      type: string
      properties: Record<string, Record<string, unknown>>
      required: string[]
    }
  }
}

// 列出可用工具
async function listTools(client: Client): Promise<ListToolsResult> {
  try {
    const response = await client.listTools()
    // 检查响应格式
    if (response && typeof response === 'object' && 'tools' in response) {
      return response
    }
    throw new Error('无效的工具响应格式')
  }
  catch (error) {
    console.error(`列出MCP工具失败:`, error)
    throw error
  }
}

// 调用工具
export async function callTool(name: string, args: { [x: string]: unknown }): Promise<string> {
  let content: string = ''
  const clients = getClientsInfo()

  if (!clients) {
    return content
  }

  for (const client of clients) {
    try {
      const tools = (await listTools(client.client)).tools

      if (!tools)
        continue

      for (const tool of tools) {
        if (tool.name !== name) {
          continue
        }

        const response = await client.client.callTool({ name, arguments: args })
        // 检查响应格式
        if (!response.isError && 'content' in response && Array.isArray(response.content) && response.content.length !== 0) {
          content = response.content[0]?.text
        }

        throw new Error('mcp 工具函数返回失败')
      }
    }
    catch (error) {
      console.error(`mcp 工具函数调用失败:`, error)
    }
  }

  return content
}

// 新增工具转换方法
/**
 * 将MCP工具定义转换为OpenAI工具格式
 * @param mcpTools MCP工具定义数组
 * @param serverName 服务器名称
 * @returns OpenAI工具格式的工具定义
 */
export async function mcpToolsToOpenAITools(
  mcpTools: McpToolDefinition[],
  serverName: string,
): Promise<OpenAITool[]> {
  const openaiTools: OpenAITool[] = mcpTools.map((toolDef) => {
    const tool = mcpToolDefinitionToMcpTool(toolDef, serverName)
    return {
      type: 'function',
      function: {
        id: tool.id,
        name: tool.name,
        description: tool.description,
        parameters: {
          type: 'object',
          properties: this.filterPropertieAttributes(tool),
          required: tool.inputSchema.required || [],
        },
      },
    }
  })
  // console.log('openaiTools', JSON.stringify(openaiTools))
  return openaiTools
}

// 将MCPToolDefinition转换为MCPTool
function mcpToolDefinitionToMcpTool(
  toolDefinition: McpToolDefinition,
  serverName: string,
): MCPTool {
  const mcpTool = {
    id: toolDefinition.function.name,
    name: toolDefinition.function.name,
    type: toolDefinition.type,
    description: toolDefinition.function.description,
    serverName,
    inputSchema: {
      properties: toolDefinition.function.parameters.properties as Record<
        string,
        Record<string, unknown>
      >,
      type: toolDefinition.function.parameters.type,
      required: toolDefinition.function.parameters.required,
    },
  } as MCPTool
  return mcpTool
}
