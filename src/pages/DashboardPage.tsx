import {
  ArrowRightOutlined,
  BookOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  StarOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, List, Progress, Row, Space, Statistic, Tag, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { useQuestionContext } from '../hooks/useQuestionContext';
import { useLearningStore } from '../store/useLearningStore';
import { getAccuracy, getTodayRecords } from '../utils/questionUtils';

const memoryTips = [
  'MaxCompute：离线数仓，不做事务；海量分析，不做 OLTP。',
  'Tunnel：默认追加，覆盖要显式 overwrite。',
  'LabelSecurity：列级优先，低级不能看高级。',
  'Package：跨项目共享找 Package。',
  'RDS 日志：MySQL 看 Binlog，SQL Server 看事务日志。',
  'ADS Join：Join 看分区、JoinKey、HashMap。',
  'XSS：脚本跑在浏览器，攻击发生在客户端。',
  'SQL 注入：SQL 骗数据库，XSS 骗浏览器。',
];

export function DashboardPage() {
  const { questions, meta } = useQuestionContext();
  const answerRecords = useLearningStore((state) => state.answerRecords);
  const wrongQuestions = useLearningStore((state) => state.wrongQuestions);
  const favorites = useLearningStore((state) => state.favorites);
  const settings = useLearningStore((state) => state.settings);
  const todayRecords = getTodayRecords(answerRecords);
  const accuracy = getAccuracy(answerRecords);
  const total = meta?.totalQuestions ?? questions.length;
  const learned = new Set(answerRecords.map((record) => record.questionId)).size;
  const dailyProgress = Math.min(100, Math.round((todayRecords.length / Math.max(settings.dailyGoal, 1)) * 100));

  return (
    <div className="page-stack">
      <section className="dashboard-hero">
        <div>
          <Typography.Title level={2}>继续刷题，稳住高频考点</Typography.Title>
          <Typography.Paragraph>
            当前题库已导入 {total} 道题，学习记录保存在本地浏览器，可随时导出备份。
          </Typography.Paragraph>
        </div>
        <Space wrap>
          <Link to="/practice">
            <Button type="primary" size="large" icon={<ArrowRightOutlined />}>
              继续学习
            </Button>
          </Link>
          <Link to="/exam">
            <Button size="large" icon={<ClockCircleOutlined />}>
              模拟考试
            </Button>
          </Link>
        </Space>
      </section>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8} xl={4}>
          <Card>
            <Statistic title="总题数" value={total} prefix={<BookOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} xl={4}>
          <Card>
            <Statistic title="已刷题" value={learned} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} xl={4}>
          <Card>
            <Statistic title="正确率" value={accuracy} suffix="%" valueStyle={{ color: '#2f9e44' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} xl={4}>
          <Card>
            <Statistic title="错题数" value={Object.keys(wrongQuestions).length} prefix={<WarningOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} xl={4}>
          <Card>
            <Statistic title="收藏数" value={favorites.length} prefix={<StarOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} xl={4}>
          <Card>
            <Statistic title="今日学习" value={todayRecords.length} suffix={`/ ${settings.dailyGoal}`} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card title="今日目标">
            <Progress percent={dailyProgress} strokeColor={{ from: '#1677ff', to: '#2f9e44' }} />
            <Typography.Text type="secondary">
              今日已完成 {todayRecords.length} 题，当前每日目标为 {settings.dailyGoal} 题。
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card title="知识点速记">
            <List
              grid={{ gutter: 8, xs: 1, sm: 2 }}
              dataSource={memoryTips}
              renderItem={(item) => (
                <List.Item>
                  <Tag color="gold" className="tip-tag">
                    {item}
                  </Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
