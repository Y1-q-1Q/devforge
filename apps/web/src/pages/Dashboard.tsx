import { Card, Col, Row, Statistic, List, Typography } from 'antd';
import { BookOutlined, CodeOutlined, BranchesOutlined, RocketOutlined } from '@ant-design/icons';

const { Title } = Typography;

export default function Dashboard() {
  return (
    <div>
      <Title level={4}>欢迎回来 👋</Title>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card hoverable><Statistic title="📚 文档" value={0} prefix={<BookOutlined />} /></Card>
        </Col>
        <Col span={6}>
          <Card hoverable><Statistic title="💻 代码生成" value={0} prefix={<CodeOutlined />} /></Card>
        </Col>
        <Col span={6}>
          <Card hoverable><Statistic title="🔄 工作流" value={0} prefix={<BranchesOutlined />} /></Card>
        </Col>
        <Col span={6}>
          <Card hoverable><Statistic title="🚀 部署" value={0} prefix={<RocketOutlined />} /></Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="最近文档">
            <List
              dataSource={[]}
              renderItem={(item: string) => <List.Item>{item}</List.Item>}
              locale={{ emptyText: '暂无文档，开始创建吧' }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="最近活动">
            <List
              dataSource={[]}
              renderItem={(item: string) => <List.Item>{item}</List.Item>}
              locale={{ emptyText: '暂无活动' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
