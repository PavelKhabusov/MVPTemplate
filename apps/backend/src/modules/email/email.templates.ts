type EmailLocale = 'en' | 'ru' | 'es' | 'ja'
type TemplateType = 'verification' | 'passwordReset' | 'welcome'

export interface AnnouncementVars {
  subject: string
  title: string
  body: string
  footer?: string
  buttonText?: string
  buttonUrl?: string
}

export function buildAnnouncementEmail(vars: AnnouncementVars): { subject: string; html: string } {
  const footer = vars.footer ?? ''
  const html = buildHtml(vars.title, vars.body, vars.buttonText ?? '', vars.buttonUrl, footer)
  return { subject: vars.subject, html }
}

interface TemplateStrings {
  subject: string
  title: string
  body: string
  buttonText: string
  footer: string
}

const translations: Record<EmailLocale, Record<TemplateType, TemplateStrings>> = {
  en: {
    verification: {
      subject: 'Verify your email address',
      title: 'Email Verification',
      body: 'Hi {{userName}}, please verify your email address by clicking the button below.',
      buttonText: 'Verify Email',
      footer: 'This link expires in 24 hours. If you did not create an account, ignore this email.',
    },
    passwordReset: {
      subject: 'Reset your password',
      title: 'Password Reset',
      body: 'Hi {{userName}}, we received a request to reset your password. Click the button below to set a new password.',
      buttonText: 'Reset Password',
      footer: 'This link expires in 1 hour. If you did not request a password reset, ignore this email.',
    },
    welcome: {
      subject: 'Welcome!',
      title: 'Welcome',
      body: 'Hi {{userName}}, your email has been verified. Welcome aboard!',
      buttonText: 'Open App',
      footer: 'Thank you for joining us.',
    },
  },
  ru: {
    verification: {
      subject: 'Подтвердите ваш email',
      title: 'Подтверждение email',
      body: 'Здравствуйте, {{userName}}! Пожалуйста, подтвердите ваш email, нажав кнопку ниже.',
      buttonText: 'Подтвердить email',
      footer: 'Ссылка действует 24 часа. Если вы не создавали аккаунт, проигнорируйте это письмо.',
    },
    passwordReset: {
      subject: 'Сброс пароля',
      title: 'Сброс пароля',
      body: 'Здравствуйте, {{userName}}! Мы получили запрос на сброс пароля. Нажмите кнопку ниже, чтобы установить новый пароль.',
      buttonText: 'Сбросить пароль',
      footer: 'Ссылка действует 1 час. Если вы не запрашивали сброс пароля, проигнорируйте это письмо.',
    },
    welcome: {
      subject: 'Добро пожаловать!',
      title: 'Добро пожаловать',
      body: 'Здравствуйте, {{userName}}! Ваш email подтверждён. Добро пожаловать!',
      buttonText: 'Открыть приложение',
      footer: 'Спасибо, что присоединились к нам.',
    },
  },
  es: {
    verification: {
      subject: 'Verifica tu correo electrónico',
      title: 'Verificación de correo',
      body: 'Hola {{userName}}, por favor verifica tu correo electrónico haciendo clic en el botón de abajo.',
      buttonText: 'Verificar correo',
      footer: 'Este enlace caduca en 24 horas. Si no creaste una cuenta, ignora este correo.',
    },
    passwordReset: {
      subject: 'Restablecer contraseña',
      title: 'Restablecer contraseña',
      body: 'Hola {{userName}}, recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo.',
      buttonText: 'Restablecer contraseña',
      footer: 'Este enlace caduca en 1 hora. Si no solicitaste un restablecimiento, ignora este correo.',
    },
    welcome: {
      subject: '¡Bienvenido!',
      title: 'Bienvenido',
      body: 'Hola {{userName}}, tu correo ha sido verificado. ¡Bienvenido!',
      buttonText: 'Abrir app',
      footer: 'Gracias por unirte.',
    },
  },
  ja: {
    verification: {
      subject: 'メールアドレスを確認してください',
      title: 'メール確認',
      body: '{{userName}}さん、下のボタンをクリックしてメールアドレスを確認してください。',
      buttonText: 'メールを確認',
      footer: 'このリンクは24時間有効です。アカウントを作成していない場合は、このメールを無視してください。',
    },
    passwordReset: {
      subject: 'パスワードのリセット',
      title: 'パスワードリセット',
      body: '{{userName}}さん、パスワードリセットのリクエストを受け付けました。下のボタンをクリックして新しいパスワードを設定してください。',
      buttonText: 'パスワードをリセット',
      footer: 'このリンクは1時間有効です。リセットをリクエストしていない場合は、このメールを無視してください。',
    },
    welcome: {
      subject: 'ようこそ!',
      title: 'ようこそ',
      body: '{{userName}}さん、メールが確認されました。ようこそ!',
      buttonText: 'アプリを開く',
      footer: 'ご登録ありがとうございます。',
    },
  },
}

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '')
}

function buildHtml(
  title: string,
  body: string,
  buttonText: string,
  buttonUrl: string | undefined,
  footer: string,
): string {
  const buttonHtml = buttonUrl
    ? `<tr><td align="center" style="padding: 24px 0;">
        <a href="${buttonUrl}" style="background-color: #0891B2; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block;">${buttonText}</a>
      </td></tr>`
    : ''

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <tr><td style="background-color: #0891B2; padding: 24px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 20px;">${title}</h1>
        </td></tr>
        <tr><td style="padding: 32px 24px;">
          <p style="margin: 0 0 16px; color: #27272a; font-size: 15px; line-height: 1.6;">${body}</p>
        </td></tr>
        ${buttonHtml}
        <tr><td style="padding: 16px 24px; border-top: 1px solid #e4e4e7;">
          <p style="margin: 0; color: #a1a1aa; font-size: 12px; line-height: 1.5;">${footer}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

export function getEmailTemplate(
  type: TemplateType,
  locale: EmailLocale,
  vars: Record<string, string>,
): { subject: string; html: string } {
  const t = translations[locale]?.[type] ?? translations.en[type]
  const body = interpolate(t.body, vars)
  const buttonUrl = vars.verifyUrl ?? vars.resetUrl ?? (type === 'welcome' ? vars.appUrl : undefined)

  return {
    subject: t.subject,
    html: buildHtml(t.title, body, t.buttonText, buttonUrl, t.footer),
  }
}
