import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(255),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
})

export const refreshSchema = z.object({
  refreshToken: z.string().min(1).max(2048),
})

export const googleAuthSchema = z.object({
  idToken: z.string().min(1),
})

export const verifyEmailSchema = z.object({
  token: z.string().min(1).max(256),
})

export const requestPasswordResetSchema = z.object({
  email: z.string().email(),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1).max(256),
  password: z.string().min(8).max(128),
})

export const resendVerificationSchema = z.object({
  locale: z.enum(['en', 'ru', 'es', 'ja']).optional().default('en'),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type RefreshInput = z.infer<typeof refreshSchema>
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>
