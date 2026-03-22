import { Card, Input, List, Tag, Empty } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useState } from 'react';

export default function KnowledgeSearch() {
  const [query, setQuery] = useState('');
  const [results] = useState<any[]>([]);

  const handleSearch = () => {
    if (!query.trim()) return;
    // TODO: API call for semantic search
  };

  return (
    <Card title="🔍 知识搜索">
      <Input.Search
        prefix={<SearchOutlined />}
        placeholder="输入搜索内容 (支持语义搜索)..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        onSearch={handleSearch}
        enterButton="搜索"
        size="large"
        style={{ marginBottom: 24, maxWidth: 600 }}
      />
      <List
        dataSource={results}
        renderItem={(item: any) => (
          <List.Item>
            <List.Item.Meta
              title={<a>{item.title}</a>}
              description={
                <>
                  <div>{item.snippet}</div>
                  <Tag color="blue">相关度 {item.score}%</Tag>
                </>
              }
            />
          </List.Item>
        )}
        locale={{ emptyText: <Empty description={query ? '未找到相关结果' : '输入关键词开始搜索'} /> }}
      />
    </Card>
  );
}
