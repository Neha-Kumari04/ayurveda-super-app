// eslint-disable-next-line @typescript-eslint/no-require-imports
const http = require('http');

describe('Backend Laravel + MySQL API integration', () => {
  const BASE_URL = 'http://127.0.0.1:8001/api/v1';
  let authToken = '';
  let testBookingId = '';
  let testRecordId = '';

  function request(path: string, options: { method?: string; headers?: Record<string, string>; body?: any } = {}): Promise<{ status: number; data: any }> {
    const url = new URL(`${BASE_URL}${path}`);
    return new Promise((resolve, reject) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      };
      let payload: string | null = null;
      if (options.body) {
        payload = JSON.stringify(options.body);
        const nodeBuffer = (globalThis as any).Buffer;
        headers['Content-Length'] = String(nodeBuffer ? nodeBuffer.byteLength(payload) : payload.length);
      }
      const req = http.request(
        url,
        {
          method: options.method || 'GET',
          headers,
        },
        (res: any) => {
          let body = '';
          res.on('data', (chunk: any) => (body += chunk));
          res.on('end', () => {
            try {
              resolve({ status: res.statusCode || 500, data: JSON.parse(body) });
            } catch {
              resolve({ status: res.statusCode || 500, data: body });
            }
          });
        }
      );
      req.on('error', reject);
      if (payload) req.write(payload);
      req.end();
    });
  }

  it('1. GET /config/remote returns valid remote configuration', async () => {
    const res = await request('/config/remote');
    expect(res.status).toBe(200);
    const data = res.data;
    expect(data.flags).toBeDefined();
    expect(data.flags['health.timeline_redesign']).toBe(true);
    expect(data.minSupportedVersion).toBe('1.0.0');
  });

  it('2. POST /auth/login authenticates user and returns token', async () => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: { email: 'asha@example.com', password: 'password123' },
    });
    expect(res.status).toBe(200);
    const data = res.data;
    expect(data.token).toBeDefined();
    expect(data.user).toBeDefined();
    expect(data.user.id).toBe('usr_1');
    expect(data.user.email).toBe('asha@example.com');
    authToken = data.token;
  });

  it('3. GET /doctors returns paginated list of doctors', async () => {
    const res = await request('/doctors?page=1&pageSize=5');
    expect(res.status).toBe(200);
    const data = res.data;
    expect(Array.isArray(data.items)).toBe(true);
    expect(data.items.length).toBeGreaterThanOrEqual(1);
    expect(data.total).toBeGreaterThanOrEqual(1);
    expect(data.items[0].experienceYears).toBeDefined();
    expect(data.items[0].clinicName).toBeDefined();
  });

  it('4. GET /doctors/doc_1 returns specific doctor detail', async () => {
    const res = await request('/doctors/doc_1');
    expect(res.status).toBe(200);
    const doc = res.data;
    expect(doc.id).toBe('doc_1');
    expect(doc.name).toBe('Dr. Rajesh Vaidya');
    expect(doc.specialty).toBe('Panchakarma');
  });

  it('5. GET /doctors/doc_1/slots returns slots', async () => {
    const res = await request('/doctors/doc_1/slots');
    expect(res.status).toBe(200);
    const slots = res.data;
    expect(Array.isArray(slots)).toBe(true);
    expect(slots.length).toBeGreaterThanOrEqual(1);
    expect(slots[0].doctorId).toBe('doc_1');
  });

  it('6. POST /bookings creates a new booking', async () => {
    const res = await request('/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        doctorId: 'doc_1',
        slotId: 'slot_doc_1_0_11',
        patientName: 'Asha Sharma',
        reason: 'Joint wellness consultation',
      },
    });
    expect(res.status).toBe(201);
    const booking = res.data;
    expect(booking.id).toBeDefined();
    expect(booking.doctorId).toBe('doc_1');
    expect(booking.status).toBe('confirmed');
    testBookingId = booking.id;
  });

  it('7. GET /bookings retrieves booking list', async () => {
    const res = await request('/bookings', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.status).toBe(200);
    const bookings = res.data;
    expect(Array.isArray(bookings)).toBe(true);
    expect(bookings.some((b: any) => b.id === testBookingId)).toBe(true);
  });

  it('8. DELETE /bookings/:id cancels the booking', async () => {
    const res = await request(`/bookings/${testBookingId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.status).toBe(200);
    const cancelled = res.data;
    expect(cancelled.id).toBe(testBookingId);
    expect(cancelled.status).toBe('cancelled');
    expect(cancelled.cancelledAt).toBeDefined();
  });

  it('9. GET /products returns product catalog', async () => {
    const res = await request('/products?page=1&pageSize=5');
    expect(res.status).toBe(200);
    const data = res.data;
    expect(Array.isArray(data.items)).toBe(true);
    expect(data.items.length).toBeGreaterThanOrEqual(1);
    expect(data.items[0].price).toBeDefined();
    expect(data.items[0].inStock).toBe(true);
  });

  it('10. GET /products/prod_1 returns single product', async () => {
    const res = await request('/products/prod_1');
    expect(res.status).toBe(200);
    const prod = res.data;
    expect(prod.id).toBe('prod_1');
    expect(prod.name).toContain('Ashwagandha');
    expect(prod.category).toBe('Ashwagandha');
  });

  it('11. GET /records returns health timeline records', async () => {
    const res = await request('/records?page=1&pageSize=5');
    expect(res.status).toBe(200);
    const data = res.data;
    expect(Array.isArray(data.items)).toBe(true);
    expect(data.items.length).toBeGreaterThanOrEqual(1);
    expect(data.items[0].type).toBeDefined();
    expect(data.items[0].date).toBeDefined();
  });

  it('12. POST /records creates a new health record', async () => {
    const res = await request('/records', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        type: 'prescription',
        title: 'New Rasayana Prescription',
        description: 'Triphala Churna 1 tsp before bedtime with warm water.',
        date: new Date().toISOString(),
        provider: 'Dr. Rajesh Vaidya',
        tags: ['routine', 'wellness'],
      },
    });
    expect(res.status).toBe(201);
    const rec = res.data;
    expect(rec.id).toBeDefined();
    expect(rec.title).toBe('New Rasayana Prescription');
    testRecordId = rec.id;
  });

  it('13. GET /records/:id returns the created record', async () => {
    const res = await request(`/records/${testRecordId}`);
    expect(res.status).toBe(200);
    const rec = res.data;
    expect(rec.id).toBe(testRecordId);
    expect(rec.title).toBe('New Rasayana Prescription');
    expect(rec.type).toBe('prescription');
  });
});
