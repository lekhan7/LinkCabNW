const http = require('http');

function testRoute(path, description) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log(`\n📍 ${description}`);
        console.log(`📡 Request: GET ${path}`);
        console.log(`📊 Status: ${res.statusCode}`);
        
        try {
          const jsonData = JSON.parse(data);
          if (res.statusCode === 401 || res.statusCode === 403) {
            console.log('🔐 Authentication required (expected)');
          } else if (res.statusCode === 404) {
            console.log('❌ Route not found');
          } else {
            console.log('✅ Route exists and responds');
          }
          console.log(`📝 Response: ${JSON.stringify(jsonData).substring(0, 150)}...`);
        } catch (e) {
          console.log(`📝 Raw Response: ${data.substring(0, 150)}...`);
        }
        resolve();
      });
    });

    req.on('error', (err) => {
      console.log(`\n❌ ${description}`);
      console.log(`📡 Request: GET ${path}`);
      console.log(`❌ Error: ${err.message}`);
      resolve();
    });

    req.end();
  });
}

async function testAllRoutes() {
  console.log('🧪 Testing Analytics Routes...\n');
  
  const routes = [
    {
      path: '/api/user-analytics/ratings',
      description: 'Current User Ratings'
    },
    {
      path: '/api/user-analytics/ratings/7132d2a8-7e8c-4264-8263-b43abf7f2b19',
      description: 'Specific User Ratings'
    },
    {
      path: '/api/user-analytics/reviews?limit=10',
      description: 'Current User Reviews'
    },
    {
      path: '/api/user-analytics/reviews/7132d2a8-7e8c-4264-8263-b43abf7f2b19?limit=10',
      description: 'Specific User Reviews'
    },
    {
      path: '/api/user-analytics/completed-rides?limit=50',
      description: 'Current User Completed Rides'
    },
    {
      path: '/api/user-analytics/completed-rides/7132d2a8-7e8c-4264-8263-b43abf7f2b19?limit=50',
      description: 'Specific User Completed Rides'
    }
  ];

  for (const route of routes) {
    await testRoute(route.path, route.description);
  }

  console.log('\n🏁 Route testing complete!');
}

testAllRoutes().catch(console.error);
