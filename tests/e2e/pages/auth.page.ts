import { type Page, type Locator } from '@playwright/test'

/**
 * Page Object Model for Sign In and Sign Up pages.
 */
export class AuthPage {
  readonly page: Page

  // Sign In
  readonly signInHeading: Locator
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly signInButton: Locator
  readonly forgotPasswordLink: Locator
  readonly createAccountLink: Locator

  // Sign Up
  readonly signUpHeading: Locator
  readonly nameInput: Locator
  readonly signUpEmailInput: Locator
  readonly signUpPasswordInput: Locator
  readonly confirmPasswordInput: Locator
  readonly createAccountButton: Locator
  readonly signInLink: Locator

  constructor(page: Page) {
    this.page = page

    // Sign In page elements
    this.signInHeading = page.getByRole('heading', { name: 'Sign In' })
    this.emailInput = page.getByPlaceholder('email@example.com')
    this.passwordInput = page.getByPlaceholder('********').first()
    this.signInButton = page.getByRole('button', { name: 'Sign In' })
    this.forgotPasswordLink = page.getByText('Forgot Password?')
    this.createAccountLink = page.getByText('Create Account').first()

    // Sign Up page elements
    this.signUpHeading = page.getByRole('heading', { name: 'Sign Up' })
    this.nameInput = page.getByPlaceholder('John Doe')
    this.signUpEmailInput = page.getByPlaceholder('email@example.com')
    this.signUpPasswordInput = page.getByPlaceholder('********').first()
    this.confirmPasswordInput = page.getByPlaceholder('********').last()
    this.createAccountButton = page.getByRole('button', { name: 'Create Account' })
    this.signInLink = page.getByText('Sign In').last()
  }

  async gotoSignIn() {
    await this.page.goto('/sign-in')
    await this.page.waitForLoadState('networkidle')
  }

  async gotoSignUp() {
    await this.page.goto('/sign-up')
    await this.page.waitForLoadState('networkidle')
  }

  async fillSignIn(email: string, password: string) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
  }

  async submitSignIn() {
    await this.signInButton.click()
  }

  async fillSignUp(name: string, email: string, password: string, confirmPassword: string) {
    await this.nameInput.fill(name)
    await this.signUpEmailInput.fill(email)
    await this.signUpPasswordInput.fill(password)
    await this.confirmPasswordInput.fill(confirmPassword)
  }

  async submitSignUp() {
    await this.createAccountButton.click()
  }
}
