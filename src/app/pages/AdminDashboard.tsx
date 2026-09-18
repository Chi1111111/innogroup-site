import { Link } from 'react-router';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { adminNavigation } from '../components/adminNavigation';

export function AdminDashboard() {
  return <main className="admin-dashboard">
    <div className="admin-dashboard-heading"><p>INNO GROUP / WORKSPACE</p><h1>今天，从这里开始。</h1><span>客户、订单和发布工作，各归其位。</span></div>
    <section className="admin-workflow" aria-labelledby="workflow-title">
      <div><p>客户业务流程</p><h2 id="workflow-title">从首次咨询，到完成交付</h2><span>按当前阶段进入对应模块。</span></div>
      <div className="admin-workflow-steps">{[
        ['01', '跟进客户', '记录需求与下一次联系', '/admin/crm'],
        ['02', '准备合同', '确认车辆与签署资料', '/admin/contracts'],
        ['03', '开具发票', '带入合同并核对金额', '/admin/invoices'],
        ['04', '推进交付', '更新订单与到港状态', '/admin/crm?view=orders'],
      ].map(([step, label, detail, path]) => <Link key={step} to={path}><small>{step}<ArrowUpRight size={17} /></small><strong>{label}</strong><span>{detail}</span></Link>)}</div>
    </section>
    {['客户业务', '内容发布', '库存采集'].map((group) => <section className="admin-module-section" key={group}><h2>{group}</h2><div className="admin-module-grid">{adminNavigation.filter((item) => item.group === group).map(({ path, label, description, icon: Icon }) => <Link to={path} className="admin-module-card" key={path}><div className="admin-module-icon"><Icon size={22} /></div><h3>{label}</h3><p>{description}</p><span>进入管理<ArrowRight size={16} /></span></Link>)}</div></section>)}
    <p className="admin-dashboard-note">业务衔接：已签合同可同步为 CRM 订单；发票可从合同带入资料；到港订单可同步至周报。</p>
  </main>;
}
