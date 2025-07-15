export interface MODEL_META {
  id: string
  name: string
  group: string
  providerId: string
  isCustom: boolean
  contextLength: number
  maxTokens: number
  description?: string
  vision?: boolean
  functionCall?: boolean
  reasoning?: boolean
}
