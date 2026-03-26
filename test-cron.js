const cronSecret = 'wealthflow_secret_771'
const url = 'http://wealth-flow-omega.vercel.app/api/cron/update-data'

async function testCron() {
  try {
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${cronSecret}` }
    })
    console.log('Status:', res.status)
    const data = await res.json()
    console.log('Data:', data)
  } catch (e) {
    console.error('Fetch failed. Is the server running on port 3000?', e.message)
  }
}

testCron()
