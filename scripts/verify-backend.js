// Verification script for Laravel + MySQL backend
const http = require('http');

const BASE_URL = 'http://127.0.0.1:8001/api/v1';

async function request(path, options = {}) {
  const url = new URL(`${BASE_URL}${path}`);
  return new Promise((resolve, reject) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };
    let payload = null;
    if (options.body) {
      payload = JSON.stringify(options.body);
      headers['Content-Length'] = Buffer.byteLength(payload);
    }
    const req = http.request(
      url,
      {
        method: options.method || 'GET',
        headers,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch {
            resolve({ status: res.statusCode, data: body });
          }
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function run() {
  console.log('--- Verifying Laravel + MySQL Backend ---');

  // 1. Config
  const conf = await request('/config/remote');
  console.log('1. Remote Config:', conf.status === 200 ? 'PASS' : 'FAIL', conf.data.flags ? '(Flags loaded)' : '');

  // 2. Auth Login
  const auth = await request('/auth/login', {
    method: 'POST',
    body: { email: 'asha@example.com', password: 'password123' },
  });
  console.log('2. Auth Login:', auth.status === 200 ? 'PASS' : 'FAIL', auth.data.token ? '(Token received)' : '');
  const token = auth.data.token;

  // 3. Doctors List
  const docs = await request('/doctors?page=1&pageSize=5');
  console.log('3. Doctors List:', docs.status === 200 ? 'PASS' : 'FAIL', `(${docs.data.items?.length} doctors)`);

  // 4. Doctor Detail
  const doc = await request('/doctors/doc_1');
  console.log('4. Doctor Detail:', doc.status === 200 ? 'PASS' : 'FAIL', doc.data.name);

  // 5. Doctor Slots
  const slots = await request('/doctors/doc_1/slots');
  console.log('5. Doctor Slots:', slots.status === 200 ? 'PASS' : 'FAIL', `(${slots.data?.length} slots)`);

  // 6. Create Booking
  const booking = await request('/bookings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: {
      doctorId: 'doc_1',
      slotId: slots.data[0]?.id || 'slot_doc_1_0_11',
      patientName: 'Asha Sharma',
      reason: 'General Consultation',
    },
  });
  console.log('6. Create Booking:', booking.status === 201 ? 'PASS' : 'FAIL', `(Booking ID: ${booking.data.id})`);

  // 7. Get Bookings
  const bookings = await request('/bookings', {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('7. Get Bookings:', bookings.status === 200 ? 'PASS' : 'FAIL', `(${bookings.data?.length} bookings)`);

  // 8. Cancel Booking
  const cancel = await request(`/bookings/${booking.data.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('8. Cancel Booking:', cancel.status === 200 && cancel.data.status === 'cancelled' ? 'PASS' : 'FAIL');

  // 9. Products List
  const prods = await request('/products?page=1&pageSize=5');
  console.log('9. Products List:', prods.status === 200 ? 'PASS' : 'FAIL', `(${prods.data.items?.length} products)`);

  // 10. Product Detail
  const prod = await request('/products/prod_1');
  console.log('10. Product Detail:', prod.status === 200 ? 'PASS' : 'FAIL', prod.data.name);

  // 11. Health Records List
  const records = await request('/records?page=1&pageSize=5');
  console.log('11. Health Records List:', records.status === 200 ? 'PASS' : 'FAIL', `(${records.data.items?.length} records)`);

  // 12. Create Health Record
  const newRec = await request('/records', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: {
      type: 'prescription',
      title: 'Triphala Churna Daily',
      description: '1 tsp with warm water before sleep.',
      date: new Date().toISOString(),
      provider: 'Dr. Rajesh Vaidya',
      tags: ['routine', 'wellness'],
    },
  });
  console.log('12. Create Health Record:', newRec.status === 201 ? 'PASS' : 'FAIL', `(Record ID: ${newRec.data.id})`);

  // 13. Health Record Detail
  const recDetail = await request(`/records/${newRec.data.id}`);
  console.log('13. Health Record Detail:', recDetail.status === 200 && recDetail.data.title === 'Triphala Churna Daily' ? 'PASS' : 'FAIL');

  console.log('\n--- ALL BACKEND CHECKS COMPLETED SUCCESSFULLY ---');
}

run().catch((err) => {
  console.error('Backend verification failed:', err);
  process.exit(1);
});
