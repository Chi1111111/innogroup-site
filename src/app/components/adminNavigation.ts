import { CarFront, FileSignature, Handshake, LayoutDashboard, Newspaper, Receipt, UsersRound } from 'lucide-react';

export const adminNavigation = [
  { path: '/admin', label: '工作台', group: '总览', description: '从客户跟进到内容发布，快速进入日常工作。', icon: LayoutDashboard },
  { path: '/admin/crm', label: '客户与订单', group: '客户业务', description: '跟进客户线索，管理订单进度和代步车。', icon: UsersRound },
  { path: '/admin/contracts', label: '合同管理', group: '客户业务', description: '创建合同、发送签署链接，查看签署状态。', icon: FileSignature },
  { path: '/admin/invoices', label: '发票管理', group: '客户业务', description: '从合同带入资料，制作、打印和管理发票。', icon: Receipt },
  { path: '/admin/weekly-reports', label: '周报发布', group: '内容发布', description: '整理推荐车辆、实际到港和本周业务动态。', icon: Newspaper },
  { path: '/admin/partners', label: '合作伙伴', group: '内容发布', description: '维护网站上的供应商、合作方和品牌资料。', icon: Handshake },
  { path: '/admin/photos', label: '图片处理与上架', group: '库存采集', description: '查看本地处理进度，批量审核云端图片并自动上架车辆。', icon: CarFront },
  { path: '/admin/japan-market', label: '日本车源', group: '库存采集', description: '查看库存、核对报价，管理采集任务与运行记录。', icon: CarFront },
] as const;

export function getAdminSection(pathname: string) {
  return adminNavigation.find((item) => item.path === pathname.replace(/\/$/, '')) ?? adminNavigation[0];
}
