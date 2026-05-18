const { pool, initializeTables } = require('../src/config/database');

beforeAll(async () => {
  try {
    await initializeTables();
    console.log('✅ Tables initialized in test database');
  } catch (error) {
    console.error('❌ Table initialization failed:', error.message);
  }
});

afterAll(async () => {
  try {
    await pool.end();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Teardown error:', error.message);
  }
});

