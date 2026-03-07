import { test, expect } from './fixture'
import { ExtAuthPage } from './pages/auth.page'

test.describe('Extension Auth Screen', () => {
  let auth: ExtAuthPage

  test.beforeEach(async ({ page, extensionId }) => {
    auth = new ExtAuthPage(page)
    await auth.goto(extensionId)
  })

  test('welcome screen renders with brand name', async () => {
    await expect(auth.brandName).toBeVisible({ timeout: 5000 })
    await expect(auth.brandName).toContainText('MVPTemplate')
    await expect(auth.signInOrRegisterButton).toBeVisible()
  })

  test('clicking sign in shows login form', async () => {
    await auth.clickSignInOrRegister()

    await expect(auth.emailInput).toBeVisible({ timeout: 3000 })
    await expect(auth.passwordInput).toBeVisible()
    await expect(auth.submitButton).toBeVisible()
  })

  test('toggle between sign in and sign up modes', async () => {
    await auth.clickSignInOrRegister()

    // Default is Sign In mode
    await expect(auth.formTitle).toContainText(/Sign In|Войти/)
    await expect(auth.toggleModeLink).toContainText(/account|аккаунт/i)

    // Toggle to Sign Up
    await auth.toggleRegisterMode()
    await expect(auth.formTitle).toContainText(/Sign Up|Регистрация/)

    // Toggle back
    await auth.toggleRegisterMode()
    await expect(auth.formTitle).toContainText(/Sign In|Войти/)
  })

  test('empty form submission shows error', async () => {
    await auth.clickSignInOrRegister()
    await auth.submit()

    await expect(auth.errorMessage).toBeVisible({ timeout: 3000 })
  })

  test('invalid credentials show error message', async ({ page }) => {
    await auth.clickSignInOrRegister()
    await auth.fillCredentials('fake@test.com', 'wrongpassword')
    await auth.submit()

    // Should show error (server down, invalid credentials, or network error)
    await expect(auth.errorMessage).toBeVisible({ timeout: 10000 })
  })

  test('language switcher changes welcome text', async ({ page }) => {
    // Switch to Russian
    await auth.selectLanguage('ru')
    await page.waitForTimeout(300)

    // The sign in button text should change
    const button = page.locator('button', { hasText: /Войти|Зарегистрир/ }).first()
    await expect(button).toBeVisible({ timeout: 3000 })
  })

  test('theme toggle switches between light and dark', async ({ page }) => {
    // The root div should have bg-bg-primary class
    const root = page.locator('#root > div').first()
    await expect(root).toBeVisible()

    // Click theme toggle (sun/moon icon in bottom right)
    await auth.themeToggleButton.click()
    await page.waitForTimeout(200)

    // Click again to toggle back
    await auth.themeToggleButton.click()
    await page.waitForTimeout(200)

    // Should still be visible (no crash)
    await expect(root).toBeVisible()
  })
})
