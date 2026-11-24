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
/**
 * 获取设施数据
 * @param params {
 *   type?: string // 设施类型
 *   country?: string // 国家
 *   region?: string // 地区
 *   status?: string // 状态
 *   threatLevel?: string // 威胁等级
 * }
 * @returns Facility[] 设施数据
 */
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
