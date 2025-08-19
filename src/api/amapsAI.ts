import amapsAI_request from '@/utils/amapsAI-request'

export function queryvaluationByAI(location: string): Promise<any> {
  return amapsAI_request.get('/api/v1/shop/valuationByAI', { params: { location } })
}
