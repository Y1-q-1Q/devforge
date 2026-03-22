import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Spin } from 'antd';
import MainLayout from './layouts/MainLayout';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const KnowledgeList = lazy(() => import('./pages/knowledge/KnowledgeList'));
const KnowledgeEditor = lazy(() => import('./pages/knowledge/KnowledgeEditor'));
const KnowledgeSearch = lazy(() => import('./pages/knowledge/KnowledgeSearch'));
const NotFound = lazy(() => import('./pages/NotFound'));

const Loading = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <Spin size="large" />
  </div>
);

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="knowledge">
            <Route index element={<KnowledgeList />} />
            <Route path="new" element={<KnowledgeEditor />} />
            <Route path=":id" element={<KnowledgeEditor />} />
            <Route path="search" element={<KnowledgeSearch />} />
          </Route>
          {/* CodeForge, FlowForge, DeployForge routes will be added as modules mature */}
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
