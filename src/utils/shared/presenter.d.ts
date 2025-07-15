// todo add default
export interface property {
  name: string
  type: string
  value: any
  description: string
}

export interface McpConfig {
  id: number
  name: string
  url: string
}

export interface McpVariable {
  id: number
  name: string
  value: string
  handleMethod: 'none' | 'word-splite'
}

export interface McpTool {
  id: string
  name: string
  server: string
  description: string
  inputSchema: {
    type: string
    properties: property[]
  }
}

export interface McpToolOperation {
  id: string
  tool: McpTool
  description: string
}

export interface ParamRedefine {
  operaId: string
  operaName: string
  paramId: number
  paramName: string
  reDefineName: string
}

export interface Workflow {
  id: string
  name: string
  paramRedefines: ParamRedefine[]
  toolOperations: McpToolOperation[]
}

export interface McpToolDefinition {
  type: string
  function: {
    name: string
    description: string
    parameters: {
      type: string
      properties: Record<string, any>
      required?: string[]
    }
  }
}

export interface MCPToolCall {
  id: string
  type: string
  function: {
    name: string
    arguments: string
  }
  server: {
    name: string
    icons: string
    description: string
  }
}
