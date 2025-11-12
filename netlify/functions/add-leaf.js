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

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { name, teacher, message, x, y, type, gradient } = body;

    console.log('📝 Adding new leaf:', { name, teacher });

    // Validate input
    if (!name || !teacher || !message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Thiếu thông tin bắt buộc: name, teacher, message'
        })
      };
    }

    const result = await pool.query(
      `INSERT INTO leaves (name, teacher, message, x, y, type, gradient) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [name, teacher, message, x || 200, y || 150, type || 'heart', gradient || 'gradient-1']
    );

    console.log('✅ Leaf added successfully:', result.rows[0].id);

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        success: true,
        data: result.rows[0]
      })
    };
  } catch (error) {
    console.error('❌ Database error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Lỗi khi lưu dữ liệu vào database',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
};
