import type { WelcomeLanguage } from './welcome-content.ts';
export interface WelcomeRow {
  id: string; user_id: string; email: string; language: WelcomeLanguage;
  voucher_code: string; expires_at: string; created_at: string; status: string;
  first_name: string | null; brevo_message_id: string | null;
}
export interface WelcomeStore {
  reserve(input: { userId: string; email: string; lang: WelcomeLanguage; firstName: string | null; test: boolean }): Promise<WelcomeRow>;
  claim(row: WelcomeRow, allowed: string[], next: string): Promise<boolean>;
  update(id: string, values: Record<string, unknown>): Promise<void>;
}
export interface ProviderResult { ok: boolean; uncertain?: boolean; status: number; messageId?: string }
