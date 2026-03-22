import { Card, Input, Button, Space, message } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';

const { TextArea } = Input;

export default function KnowledgeEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isNew = !id;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');

  const handleSave = () => {
    if (!title.trim()) { message.warning('请输入标题'); return; }
    // TODO: API call
    message.success(isNew ? '创建成功' : '保存成功');
    navigate('/knowledge');
  };

  return (
    <Card
      title={
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/knowledge')} type="text" />
          {isNew ? '新建文档' : '编辑文档'}
        </Space>
      }
      extra={<Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>保存</Button>}
    >
      <Input placeholder="文档标题" value={title} onChange={e => setTitle(e.target.value)} style={{ marginBottom: 16, fontSize: 18 }} />
      <Input placeholder="标签 (逗号分隔)" value={tags} onChange={e => setTags(e.target.value)} style={{ marginBottom: 16 }} />
      <TextArea
        placeholder="开始写作... (支持 Markdown)"
        value={content}
        onChange={e => setContent(e.target.value)}
        autoSize={{ minRows: 20 }}
        style={{ fontFamily: 'monospace' }}
      />
    </Card>
  );
}
