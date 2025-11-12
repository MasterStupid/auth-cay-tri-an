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
    console.log('📊 Getting statistics...');

    const [
      leavesCount,
      studentsCount, 
      teachersCount,
      recentLeaves
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM leaves'),
      pool.query('SELECT COUNT(DISTINCT name) as count FROM leaves'),
      pool.query('SELECT COUNT(DISTINCT teacher) as count FROM leaves'),
      pool.query(`SELECT COUNT(*) as count FROM leaves WHERE created_at >= NOW() - INTERVAL '24 hours'`)
    ]);

    const stats = {
      totalLeaves: parseInt(leavesCount.rows[0].count),
      totalStudents: parseInt(studentsCount.rows[0].count),
      totalTeachers: parseInt(teachersCount.rows[0].count),
      recentLeaves: parseInt(recentLeaves.rows[0].count),
      lastUpdated: new Date().toISOString()
    };

    console.log('✅ Stats retrieved:', stats);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: stats
      })
    };
  } catch (error) {
    console.error('❌ Database error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Lỗi khi lấy thống kê',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
};
