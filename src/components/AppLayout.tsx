import {
  BarChartOutlined,
  BookOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  ExperimentOutlined,
  HeartOutlined,
  ReadOutlined,
  SettingOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { Alert, Grid, Layout, Menu, Spin, Switch, Tag, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import type { QuestionContext } from '../hooks/useQuestionContext';
import { useLearningStore } from '../store/useLearningStore';

const { Header, Content, Sider } = Layout;

interface AppLayoutProps {
  questionState: QuestionContext;
}

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '首页' },
  { key: '/browse', icon: <DatabaseOutlined />, label: '分类刷题' },
  { key: '/practice', icon: <ReadOutlined />, label: '答题' },
  { key: '/wrong', icon: <BookOutlined />, label: '错题本' },
  { key: '/favorites', icon: <StarOutlined />, label: '收藏' },
  { key: '/exam', icon: <ExperimentOutlined />, label: '模拟考试' },
  { key: '/stats', icon: <BarChartOutlined />, label: '统计' },
  { key: '/settings', icon: <SettingOutlined />, label: '设置' },
];

export function AppLayout({ questionState }: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const screens = Grid.useBreakpoint();
  const [collapsed, setCollapsed] = useState(false);
  const settings = useLearningStore((state) => state.settings);
  const updateSettings = useLearningStore((state) => state.updateSettings);
  const wrongCount = useLearningStore((state) => Object.keys(state.wrongQuestions).length);
  const favoriteCount = useLearningStore((state) => state.favorites.length);

  const selectedKey = useMemo(() => {
    const topLevel = `/${location.pathname.split('/').filter(Boolean)[0] ?? ''}`;
    return topLevel === '/' ? '/' : topLevel;
  }, [location.pathname]);

  return (
    <Layout className="app-shell">
      <Sider
        collapsible
        collapsed={collapsed || !screens.md}
        onCollapse={setCollapsed}
        breakpoint="md"
        className="app-sider"
        width={232}
      >
        <button className="brand-button" type="button" onClick={() => navigate('/')}>
          <HeartOutlined className="brand-icon" />
          {!collapsed && screens.md ? (
            <span>
              <strong>ACP 题库</strong>
              <small>Big Data</small>
            </span>
          ) : null}
        </button>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={(item) => navigate(item.key)}
          className="nav-menu"
        />
      </Sider>
      <Layout>
        <Header className="app-header">
          <div className="header-title">
            <Typography.Title level={4}>ACP 阿里云大数据工程师认证题库</Typography.Title>
            <div className="header-tags">
              <Tag color="blue">{questionState.meta?.totalQuestions ?? questionState.questions.length} 题</Tag>
              <Tag color="red">{wrongCount} 错题</Tag>
              <Tag color="gold">{favoriteCount} 收藏</Tag>
            </div>
          </div>
          <Switch
            checked={settings.theme === 'dark'}
            checkedChildren="深色"
            unCheckedChildren="浅色"
            onChange={(checked) => updateSettings({ theme: checked ? 'dark' : 'light' })}
          />
        </Header>
        <Content className="app-content">
          {questionState.error ? (
            <Alert
              type="error"
              showIcon
              message="题库加载失败"
              description={questionState.error}
              className="page-alert"
            />
          ) : null}
          {questionState.loading ? (
            <div className="loading-panel">
              <Spin size="large" />
              <span>正在加载题库...</span>
            </div>
          ) : (
            <Outlet context={questionState} />
          )}
        </Content>
      </Layout>
    </Layout>
  );
}
