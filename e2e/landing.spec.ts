import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test('should load with correct title and hero heading', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Confraria/)
    await expect(page.locator('h1')).toContainText('negócios com propósito')
  })

  test('should display navigation menu items', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('NOSSAS EMPRESAS')).toBeVisible()
    await expect(page.getByText('AREA DE MEMBRO')).toBeVisible()
    await expect(page.getByText('QUERO CONHECER')).toBeVisible()
  })

  test('should navigate to prospect form', async ({ page }) => {
    await page.goto('/quero-conhecer')
    await expect(page.getByText('Confraria Pedra Branca')).toBeVisible()
    await expect(page.getByText('online')).toBeVisible()
  })

  test('should navigate to auth page via menu', async ({ page }) => {
    await page.goto('/')
    await page.getByText('AREA DE MEMBRO').click()
    await page.waitForURL(/\/auth/)
    expect(page.url()).toContain('/auth')
  })
})
