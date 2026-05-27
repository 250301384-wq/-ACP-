import { DownloadOutlined, InboxOutlined, ReloadOutlined } from '@ant-design/icons';
import { Alert, App as AntApp, Button, Card, InputNumber, Popconfirm, Space, Switch, Typography, Upload } from 'antd';
import { useLearningStore } from '../store/useLearningStore';
import type { LearningExport } from '../types';
import { downloadTextFile } from '../utils/download';

export function SettingsPage() {
  const { message } = AntApp.useApp();
  const settings = useLearningStore((state) => state.settings);
  const updateSettings = useLearningStore((state) => state.updateSettings);
  const resetLearningData = useLearningStore((state) => state.resetLearningData);
  const exportLearningData = useLearningStore((state) => state.exportLearningData);
  const importLearningData = useLearningStore((state) => state.importLearningData);

  const handleExport = () => {
    const data = exportLearningData();
    downloadTextFile(
      `ACP学习数据_${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(data, null, 2),
      'application/json;charset=utf-8',
    );
    message.success('学习数据已导出');
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result)) as Partial<LearningExport>;
        importLearningData(data);
        message.success('学习数据已导入');
      } catch {
        message.error('导入失败，请检查 JSON 文件');
      }
    };
    reader.readAsText(file);
    return false;
  };

  return (
    <div className="page-stack">
      <Card title="学习设置">
        <div className="settings-grid">
          <div className="settings-row">
            <div>
              <Typography.Text strong>深色模式</Typography.Text>
              <Typography.Paragraph type="secondary">当前主题：{settings.theme === 'dark' ? '深色' : '浅色'}</Typography.Paragraph>
            </div>
            <Switch
              checked={settings.theme === 'dark'}
              onChange={(checked) => updateSettings({ theme: checked ? 'dark' : 'light' })}
            />
          </div>
          <div className="settings-row">
            <div>
              <Typography.Text strong>每日目标</Typography.Text>
              <Typography.Paragraph type="secondary">Dashboard 进度按此目标计算</Typography.Paragraph>
            </div>
            <InputNumber
              min={1}
              max={500}
              value={settings.dailyGoal}
              onChange={(value) => updateSettings({ dailyGoal: value ?? 40 })}
            />
          </div>
        </div>
      </Card>

      <Card title="数据备份">
        <Space wrap>
          <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>
            导出学习数据
          </Button>
          <Upload accept="application/json,.json" showUploadList={false} beforeUpload={handleImport}>
            <Button icon={<InboxOutlined />}>导入学习数据</Button>
          </Upload>
          <Popconfirm title="确认重置所有学习数据？" onConfirm={resetLearningData}>
            <Button danger icon={<ReloadOutlined />}>
              重置进度
            </Button>
          </Popconfirm>
        </Space>
      </Card>

      <Alert
        type="info"
        showIcon
        message="本地数据"
        description="answer_records、wrong_questions、favorites、notes、doubts、progress、settings 均保存在浏览器 LocalStorage。"
      />
    </div>
  );
}
