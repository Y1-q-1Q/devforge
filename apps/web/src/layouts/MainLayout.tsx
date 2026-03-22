import { Outlet } from 'react-router-dom';
import { Layout, Menu, Input, Badge, Avatar, Dropdown } from 'antd';
import {
  DashboardOutlined, BookOutlined, CodeOutlined,
  BranchesOutlined, RocketOutlined, SettingOutlined,
  BellOutlined, SearchOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/knowledge', icon: <BookOutlined />, label: 'KnowForge' },
  { key: '/code', icon: <CodeOutlined />, label: 'CodeForge' },
  { key: '/flow', icon: <BranchesOutlined />, label: 'FlowForge' },
  { key: '/deploy', icon: <RocketOutlined />, label: 'DeployForge' },
  { key: '/settings', icon: <SettingOutlined />, label: '设置' },
];

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const selectedKey = '/' + (location.pathname.split('/')[1] || '');

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="light" width={200} style={{ borderRight: '1px solid #f0f0f0' }}>
        <div style={{ padding: '16px', fontWeight: 700, fontSize: 18, textAlign: 'center' }}>
          🔨 DevForge
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0' }}>
          <Input prefix={<SearchOutlined />} placeholder="搜索..." style={{ width: 400 }} allowClear />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Badge count={3}><BellOutlined style={{ fontSize: 18 }} /></Badge>
            <Dropdown menu={{ items: [{ key: 'profile', label: '个人设置' }, { key: 'logout', label: '退出登录' }] }}>
              <Avatar style={{ background: '#1677ff', cursor: 'pointer' }}>T</Avatar>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ padding: 24, background: '#f5f5f5' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
