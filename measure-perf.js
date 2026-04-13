const http = require('http');

async function measurePerformance() {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    http.get('http://localhost:8081/', (res) => {
      let dataSize = 0;
      res.on('data', chunk => { dataSize += chunk.length; });
      res.on('end', () => {
        const totalTime = Date.now() - startTime;
        resolve({
          totalLoadTime: totalTime,
          dataSize: dataSize,
          statusCode: res.statusCode
        });
      });
    }).on('error', (err) => {
      resolve({ error: err.message });
    });
  });
}

measurePerformance().then(result => {
  console.log('Performance Measurement:');
  console.log(JSON.stringify(result, null, 2));
});
