const request = require('supertest');
const app = require('../server');

describe('KnowForge API Tests', () => {
  // Clean up before tests
  beforeEach(() => {
    // Reset test data if needed
  });

  describe('POST /api/notes', () => {
    it('should create a new note', async () => {
      const response = await request(app)
        .post('/api/notes')
        .send({
          title: 'Test Note',
          content: 'This is a test note',
          tags: 'test,note'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Note created');
      expect(response.body.id).toBeDefined();
    });

    it('should return error for missing title', async () => {
      const response = await request(app)
        .post('/api/notes')
        .send({
          content: 'This is a test note'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Title and content required');
    });
  });

  describe('GET /api/notes', () => {
    it('should return all notes', async () => {
      const response = await request(app)
        .get('/api/notes');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should search notes', async () => {
      // First create a note
      await request(app)
        .post('/api/notes')
        .send({
          title: 'Search Test',
          content: 'This is searchable content',
          tags: 'search'
        });

      // Then search
      const response = await request(app)
        .get('/api/notes?search=searchable');
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('PUT /api/notes/:id', () => {
    it('should update a note', async () => {
      // Create a note first
      const createRes = await request(app)
        .post('/api/notes')
        .send({
          title: 'Update Test',
          content: 'Original content'
        });
      
      const noteId = createRes.body.id;

      // Update it
      const response = await request(app)
        .put(`/api/notes/${noteId}`)
        .send({
          title: 'Updated Title',
          content: 'Updated content'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Note updated');
    });
  });

  describe('DELETE /api/notes/:id', () => {
    it('should delete a note', async () => {
      // Create a note first
      const createRes = await request(app)
        .post('/api/notes')
        .send({
          title: 'Delete Test',
          content: 'To be deleted'
        });
      
      const noteId = createRes.body.id;

      // Delete it
      const response = await request(app)
        .delete(`/api/notes/${noteId}`);
      
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Note deleted');
    });
  });
});