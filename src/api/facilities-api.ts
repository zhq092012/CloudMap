/**
 * API client for facility endpoints
 * Base: /api/v1/facilities
 * Backend: http://192.168.100.16:8080/api/v1/facilities
 */
import { requestAPI } from '@/utils/http/request'

export interface Facility {
  id: number
  name: string
  nameAr?: string
  nameZh?: string
  type: string
  country: string
  region?: string
  city?: string
  latitude: number
  longitude: number
  description?: string
  descriptionZh?: string
  operator?: string
  capacity?: string
  status?: string
  threatLevel?: string
  importance?: number
  nameAlias?: string
  address?: string
  owner?: string
  area?: string
  personnel?: string
  operationalSince?: string
  estimatedValue?: string
}

export async function getFacilities(
  params?: {
    type?: string
    country?: string
    region?: string
    status?: string
    threatLevel?: string
  }
): Promise<Facility[]> {
  return requestAPI.get('/api/v1/facilities', { params })
}
