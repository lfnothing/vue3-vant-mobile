import amaps_request from '@/utils/amaps-request'

export function queryValuation(location: string): Promise<any> {
  return amaps_request.get('/api/v1/shop/valuation', { params: { location } })
}
