'use strict';

module.exports = function (app) {

  // In-memory store per project
  const issuesByProject = new Map();

  function getProjectStore(project) {
    if (!issuesByProject.has(project)) issuesByProject.set(project, []);
    return issuesByProject.get(project);
  }

  function generateId() {
    // Simple unique id using timestamp + random
    return (
      Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
    ).toUpperCase();
  }

  app.route('/api/issues/:project')
  
    .get(function (req, res){
      let project = req.params.project;
      const store = getProjectStore(project);
      const query = req.query || {};
      const filtered = store.filter(issue => {
        return Object.keys(query).every(key => {
          // allow filter by any field; string compare and boolean for open
          if (key === 'open') {
            const q = query[key];
            const val = typeof q === 'string' ? q.toLowerCase() === 'true' : !!q;
            return issue.open === val;
          }
          return String(issue[key]) === String(query[key]);
        });
      });
      res.json(filtered);
    })
    
    .post(function (req, res){
      let project = req.params.project;
      const {
        issue_title,
        issue_text,
        created_by,
        assigned_to = '',
        status_text = ''
      } = req.body || {};

      if (!issue_title || !issue_text || !created_by) {
        return res.json({ error: 'required field(s) missing' });
      }

      const store = getProjectStore(project);
      const now = new Date();
      const doc = {
        _id: generateId(),
        issue_title,
        issue_text,
        created_by,
        assigned_to,
        status_text,
        created_on: now,
        updated_on: now,
        open: true
      };
      store.push(doc);
      res.json(doc);
    })
    
    .put(function (req, res){
      let project = req.params.project;
      const {
        _id,
        issue_title,
        issue_text,
        created_by,
        assigned_to,
        status_text,
        open
      } = req.body || {};

      if (!_id) {
        return res.json({ error: 'missing _id' });
      }

      // Determine if there are any fields to update (besides _id)
      const fields = { issue_title, issue_text, created_by, assigned_to, status_text, open };
      const hasUpdates = Object.keys(fields).some(k => fields[k] !== undefined && fields[k] !== '');
      if (!hasUpdates) {
        return res.json({ error: 'no update field(s) sent', _id });
      }

      const store = getProjectStore(project);
      const idx = store.findIndex(i => String(i._id) === String(_id));
      if (idx === -1) {
        return res.json({ error: 'could not update', _id });
      }

      const issue = store[idx];
      if (issue_title !== undefined) issue.issue_title = issue_title;
      if (issue_text !== undefined) issue.issue_text = issue_text;
      if (created_by !== undefined) issue.created_by = created_by;
      if (assigned_to !== undefined) issue.assigned_to = assigned_to;
      if (status_text !== undefined) issue.status_text = status_text;
      if (open !== undefined) issue.open = open === true || open === 'true' ? true : false;
      issue.updated_on = new Date();

      res.json({ result: 'successfully updated', _id });
    })
    
    .delete(function (req, res){
      let project = req.params.project;
      const { _id } = req.body || {};
      if (!_id) {
        return res.json({ error: 'missing _id' });
      }
      const store = getProjectStore(project);
      const idx = store.findIndex(i => String(i._id) === String(_id));
      if (idx === -1) {
        return res.json({ error: 'could not delete', _id });
      }
      store.splice(idx, 1);
      res.json({ result: 'successfully deleted', _id });
    });
    
};
