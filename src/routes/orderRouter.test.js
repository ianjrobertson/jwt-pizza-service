const request = require('supertest');
const app = require('../service');

const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
let testUserAuthToken;

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

beforeAll(async () => {
    testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
    const registerRes = await request(app).post('/api/auth').send(testUser);
    testUserAuthToken = registerRes.body.token;
    expectValidJwt(testUserAuthToken);
})

function expectValidJwt(potentialJwt) {
    expect(potentialJwt).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);
}

test('getMenu', async () => {
    const menuRes = await request(app).get('/api/order/menu');
    expect(menuRes.status).toBe(200);
})


test('addItem', async () => {
    const user = await createAdminUser();

    const loginRes = await request(app).put('/api/auth').send(user);
    expect(loginRes.status).toBe(200);
    const token = loginRes.body.token

    const item = { title:"Student", description: "No topping, no sauce, just carbs", image:"pizza9.png", price: 0.0001 }
    const addRes = await request(app).put('/api/order/menu').set('Authorization', `Bearer ${token}`).send(item)
    expect(addRes.status).toBe(200);
})

test('createOrder', async () => {
    const loginRes = await request(app).put('/api/auth').send(testUser);
    expect(loginRes.status).toBe(200);
    const token = loginRes.body.token;

    const order = {"franchiseId": 1, "storeId":1, "items":[{ "menuId": 1, "description": "Veggie", "price": 0.05 }]}

    const orderRes = await request(app).post('/api/order').set('Authorization', `Bearer ${token}`).send(order);
    expect(orderRes.status).toBe(200);
})