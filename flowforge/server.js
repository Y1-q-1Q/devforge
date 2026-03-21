const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cron = require('node-cron');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'workflows.json');

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// In-memory storage
let workflows = [];
let activeJobs = new Map();

// Load workflows
function loadWorkflows() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      workflows = data.workflows || [];
      console.log(`Loaded ${workflows.length} workflows`);
      // Restart scheduled workflows
      workflows.forEach(wf => {
        if (wf.status === 'active' && wf.trigger.type === 'cron') {
          scheduleWorkflow(wf);
        }
      });
    }
  } catch (error) {
    console.error('Error loading workflows:', error);
  }
}

// Save workflows
function saveWorkflows() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ workflows }, null, 2));
  } catch (error) {
    console.error('Error saving workflows:', error);
  }
}

// Execute workflow
async function executeWorkflow(workflow) {
  console.log(`Executing workflow: ${workflow.name}`);
  const execution = {
    id: uuidv4(),
    workflowId: workflow.id,
    startedAt: new Date().toISOString(),
    status: 'running',
    logs: []
  };
  
  workflow.executions = workflow.executions || [];
  workflow.executions.unshift(execution);
  
  try {
    for (const node of workflow.nodes) {
      execution.logs.push({
        time: new Date().toISOString(),
        node: node.id,
        action: node.type,
        status: 'running'
      });
      
      await executeNode(node, execution);
      
      execution.logs.push({
        time: new Date().toISOString(),
        node: node.id,
        action: node.type,
        status: 'success'
      });
    }
    
    execution.status = 'success';
    execution.completedAt = new Date().toISOString();
  } catch (error) {
    execution.status = 'failed';
    execution.error = error.message;
    execution.completedAt = new Date().toISOString();
    execution.logs.push({
      time: new Date().toISOString(),
      error: error.message,
      status: 'error'
    });
  }
  
  saveWorkflows();
  return execution;
}

// Execute single node
async function executeNode(node, execution) {
  switch (node.type) {
    case 'shell':
      return executeShell(node.config.command);
    case 'http':
      return executeHttp(node.config);
    case 'delay':
      return executeDelay(node.config.duration);
    case 'log':
      console.log(`[Workflow Log] ${node.config.message}`);
      return;
    default:
      throw new Error(`Unknown node type: ${node.type}`);
  }
}

// Execute shell command
function executeShell(command) {
  return new Promise((resolve, reject) => {
    exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

// Execute HTTP request
async function executeHttp(config) {
  const fetch = (await import('node-fetch')).default;
  const response = await fetch(config.url, {
    method: config.method || 'GET',
    headers: config.headers || {},
    body: config.body ? JSON.stringify(config.body) : undefined
  });
  return response.json();
}

// Execute delay
function executeDelay(duration) {
  return new Promise(resolve => setTimeout(resolve, duration * 1000));
}

// Schedule workflow
function scheduleWorkflow(workflow) {
  if (workflow.trigger.type === 'cron') {
    const job = cron.schedule(workflow.trigger.cron, () => {
      executeWorkflow(workflow);
    });
    activeJobs.set(workflow.id, job);
  }
}

// Stop scheduled workflow
function stopWorkflow(workflowId) {
  const job = activeJobs.get(workflowId);
  if (job) {
    job.stop();
    activeJobs.delete(workflowId);
  }
}

// API Routes

// Get all workflows
app.get('/api/workflows', (req, res) => {
  res.json(workflows);
});

// Get workflow by ID
app.get('/api/workflows/:id', (req, res) => {
  const workflow = workflows.find(w => w.id === req.params.id);
  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found' });
  }
  res.json(workflow);
});

// Create workflow
app.post('/api/workflows', (req, res) => {
  const { name, description, trigger, nodes } = req.body;
  
  if (!name || !nodes || !Array.isArray(nodes)) {
    return res.status(400).json({ error: 'Name and nodes are required' });
  }
  
  const workflow = {
    id: uuidv4(),
    name,
    description: description || '',
    trigger: trigger || { type: 'manual' },
    nodes,
    status: 'inactive',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    executions: []
  };
  
  workflows.push(workflow);
  saveWorkflows();
  
  res.status(201).json(workflow);
});

// Update workflow
app.put('/api/workflows/:id', (req, res) => {
  const index = workflows.findIndex(w => w.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Workflow not found' });
  }
  
  const { name, description, trigger, nodes } = req.body;
  
  // Stop existing schedule
  stopWorkflow(req.params.id);
  
  workflows[index] = {
    ...workflows[index],
    name: name || workflows[index].name,
    description: description !== undefined ? description : workflows[index].description,
    trigger: trigger || workflows[index].trigger,
    nodes: nodes || workflows[index].nodes,
    updatedAt: new Date().toISOString()
  };
  
  // Reschedule if active
  if (workflows[index].status === 'active' && trigger?.type === 'cron') {
    scheduleWorkflow(workflows[index]);
  }
  
  saveWorkflows();
  res.json(workflows[index]);
});

// Delete workflow
app.delete('/api/workflows/:id', (req, res) => {
  const index = workflows.findIndex(w => w.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Workflow not found' });
  }
  
  stopWorkflow(req.params.id);
  workflows.splice(index, 1);
  saveWorkflows();
  
  res.json({ message: 'Workflow deleted' });
});

// Activate workflow
app.post('/api/workflows/:id/activate', (req, res) => {
  const workflow = workflows.find(w => w.id === req.params.id);
  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found' });
  }
  
  workflow.status = 'active';
  workflow.updatedAt = new Date().toISOString();
  
  if (workflow.trigger.type === 'cron') {
    scheduleWorkflow(workflow);
  }
  
  saveWorkflows();
  res.json(workflow);
});

// Deactivate workflow
app.post('/api/workflows/:id/deactivate', (req, res) => {
  const workflow = workflows.find(w => w.id === req.params.id);
  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found' });
  }
  
  workflow.status = 'inactive';
  workflow.updatedAt = new Date().toISOString();
  stopWorkflow(workflow.id);
  
  saveWorkflows();
  res.json(workflow);
});

// Run workflow manually
app.post('/api/workflows/:id/run', async (req, res) => {
  const workflow = workflows.find(w => w.id === req.params.id);
  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found' });
  }
  
  const execution = await executeWorkflow(workflow);
  res.json(execution);
});

// Get execution logs
app.get('/api/workflows/:id/executions', (req, res) => {
  const workflow = workflows.find(w => w.id === req.params.id);
  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found' });
  }
  
  res.json(workflow.executions || []);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    workflows: workflows.length,
    activeWorkflows: workflows.filter(w => w.status === 'active').length
  });
});

// Initialize
loadWorkflows();

// Start server
app.listen(PORT, () => {
  console.log(`✅ FlowForge server running on http://localhost:${PORT}`);
  console.log(`📊 Loaded ${workflows.length} workflows`);
});

module.exports = app;