import { useState } from 'react';
import { Card, Button, Input, Table, Tag, Space, Empty } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';

interface Document {
  id: string;
  title: string;
  tags: string[];
  updatedAt: string;
}

export default function KnowledgeList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [documents] = useState<Document[]>([]);

  const columns: ColumnsType<Document> = [
    { title: '标题', dataIndex: 'title', key: 'title', render: (text, record) => <a onClick={() => navigate(`/knowledge/${record.id}`)}>{text}</a> },
    { title: '标签', dataIndex: 'tags', key: 'tags', render: (tags: string[]) => tags?.map(t => <Tag key={t}>{t}</Tag>) },
    { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 180 },
    {
      title: '操作', key: 'action', width: 120,
      render: (_, record) => <Space><a onClick={() => navigate(`/knowledge/${record.id}`)}>编辑</a></Space>,
    },
  ];

  return (
    <Card
      title="📚 我的文档"
      extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/knowledge/new')}>新建文档</Button>}
    >
      <Input
        prefix={<SearchOutlined />}
        placeholder="搜索文档..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: 16, maxWidth: 400 }}
        allowClear
      />
      <Table
        columns={columns}
        dataSource={documents}
        rowKey="id"
        locale={{ emptyText: <Empty description="暂无文档" /> }}
      />
    </Card>
  );
}
