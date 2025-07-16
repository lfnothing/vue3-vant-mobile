// 注释设置代码规范
/* eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */

import _ from 'lodash'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import type { CallToolRequest, ListToolsRequest } from '@modelcontextprotocol/sdk/types.js'
import { CallToolResultSchema, ListResourcesResultSchema, ListToolsResultSchema, LoggingMessageNotificationSchema, ResourceListChangedNotificationSchema } from '@modelcontextprotocol/sdk/types.js'
import type { McpConfig, McpTool, property } from '@/utils/shared/presenter'

interface ClientInfo {
  mcp: string | null
  client: Client | null
  sessionId: string | undefined
  transport: StreamableHTTPClientTransport | null
}

// Track received notifications for debugging resumability
let notificationCount = 0
let client: { [key: string]: ClientInfo }
let notificationsToolLastEventId: string | undefined

async function connect(config: McpConfig): Promise<void> {
  const mcp = config.name
  const serverUrl = config.url

  if (!client) {
    client = {}
  }

  if (client && mcp in client && client[mcp].client) {
    console.log('Already connected. Disconnect first.')
    return
  }

  console.log(`Connecting to ${serverUrl}...`)

  try {
    // Create a new client
    client[mcp] = {
      mcp,
      client: new Client({
        name: 'mcp-client',
        version: '1.0.0',
      }),
      transport: null,
      sessionId: undefined,
    }
    client[mcp].client.onerror = (error) => {
      console.error('Client error:', error)
    }

    client[mcp].transport = new StreamableHTTPClientTransport(
      new URL(serverUrl),
      {
        sessionId: client[mcp].sessionId,
      },
    )

    // set up notification handlers
    client[mcp].client.setNotificationHandler(LoggingMessageNotificationSchema, (notification) => {
      notificationCount++
      console.log(`\nNotification #${notificationCount}: ${notification.params.level} - ${notification.params.data}`)
    })

    client[mcp].client.setNotificationHandler(ResourceListChangedNotificationSchema, async (_) => {
      console.log(`\nResource list changed notification received!`)
      try {
        if (!client[mcp]) {
          console.log('Client disconnected, cannot fetch resources')
          return
        }
        const resourcesResult = await client[mcp].client.request({
          method: 'resources/list',
          params: {},
        }, ListResourcesResultSchema)
        console.log('Available resources count:', resourcesResult.resources.length)
      }
      catch {
        console.log('Failed to list resources after change notification')
      }
    })

    // Connect the client
    await client[mcp].client.connect(client[mcp].transport)
    console.log('Transport created with session ID:', client[mcp].transport.sessionId)
    console.log('Connected to MCP server')
  }
  catch (error) {
    console.log('Failed to connect:', error)
    client[mcp].client = null
    client[mcp].transport = null
    client[mcp] = null
  }
}

export async function listTools(config: McpConfig): Promise<McpTool[]> {
  await connect(config)
  const mcp = config.name
  const tools: McpTool[] = []

  if (!client[mcp]) {
    console.log('Not connected to server.')
    return tools
  }

  try {
    const toolsRequest: ListToolsRequest = {
      method: 'tools/list',
      params: {},
    }

    const toolsResult = await client[mcp].client.request(toolsRequest, ListToolsResultSchema)

    console.log('Available tools:')
    if (toolsResult.tools.length === 0) {
      console.log('  No tools available')
    }
    else {
      for (const tool of toolsResult.tools) {
        const properties: property[] = []
        console.log(`  - ${tool.name}: ${tool.description}`)
        const keys = Object.keys(tool.inputSchema.properties)
        for (const key of keys) {
          properties.push({
            name: key,
            type: (tool.inputSchema.properties[key] as { type: string }).type,
            value: (tool.inputSchema.properties[key] as { default: any }).default,
            required: tool.inputSchema.required.includes(key),
            description: (tool.inputSchema.properties[key] as { description: string }).description,
          })
        }

        const detail: McpTool = {
          id: '',
          name: tool.name,
          server: mcp,
          description: tool.description,
          inputSchema: {
            type: tool.inputSchema.type,
            properties,
          },
        }

        tools.push(detail)
      }
    }
  }
  catch (error) {
    console.error(`Tools not supported by this server (${error})`)
  }
  return tools
}

export async function callTool(config: McpConfig, name: string, args: Record<string, unknown>): Promise<{ c: string, s: boolean }> {
  args = _.pickBy({ ...args })

  let content: string = ''
  let success: boolean = false
  await connect(config)

  const mcp = config.name
  if (!client[mcp]) {
    console.log('Not connected to server.')
    return { c: content, s: success }
  }

  try {
    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name,
        arguments: args,
      },
    }

    console.log(`Calling tool '${name}' with args:`, args)
    const onLastEventIdUpdate = (event: string) => {
      notificationsToolLastEventId = event
    }
    const result = await client[mcp].client.request(request, CallToolResultSchema, {
      resumptionToken: notificationsToolLastEventId,
      onresumptiontoken: onLastEventIdUpdate,
    })

    console.log('Tool result:')
    result.content.forEach((item) => {
      if (item.type === 'text') {
        content += item.text
        console.log(`  ${item.text}`)
      }
      else {
        console.log(`  ${item.type} content:`, item)
      }
    })
    success = true
  }
  catch (error) {
    console.log(`Error calling tool ${name}: ${error}`)
  }
  return { c: content, s: success }
}

// todo 加入客户端连接
export function getClientsInfo(): ClientInfo[] {
  return Object.values(client)
}
