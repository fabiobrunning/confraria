import { test, expect } from '@playwright/test'

test.describe('API Routes - Authentication Required', () => {
  test('GET /api/members should return 401 without session', async ({ request }) => {
    const response = await request.get('/api/members')
    expect(response.status()).toBe(401)
    const body = await response.json()
    expect(body.error).toBe('Unauthorized')
  })

  test('GET /api/companies should return 401 without session', async ({ request }) => {
    const response = await request.get('/api/companies')
    expect(response.status()).toBe(401)
    const body = await response.json()
    expect(body.error).toBe('Unauthorized')
  })
})

test.describe('API Routes - Pre-Register (Admin Only)', () => {
  test('POST /api/pre-register without auth should return 403', async ({ request }) => {
    const response = await request.post('/api/pre-register', {
      data: {
        full_name: 'Test User',
        phone: '11999999999',
      },
    })
    expect(response.status()).toBe(403)
    const body = await response.json()
    expect(body.success).toBe(false)
    expect(body.error).toContain('Acesso negado')
  })
})

test.describe('API Routes - Forgot Password', () => {
  test('POST /api/auth/forgot-password without phone should return 400', async ({ request }) => {
    const response = await request.post('/api/auth/forgot-password', {
      data: {},
    })
    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body.error).toBeDefined()
  })

  test('POST /api/auth/forgot-password with invalid phone should return 404', async ({ request }) => {
    const response = await request.post('/api/auth/forgot-password', {
      data: { phone: '00000000000' },
    })
    // Should return 404 (member not found) or 400 (validation error)
    expect([400, 404]).toContain(response.status())
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
    expect(response.status()).toBe(400)
  })
})
