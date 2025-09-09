import { supabase } from '@/lib/supabase'

export interface LibrarySettings {
  id?: string
  library_name: string
  loan_period_days: number
  max_books_per_user: number
  fine_per_day: number
  created_at?: string
  updated_at?: string
}

export interface ScheduleSettings {
  id?: string
  opening_time: string
  closing_time: string
  working_days: string[] // ['monday', 'tuesday', etc.]
  created_at?: string
  updated_at?: string
}

export interface NotificationSettings {
  id?: string
  notify_upcoming_due: boolean
  notify_overdue: boolean
  notify_new_books: boolean
  notify_available_reservations: boolean
  created_at?: string
  updated_at?: string
}

export interface SecuritySettings {
  id?: string
  require_email_confirmation: boolean
  allow_self_registration: boolean
  enable_activity_log: boolean
  created_at?: string
  updated_at?: string
}

export class SettingsService {
  // Library Settings
  static async getLibrarySettings(): Promise<LibrarySettings | null> {
    try {
      const { data, error } = await supabase
        .from('library_settings')
        .select('*')
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error
      }

      return data || {
        library_name: 'Biblioteca Digital',
        loan_period_days: 14,
        max_books_per_user: 5,
        fine_per_day: 1.00
      }
    } catch (error) {
      console.error('Erro ao buscar configurações da biblioteca:', error)
      return {
        library_name: 'Biblioteca Digital',
        loan_period_days: 14,
        max_books_per_user: 5,
        fine_per_day: 1.00
      }
    }
  }

  static async saveLibrarySettings(settings: Omit<LibrarySettings, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('library_settings')
        .upsert({
          ...settings,
          updated_at: new Date().toISOString()
        })

      if (error) throw error
    } catch (error) {
      console.error('Erro ao salvar configurações da biblioteca:', error)
      throw new Error('Erro ao salvar configurações da biblioteca')
    }
  }

  // Schedule Settings
  static async getScheduleSettings(): Promise<ScheduleSettings | null> {
    try {
      const { data, error } = await supabase
        .from('schedule_settings')
        .select('*')
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return data || {
        opening_time: '08:00',
        closing_time: '18:00',
        working_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      }
    } catch (error) {
      console.error('Erro ao buscar configurações de horário:', error)
      return {
        opening_time: '08:00',
        closing_time: '18:00',
        working_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      }
    }
  }

  static async saveScheduleSettings(settings: Omit<ScheduleSettings, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('schedule_settings')
        .upsert({
          ...settings,
          updated_at: new Date().toISOString()
        })

      if (error) throw error
    } catch (error) {
      console.error('Erro ao salvar configurações de horário:', error)
      throw new Error('Erro ao salvar configurações de horário')
    }
  }

  // Notification Settings
  static async getNotificationSettings(): Promise<NotificationSettings | null> {
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return data || {
        notify_upcoming_due: true,
        notify_overdue: true,
        notify_new_books: true,
        notify_available_reservations: true
      }
    } catch (error) {
      console.error('Erro ao buscar configurações de notificação:', error)
      return {
        notify_upcoming_due: true,
        notify_overdue: true,
        notify_new_books: true,
        notify_available_reservations: true
      }
    }
  }

  static async saveNotificationSettings(settings: Omit<NotificationSettings, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          ...settings,
          updated_at: new Date().toISOString()
        })

      if (error) throw error
    } catch (error) {
      console.error('Erro ao salvar configurações de notificação:', error)
      throw new Error('Erro ao salvar configurações de notificação')
    }
  }

  // Security Settings
  static async getSecuritySettings(): Promise<SecuritySettings | null> {
    try {
      const { data, error } = await supabase
        .from('security_settings')
        .select('*')
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return data || {
        require_email_confirmation: true,
        allow_self_registration: true,
        enable_activity_log: true
      }
    } catch (error) {
      console.error('Erro ao buscar configurações de segurança:', error)
      return {
        require_email_confirmation: true,
        allow_self_registration: true,
        enable_activity_log: true
      }
    }
  }

  static async saveSecuritySettings(settings: Omit<SecuritySettings, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('security_settings')
        .upsert({
          ...settings,
          updated_at: new Date().toISOString()
        })

      if (error) throw error
    } catch (error) {
      console.error('Erro ao salvar configurações de segurança:', error)
      throw new Error('Erro ao salvar configurações de segurança')
    }
  }
}
