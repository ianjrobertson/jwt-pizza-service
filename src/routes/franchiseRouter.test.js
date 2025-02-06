const request = require('supertest');
const app = require('../service');
const { Role, DB } = require('../database/database.js');

function randomName() {
    return Math.random().toString(36).substring(2, 12);
  }

async function createAdminUser() {
  let user = { password: 'toomanysecrets', roles: [{ role: Role.Admin }] };
  user.name = randomName();
  user.email = user.name + '@admin.com';

  user = await DB.addUser(user);
  return { ...user, password: 'toomanysecrets' };
}


test('list', async () => {
    const listRes = await request(app).get('/api/franchise');
    expect(listRes.status).toBe(200);
})

test('userFranchies', async () => {
    const adminUser = await createAdminUser();

    const loginRes = await request(app).put('/api/auth').send(adminUser);
    expect(loginRes.status).toBe(200);
    const token = loginRes.body.token
    const id = loginRes.body.user.id;

    const franchisesRes = await request(app).get(`/api/franchise/${id}`).set('Authorization', `Bearer ${token}`);
    expect(franchisesRes.status).toBe(200);
})

test('createFranchise', async () => {
    const adminUser = await createAdminUser();

    const loginRes = await request(app).put('/api/auth').send(adminUser);
    expect(loginRes.status).toBe(200);
    const token = loginRes.body.token
    const email = loginRes.body.user.email;
    console.log(email);

    const randomeFranchiseName = randomName();

    const franchise = {name: randomeFranchiseName, admins: [{"email": email}]}
    const createRes = await request(app).post('/api/franchise').set('Authorization', `Bearer ${token}`).send(franchise);
    expect(createRes.status).toBe(200);
})

test('delete', async () => {
  const adminUser = await createAdminUser();

  const loginRes = await request(app).put('/api/auth').send(adminUser);
  expect(loginRes.status).toBe(200);
  const token = loginRes.body.token
  const email = loginRes.body.user.email;
  console.log(email);

  const randomeFranchiseName = randomName();

  const franchise = {name: randomeFranchiseName, admins: [{"email": email}]}
  const createRes = await request(app).post('/api/franchise').set('Authorization', `Bearer ${token}`).send(franchise);
  expect(createRes.status).toBe(200);
  const franchiseId = createRes.id;

  const deleteRes = await request(app).delete(`/api/franchise/${franchiseId}`).set('Authorization', `Bearer ${token}`);
  expect(deleteRes.status).toBe(200);
})

test('createStore', async () => {
  const adminUser = await createAdminUser();

  const loginRes = await request(app).put('/api/auth').send(adminUser);
  expect(loginRes.status).toBe(200);
  const token = loginRes.body.token
  const email = loginRes.body.user.email;
  console.log(email);

  const randomeFranchiseName = randomName();

  const franchise = {name: randomeFranchiseName, admins: [{"email": email}]}
  const createRes = await request(app).post('/api/franchise').set('Authorization', `Bearer ${token}`).send(franchise);
  expect(createRes.status).toBe(200);
  const franchiseId = createRes.body.id;

  const randomeStoreName = randomName();
  const store = {franchiseId: franchiseId, name: randomeStoreName};
  const createStoreRes = await request(app).post(`/api/franchise/${franchiseId}/store`).set('Authorization', `Bearer ${token}`).send(store);
  expect(createStoreRes.status).toBe(200);
})
