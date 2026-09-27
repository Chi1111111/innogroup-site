import { Link } from 'react-router';
import { MacCollectionProgress } from '../components/MacCollectionProgress';
import { AdminPhotos } from './AdminPhotos';
import '../../styles/admin-japan-market.css';

export function AdminJapanMarket() {
  return <main className="ajm"><div className="ajm-main">
    <header className="ajm-header"><div><h1>采集与图片</h1><p>Mac 自动找车、处理图片，符合条件后自动上架。</p></div><Link className="ajm-button" to="/japan-market" target="_blank">查看已上架车辆</Link></header>
    <MacCollectionProgress/>
    <AdminPhotos/>
    <p className="ajm-footer">已完成记录仅展示最近 24 小时。排队任务和待审核图片会一直保留，已上架车辆和图片不受影响。</p>
  </div></main>;
}
