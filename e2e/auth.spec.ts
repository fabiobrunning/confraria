import { test, expect } from '@playwright/test'

test.describe('Authentication - Login Page', () => {
  test('should display login form with phone and password fields', async ({ page }) => {
    await page.goto('/auth')
    await expect(page.getByText('CONFRARIA PEDRA BRANCA')).toBeVisible()
    await expect(page.getByText('Sistema de Gestao de Consorcios')).toBeVisible()
    await expect(page.getByPlaceholder('(00) 00000-0000')).toBeVisible()
    await expect(page.getByRole('button', { name: /Entrar/i })).toBeVisible()
  })

  test('should show forgot password link', async ({ page }) => {
    await page.goto('/auth')
    await expect(page.getByText(/Esqueci a senha/i)).toBeVisible()
  })
})

test.describe('Authentication - Protected Route Redirects', () => {
  const protectedRoutes = [
    '/members',
    '/profile',
    '/dashboard',
    '/companies',
    '/groups',
    '/pre-register',
    '/admin/prospects',
    '/business-transactions',
  ]

  for (const route of protectedRoutes) {
    test(`should redirect ${route} to /auth when not authenticated`, async ({ page }) => {
      await page.goto(route)
      await page.waitForURL(/\/auth/, { timeout: 10000 })
      expect(page.url()).toContain('/auth')
      // Verify login form is actually rendered after redirect
      await expect(page.getByText('CONFRARIA PEDRA BRANCA')).toBeVisible()
    })
  }
})
