import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { ArrowUpRight, LogOut, Menu, X } from 'lucide-react';
import { signOutAdmin } from '../lib/adminAuth';
import { adminNavigation, getAdminSection } from './adminNavigation';
import '../../styles/admin.css';

export function AdminLayout() {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const section = getAdminSection(pathname);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${section.label} · INNO Admin`;
    return () => { document.title = previousTitle; };
  }, [section]);

  return (
    <div className="admin-workspace">
      <a className="admin-skip" href="#admin-content">跳到主要内容</a>
      <aside className={`admin-sidebar ${menuOpen ? 'is-open' : ''}`}>
        <Link to="/admin" className="admin-brand" onClick={() => setMenuOpen(false)}>INNO<span>业务管理中心</span></Link>
        <nav aria-label="后台主导航">
          {['总览', '客户业务', '内容发布', '库存采集'].map((group) => (
            <div className="admin-nav-group" key={group}>
              <p>{group}</p>
              {adminNavigation.filter((item) => item.group === group).map(({ path, label, icon: Icon }) => (
                <NavLink key={path} to={path} end onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive ? 'active' : ''}>
                  <Icon size={18} /><span>{label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="admin-sidebar-bottom"><span className="admin-session-dot" />管理员工作空间</div>
      </aside>
      {menuOpen && <button className="admin-menu-backdrop" aria-label="关闭导航" onClick={() => setMenuOpen(false)} />}
      <div className="admin-body">
        <header className="admin-topbar">
          <button type="button" className="admin-menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? '关闭导航' : '展开导航'} aria-expanded={menuOpen}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
          <div className="admin-breadcrumb">管理中心<span>/</span><strong>{section.label}</strong></div>
          <div className="admin-topbar-actions"><Link to="/" target="_blank" rel="noreferrer">查看网站<ArrowUpRight size={15} /></Link><button type="button" onClick={() => void signOutAdmin()}><LogOut size={15} />退出登录</button></div>
        </header>
        <div id="admin-content" className="admin-content" tabIndex={-1}><Outlet /></div>
      </div>
    </div>
  );
}
