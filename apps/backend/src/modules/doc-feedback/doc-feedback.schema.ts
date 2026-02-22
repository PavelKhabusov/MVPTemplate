import { z } from 'zod'

export const submitFeedbackSchema = z.object({
  pageId: z.string().min(1).max(255),
  helpful: z.boolean(),
})

export type SubmitFeedbackInput = z.infer<typeof submitFeedbackSchema>
