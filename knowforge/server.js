const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// In-memory database
let notes = [];
let nextId = 1;

// Load data from file
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      notes = data.notes || [];
      nextId = data.nextId || 1;
      console.log(`Loaded ${notes.length} notes from disk`);
    }
  } catch (error) {
    console.error('Error loading data:', error);
    notes = [];
    nextId = 1;
  }
}

// Save data to file
function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ notes, nextId }, null, 2));
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

// Initialize
loadData();

// API Routes

// Add note
app.post('/api/notes', (req, res) => {
  const { title, content, tags } = req.body;
  
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content required' });
  }
  
  const note = {
    id: nextId++,
    title,
    content,
    tags: tags || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  notes.unshift(note);
  saveData();
  
  res.json({ id: note.id, message: 'Note created' });
});

// Get all notes
app.get('/api/notes', (req, res) => {
  const { search } = req.query;
  
  let result = notes;
  
  if (search) {
    const query = search.toLowerCase();
    result = notes.filter(note => 
      note.title.toLowerCase().includes(query) ||
      note.content.toLowerCase().includes(query) ||
      (note.tags && note.tags.toLowerCase().includes(query))
    );
  }
  
  res.json(result);
});

// Get note by ID
app.get('/api/notes/:id', (req, res) => {
  const note = notes.find(n => n.id === parseInt(req.params.id));
  
  if (!note) {
    return res.status(404).json({ error: 'Note not found' });
  }
  
  res.json(note);
});

// Update note
app.put('/api/notes/:id', (req, res) => {
  const { title, content, tags } = req.body;
  const id = parseInt(req.params.id);
  
  const noteIndex = notes.findIndex(n => n.id === id);
  
  if (noteIndex === -1) {
    return res.status(404).json({ error: 'Note not found' });
  }
  
  notes[noteIndex] = {
    ...notes[noteIndex],
    title: title || notes[noteIndex].title,
    content: content || notes[noteIndex].content,
    tags: tags !== undefined ? tags : notes[noteIndex].tags,
    updated_at: new Date().toISOString()
  };
  
  saveData();
  res.json({ message: 'Note updated' });
});

// Delete note
app.delete('/api/notes/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const noteIndex = notes.findIndex(n => n.id === id);
  
  if (noteIndex === -1) {
    return res.status(404).json({ error: 'Note not found' });
  }
  
  notes.splice(noteIndex, 1);
  saveData();
  
  res.json({ message: 'Note deleted' });
});

// Get all tags
app.get('/api/tags', (req, res) => {
  const tagCounts = {};
  
  notes.forEach(note => {
    if (note.tags) {
      note.tags.split(',').forEach(tag => {
        const trimmed = tag.trim();
        if (trimmed) {
          tagCounts[trimmed] = (tagCounts[trimmed] || 0) + 1;
        }
      });
    }
  });
  
  const tags = Object.entries(tagCounts).map(([name, count]) => ({
    name,
    count,
    color: null
  }));
  
  res.json(tags);
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ KnowForge server running on http://localhost:${PORT}`);
  console.log(`📊 Loaded ${notes.length} notes`);
});