const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');
const BACKUP_DIR = path.join(__dirname, 'backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static('public'));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// In-memory database
let notes = [];
let nextId = 1;

// Load data from file with error recovery
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      notes = data.notes || [];
      nextId = data.nextId || 1;
      console.log(`✅ Loaded ${notes.length} notes from disk`);
      return true;
    }
  } catch (error) {
    console.error('❌ Error loading data:', error);
    // Try to load from backup
    const backups = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('data-'))
      .sort()
      .reverse();
    
    for (const backup of backups) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(BACKUP_DIR, backup), 'utf8'));
        notes = data.notes || [];
        nextId = data.nextId || 1;
        console.log(`✅ Recovered from backup: ${backup}`);
        saveData(); // Save recovered data
        return true;
      } catch (e) {
        continue;
      }
    }
  }
  return false;
}

// Save data to file with backup
function saveData() {
  try {
    // Create backup before saving
    if (fs.existsSync(DATA_FILE)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(BACKUP_DIR, `data-${timestamp}.json`);
      fs.copyFileSync(DATA_FILE, backupPath);
      
      // Keep only last 10 backups
      const backups = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.startsWith('data-'))
        .sort()
        .reverse();
      
      if (backups.length > 10) {
        backups.slice(10).forEach(f => {
          fs.unlinkSync(path.join(BACKUP_DIR, f));
        });
      }
    }
    
    // Save new data
    fs.writeFileSync(DATA_FILE, JSON.stringify({ notes, nextId }, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Error saving data:', error);
    return false;
  }
}

// Validation middleware
function validateNote(req, res, next) {
  const { title, content } = req.body;
  
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({ error: 'Title is required and must be a non-empty string' });
  }
  
  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'Content is required and must be a string' });
  }
  
  if (title.length > 200) {
    return res.status(400).json({ error: 'Title must be less than 200 characters' });
  }
  
  if (content.length > 100000) {
    return res.status(400).json({ error: 'Content must be less than 100KB' });
  }
  
  next();
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    notes: notes.length,
    version: '0.1.0'
  });
});

// Add note
app.post('/api/notes', validateNote, (req, res) => {
  const { title, content, tags } = req.body;
  
  const note = {
    id: nextId++,
    title: title.trim(),
    content: content.trim(),
    tags: tags ? tags.trim() : '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  notes.unshift(note);
  
  if (saveData()) {
    res.status(201).json({ 
      success: true,
      id: note.id, 
      message: 'Note created successfully'
    });
  } else {
    res.status(500).json({ error: 'Failed to save note' });
  }
});

// Get all notes with pagination
app.get('/api/notes', (req, res) => {
  const { search, page = 1, limit = 50 } = req.query;
  
  let result = [...notes];
  
  // Search
  if (search && typeof search === 'string') {
    const query = search.toLowerCase();
    result = result.filter(note => 
      note.title.toLowerCase().includes(query) ||
      note.content.toLowerCase().includes(query) ||
      (note.tags && note.tags.toLowerCase().includes(query))
    );
  }
  
  // Pagination
  const pageNum = parseInt(page) || 1;
  const limitNum = Math.min(parseInt(limit) || 50, 100);
  const start = (pageNum - 1) * limitNum;
  const paginated = result.slice(start, start + limitNum);
  
  res.json({
    notes: paginated,
    total: result.length,
    page: pageNum,
    totalPages: Math.ceil(result.length / limitNum)
  });
});

// Get note by ID
app.get('/api/notes/:id', (req, res) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid note ID' });
  }
  
  const note = notes.find(n => n.id === id);
  
  if (!note) {
    return res.status(404).json({ error: 'Note not found' });
  }
  
  res.json(note);
});

// Update note
app.put('/api/notes/:id', validateNote, (req, res) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid note ID' });
  }
  
  const { title, content, tags } = req.body;
  const noteIndex = notes.findIndex(n => n.id === id);
  
  if (noteIndex === -1) {
    return res.status(404).json({ error: 'Note not found' });
  }
  
  notes[noteIndex] = {
    ...notes[noteIndex],
    title: title.trim(),
    content: content.trim(),
    tags: tags !== undefined ? tags.trim() : notes[noteIndex].tags,
    updated_at: new Date().toISOString()
  };
  
  if (saveData()) {
    res.json({ 
      success: true,
      message: 'Note updated successfully'
    });
  } else {
    res.status(500).json({ error: 'Failed to save note' });
  }
});

// Delete note
app.delete('/api/notes/:id', (req, res) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid note ID' });
  }
  
  const noteIndex = notes.findIndex(n => n.id === id);
  
  if (noteIndex === -1) {
    return res.status(404).json({ error: 'Note not found' });
  }
  
  notes.splice(noteIndex, 1);
  
  if (saveData()) {
    res.json({ 
      success: true,
      message: 'Note deleted successfully'
    });
  } else {
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// Export all notes
app.get('/api/export', (req, res) => {
  const exportData = {
    version: '1.0',
    exported_at: new Date().toISOString(),
    notes: notes
  };
  
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=knowforge-export.json');
  res.json(exportData);
});

// Import notes
app.post('/api/import', (req, res) => {
  const { notes: importedNotes } = req.body;
  
  if (!Array.isArray(importedNotes)) {
    return res.status(400).json({ error: 'Invalid import data' });
  }
  
  let imported = 0;
  importedNotes.forEach(note => {
    if (note.title && note.content) {
      notes.push({
        id: nextId++,
        title: note.title,
        content: note.content,
        tags: note.tags || '',
        created_at: note.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      imported++;
    }
  });
  
  if (saveData()) {
    res.json({ 
      success: true,
      imported,
      message: `Imported ${imported} notes successfully`
    });
  } else {
    res.status(500).json({ error: 'Failed to save imported notes' });
  }
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
  
  const tags = Object.entries(tagCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  
  res.json(tags);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize
loadData();

// Start server
app.listen(PORT, () => {
  console.log(`✅ KnowForge server running on http://localhost:${PORT}`);
  console.log(`📊 Loaded ${notes.length} notes`);
  console.log(`💾 Backups stored in: ${BACKUP_DIR}`);
});

module.exports = app;