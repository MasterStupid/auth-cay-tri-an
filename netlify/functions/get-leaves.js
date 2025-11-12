const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    console.log('📥 Getting leaves from database...');
    
    const result = await pool.query(`
      SELECT id, name, teacher, message, x, y, type, gradient, created_at 
      FROM leaves 
      ORDER BY created_at DESC 
      LIMIT 1000
    `);
    
    console.log(`✅ Found ${result.rows.length} leaves`);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: result.rows
      })
    };
  } catch (error) {
    console.error('❌ Database error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Lỗi khi tải dữ liệu từ database',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
};
