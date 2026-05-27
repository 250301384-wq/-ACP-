import { Card, Col, Empty, Row, Statistic } from 'antd';
import ReactECharts from 'echarts-for-react';
import { useMemo } from 'react';
import { useLearningStore } from '../store/useLearningStore';
import { getAccuracy } from '../utils/questionUtils';

function recentDates(days: number) {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - index - 1));
    return date.toISOString().slice(0, 10);
  });
}

export function StatsPage() {
  const answerRecords = useLearningStore((state) => state.answerRecords);
  const wrongQuestions = useLearningStore((state) => state.wrongQuestions);

  const dates = useMemo(() => recentDates(7), []);
  const dailyStats = useMemo(
    () =>
      dates.map((date) => {
        const records = answerRecords.filter((record) => record.answeredAt.slice(0, 10) === date);
        return {
          date: date.slice(5),
          count: records.length,
          accuracy: getAccuracy(records),
        };
      }),
    [answerRecords, dates],
  );

  const knowledgeStats = useMemo(() => {
    const groups = new Map<string, { total: number; correct: number }>();
    for (const record of answerRecords) {
      for (const point of record.knowledgePoints) {
        const current = groups.get(point) ?? { total: 0, correct: 0 };
        current.total += 1;
        current.correct += record.correct ? 1 : 0;
        groups.set(point, current);
      }
    }
    return Array.from(groups.entries())
      .map(([point, value]) => ({
        point,
        total: value.total,
        accuracy: Math.round((value.correct / Math.max(value.total, 1)) * 100),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 12);
  }, [answerRecords]);

  const reasonStats = useMemo(() => {
    const groups = new Map<string, number>();
    for (const wrong of Object.values(wrongQuestions)) {
      const key = wrong.reason ?? '未标注';
      groups.set(key, (groups.get(key) ?? 0) + 1);
    }
    return Array.from(groups.entries()).map(([name, value]) => ({ name, value }));
  }, [wrongQuestions]);

  const accuracyOption = {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: dailyStats.map((item) => item.date) },
    yAxis: { type: 'value', max: 100 },
    series: [
      {
        name: '正确率',
        type: 'line',
        smooth: true,
        data: dailyStats.map((item) => item.accuracy),
        areaStyle: {},
        color: '#1677ff',
      },
    ],
  };

  const countOption = {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: dailyStats.map((item) => item.date) },
    yAxis: { type: 'value' },
    series: [
      {
        name: '刷题数',
        type: 'bar',
        data: dailyStats.map((item) => item.count),
        color: '#2f9e44',
      },
    ],
  };

  const knowledgeOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: 96, right: 24, top: 24, bottom: 24 },
    xAxis: { type: 'value', max: 100 },
    yAxis: { type: 'category', data: knowledgeStats.map((item) => item.point).reverse() },
    series: [
      {
        name: '掌握度',
        type: 'bar',
        data: knowledgeStats.map((item) => item.accuracy).reverse(),
        color: '#faad14',
      },
    ],
  };

  const reasonOption = {
    tooltip: { trigger: 'item' },
    series: [
      {
        name: '错因',
        type: 'pie',
        radius: ['42%', '70%'],
        data: reasonStats,
        color: ['#f5222d', '#fa8c16', '#faad14', '#1677ff', '#2f9e44', '#722ed1'],
      },
    ],
  };

  if (answerRecords.length === 0) {
    return (
      <Card>
        <Empty description="完成几道题后，这里会生成学习统计图表" />
      </Card>
    );
  }

  return (
    <div className="page-stack">
      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="答题记录" value={answerRecords.length} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="总体正确率" value={getAccuracy(answerRecords)} suffix="%" />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="错题数" value={Object.keys(wrongQuestions).length} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="已覆盖知识点" value={knowledgeStats.length} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="正确率趋势">
            <ReactECharts option={accuracyOption} className="chart" />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="刷题数量">
            <ReactECharts option={countOption} className="chart" />
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card title="知识点掌握度">
            <ReactECharts option={knowledgeOption} className="chart large-chart" />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="错题原因分布">
            <ReactECharts option={reasonOption} className="chart large-chart" />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
