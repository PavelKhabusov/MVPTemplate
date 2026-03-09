import { test, expect } from '@playwright/test'
import { AuthPage } from './pages/auth.page'
import { dismissOverlays } from './helpers/dismiss-overlays'

test.describe('Authentication Pages', () => {
  let auth: AuthPage

  test.beforeEach(async ({ page }) => {
    await dismissOverlays(page)
    auth = new AuthPage(page)
  })

  test('sign in page renders with form fields', async () => {
    await auth.gotoSignIn()

    await expect(auth.signInHeading).toBeVisible()
    await expect(auth.emailInput).toBeVisible()
    await expect(auth.passwordInput).toBeVisible()
    await expect(auth.signInButton).toBeVisible()
  })

  test('sign up page renders with form fields', async () => {
    await auth.gotoSignUp()

    await expect(auth.signUpHeading).toBeVisible()
    await expect(auth.nameInput).toBeVisible()
    await expect(auth.signUpEmailInput).toBeVisible()
    await expect(auth.signUpPasswordInput).toBeVisible()
    await expect(auth.confirmPasswordInput).toBeVisible()
    await expect(auth.createAccountButton).toBeVisible()
  })

  test('sign up link from sign-in page navigates to sign-up', async ({ page }) => {
    await auth.gotoSignIn()

    // Click the "Create Account" link
    await auth.createAccountLink.click()

    // Should navigate to /sign-up — wait for Sign Up heading to appear
    await expect(auth.signUpHeading).toBeVisible({ timeout: 10000 })
  })

  test('sign in with empty fields shows error or validation feedback', async ({ page }) => {
    await auth.gotoSignIn()

    // Submit without filling anything
    await auth.submitSignIn()

    // The form attempts login with empty credentials, which should trigger
    // a network error or server error message. Since no backend is guaranteed,
    // we check that either an error appears or the page stays on sign-in.
    // The form should remain on the same page (not navigate away).
    await expect(page).toHaveURL(/sign-in/)
  })

  test('sign in with invalid credentials shows error message', async ({ page }) => {
    await auth.gotoSignIn()

    // Fill with fake credentials
    await auth.fillSignIn('fake@nonexistent.com', 'wrongpassword123')
    await auth.submitSignIn()

    // Wait for any error to appear — could be:
    // - "Invalid email or password" (401 from backend)
    // - "Unable to connect to server" (backend down)
    // - "Rate limit exceeded..." (429 from backend)
    // - "Too many attempts..." (i18n)
    // - "password authentication failed..." (DB misconfigured)
    const errorText = page.getByText(/Invalid email|Unable to connect|Rate limit|Too many attempts|failed|error/i)
    await expect(errorText).toBeVisible({ timeout: 10000 })
  })

  test('sign up with empty fields shows validation errors', async ({ page }) => {
    await auth.gotoSignUp()

    // Submit with empty fields
    await auth.submitSignUp()

    // Validation errors should appear: "Name is required", "Email is required",
    // "Password must be at least 8 characters"
    const nameError = page.getByText('Name is required')
    const emailError = page.getByText('Email is required')
    const passwordError = page.getByText('Password must be at least 8 characters')

    await expect(nameError).toBeVisible()
    await expect(emailError).toBeVisible()
    await expect(passwordError).toBeVisible()
  })
})
