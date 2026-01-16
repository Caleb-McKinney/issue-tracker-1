const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
	const project = 'apitest';
	let createdId;

	test('Create an issue with every field: POST /api/issues/{project}', function(done) {
		chai.request(server)
			.post(`/api/issues/${project}`)
			.send({
				issue_title: 'Full fields',
				issue_text: 'Text with all fields',
				created_by: 'Tester',
				assigned_to: 'Dev',
				status_text: 'In QA'
			})
			.end((err, res) => {
				assert.equal(res.status, 200);
				assert.isObject(res.body);
				assert.exists(res.body._id);
				createdId = res.body._id;
				assert.equal(res.body.issue_title, 'Full fields');
				assert.equal(res.body.issue_text, 'Text with all fields');
				assert.equal(res.body.created_by, 'Tester');
				assert.equal(res.body.assigned_to, 'Dev');
				assert.equal(res.body.status_text, 'In QA');
				assert.isTrue(res.body.open);
				assert.exists(res.body.created_on);
				assert.exists(res.body.updated_on);
				done();
			});
	});

	test('Create an issue with only required fields: POST /api/issues/{project}', function(done) {
		chai.request(server)
			.post(`/api/issues/${project}`)
			.send({
				issue_title: 'Required only',
				issue_text: 'Text only required',
				created_by: 'Tester'
			})
			.end((err, res) => {
				assert.equal(res.status, 200);
				assert.isObject(res.body);
				assert.exists(res.body._id);
				assert.equal(res.body.assigned_to, '');
				assert.equal(res.body.status_text, '');
				done();
			});
	});

	test('Create an issue with missing required fields: POST /api/issues/{project}', function(done) {
		chai.request(server)
			.post(`/api/issues/${project}`)
			.send({ issue_title: 'Missing fields' })
			.end((err, res) => {
				assert.equal(res.status, 200);
				assert.deepEqual(res.body, { error: 'required field(s) missing' });
				done();
			});
	});

	test('View issues on a project: GET /api/issues/{project}', function(done) {
		chai.request(server)
			.get(`/api/issues/${project}`)
			.end((err, res) => {
				assert.equal(res.status, 200);
				assert.isArray(res.body);
				assert.isAtLeast(res.body.length, 2);
				done();
			});
	});

	test('View issues on a project with one filter: GET /api/issues/{project}', function(done) {
		chai.request(server)
			.get(`/api/issues/${project}?created_by=Tester`)
			.end((err, res) => {
				assert.equal(res.status, 200);
				assert.isArray(res.body);
				res.body.forEach(i => assert.equal(i.created_by, 'Tester'));
				done();
			});
	});

	test('View issues on a project with multiple filters: GET /api/issues/{project}', function(done) {
		chai.request(server)
			.get(`/api/issues/${project}?created_by=Tester&open=true`)
			.end((err, res) => {
				assert.equal(res.status, 200);
				assert.isArray(res.body);
				res.body.forEach(i => {
					assert.equal(i.created_by, 'Tester');
					assert.isTrue(i.open);
				});
				done();
			});
	});

	test('Update one field on an issue: PUT /api/issues/{project}', function(done) {
		chai.request(server)
			.put(`/api/issues/${project}`)
			.send({ _id: createdId, issue_title: 'Updated title' })
			.end((err, res) => {
				assert.equal(res.status, 200);
				assert.deepEqual(res.body, { result: 'successfully updated', _id: createdId });
				done();
			});
	});

	test('Update multiple fields on an issue: PUT /api/issues/{project}', function(done) {
		chai.request(server)
			.put(`/api/issues/${project}`)
			.send({ _id: createdId, issue_text: 'Updated text', open: false })
			.end((err, res) => {
				assert.equal(res.status, 200);
				assert.deepEqual(res.body, { result: 'successfully updated', _id: createdId });
				done();
			});
	});

	test('Update an issue with missing _id: PUT /api/issues/{project}', function(done) {
		chai.request(server)
			.put(`/api/issues/${project}`)
			.send({ issue_text: 'No id' })
			.end((err, res) => {
				assert.equal(res.status, 200);
				assert.deepEqual(res.body, { error: 'missing _id' });
				done();
			});
	});

	test('Update an issue with no fields to update: PUT /api/issues/{project}', function(done) {
		chai.request(server)
			.put(`/api/issues/${project}`)
			.send({ _id: createdId })
			.end((err, res) => {
				assert.equal(res.status, 200);
				assert.deepEqual(res.body, { error: 'no update field(s) sent', _id: createdId });
				done();
			});
	});

	test('Update an issue with an invalid _id: PUT /api/issues/{project}', function(done) {
		const badId = 'INVALIDID';
		chai.request(server)
			.put(`/api/issues/${project}`)
			.send({ _id: badId, issue_text: 'Try update' })
			.end((err, res) => {
				assert.equal(res.status, 200);
				assert.deepEqual(res.body, { error: 'could not update', _id: badId });
				done();
			});
	});

	test('Delete an issue: DELETE /api/issues/{project}', function(done) {
		chai.request(server)
			.delete(`/api/issues/${project}`)
			.send({ _id: createdId })
			.end((err, res) => {
				assert.equal(res.status, 200);
				assert.deepEqual(res.body, { result: 'successfully deleted', _id: createdId });
				done();
			});
	});

	test('Delete an issue with an invalid _id: DELETE /api/issues/{project}', function(done) {
		const badId = 'BADID';
		chai.request(server)
			.delete(`/api/issues/${project}`)
			.send({ _id: badId })
			.end((err, res) => {
				assert.equal(res.status, 200);
				assert.deepEqual(res.body, { error: 'could not delete', _id: badId });
				done();
			});
	});

	test('Delete an issue with missing _id: DELETE /api/issues/{project}', function(done) {
		chai.request(server)
			.delete(`/api/issues/${project}`)
			.send({ })
			.end((err, res) => {
				assert.equal(res.status, 200);
				assert.deepEqual(res.body, { error: 'missing _id' });
				done();
			});
	});
});
