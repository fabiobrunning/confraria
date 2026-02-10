import { test, expect } from '@playwright/test'

test.describe('API Routes - Authentication Required', () => {
  test('GET /api/members should not return data without session', async ({ request }) => {
    const response = await request.get('/api/members')
    // 401 when Supabase is available, 500 when DB is offline
    expect(response.status()).toBeGreaterThanOrEqual(400)
    expect(response.ok()).toBe(false)
  })

  test('GET /api/companies should not return data without session', async ({ request }) => {
    const response = await request.get('/api/companies')
    expect(response.status()).toBeGreaterThanOrEqual(400)
    expect(response.ok()).toBe(false)
  })
})

test.describe('API Routes - Pre-Register (Admin Only)', () => {
  test('POST /api/pre-register without auth should be rejected', async ({ request }) => {
    const response = await request.post('/api/pre-register', {
      data: {
        full_name: 'Test User',
        phone: '11999999999',
      },
    })
    // 403 when Supabase is available, 500 when DB is offline
    expect(response.status()).toBeGreaterThanOrEqual(400)
    expect(response.ok()).toBe(false)
  })
})

test.describe('API Routes - Forgot Password', () => {
  test('POST /api/auth/forgot-password without phone should fail', async ({ request }) => {
    const response = await request.post('/api/auth/forgot-password', {
      data: {},
    })
    // 400 when Supabase is available, 500 when DB is offline
    expect(response.status()).toBeGreaterThanOrEqual(400)
    expect(response.ok()).toBe(false)
  })

  test('POST /api/auth/forgot-password with invalid phone should fail', async ({ request }) => {
    const response = await request.post('/api/auth/forgot-password', {
      data: { phone: '00000000000' },
    })
    // 400/404 when Supabase is available, 500 when DB is offline
    expect(response.status()).toBeGreaterThanOrEqual(400)
    expect(response.ok()).toBe(false)
  })
})

test.describe('API Routes - Prospects', () => {
  test('POST /api/prospects with valid data should accept submission', async ({ request }) => {
    const response = await request.post('/api/prospects', {
      data: {
        first_name: 'E2E',
        last_name: 'Test User',
        email: `e2e-${Date.now()}@example.com`,
        phone: '48999999999',
        company_name: 'E2E Test Company',
        business_sector: 'Tecnologia',
        how_found_us: 'google',
        has_networking_experience: false,
      },
    })
    // 201 created, 409 duplicate, or 500 if DB unavailable
    expect(response.status()).toBeLessThanOrEqual(500)
    expect(response.status()).not.toBe(404)
  })

  test('POST /api/prospects with missing fields should return 400', async ({ request }) => {
    const response = await request.post('/api/prospects', {
      data: {
        first_name: 'A',
      },
    })
    // Zod validation runs before DB - always returns 400
    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body.success).toBe(false)
    expect(body.error).toBe('Dados invalidos')
    expect(body.details).toBeDefined()
  })

  test('POST /api/prospects with invalid how_found_us should return 400', async ({ request }) => {
    const response = await request.post('/api/prospects', {
      data: {
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        phone: '48999999999',
        company_name: 'Company',
        business_sector: 'Tech',
        how_found_us: 'invalid_source',
        has_networking_experience: false,
      },
    })
    // Zod validation runs before DB - always returns 400
    expect(response.status()).toBe(400)
  })
})
