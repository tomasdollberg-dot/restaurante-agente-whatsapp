export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled'

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Restaurant {
  id: string
  owner_id: string
  name: string
  description: string | null
  address: string | null
  owner_phone: string
  whatsapp_number: string | null
  google_maps_url: string | null
  created_at: string
}

export interface MenuItem {
  id: string
  restaurant_id: string
  name: string
  description: string | null
  price: number
  category: string
  is_available: boolean
  allergens: string[] | null
  created_at: string
}

export interface RestaurantHours {
  id: string
  restaurant_id: string
  day_of_week: number  // 0=Sunday ... 6=Saturday
  open_time: string | null   // "HH:MM"
  close_time: string | null  // "HH:MM"
  open_time_2: string | null  // "HH:MM" second shift
  close_time_2: string | null // "HH:MM" second shift
  is_closed: boolean
}

export interface Reservation {
  id: string
  restaurant_id: string
  customer_name: string
  customer_phone: string
  reservation_date: string  // "YYYY-MM-DD"
  reservation_time: string  // "HH:MM"
  party_size: number
  notes: string | null
  status: ReservationStatus
  created_at: string
}

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface ScheduledMessage {
  id: string
  restaurant_id: string
  customer_phone: string
  message: string
  twilio_number: string
  send_at: string
  sent: boolean
  created_at: string
}

export interface Conversation {
  id: string
  restaurant_id: string
  customer_phone: string
  messages: ConversationMessage[]
  created_at: string
  updated_at: string
}

// Full Database type compatible with Supabase v2.x
export type Database = {
  public: {
    Tables: {
      restaurants: {
        Row: Restaurant
        Insert: Omit<Restaurant, 'id' | 'created_at'>
        Update: Partial<Omit<Restaurant, 'id' | 'owner_id' | 'created_at'>>
        Relationships: []
      }
      menu_items: {
        Row: MenuItem
        Insert: Omit<MenuItem, 'id' | 'created_at'>
        Update: Partial<Omit<MenuItem, 'id' | 'restaurant_id' | 'created_at'>>
        Relationships: []
      }
      restaurant_hours: {
        Row: RestaurantHours
        Insert: Omit<RestaurantHours, 'id'>
        Update: Partial<Omit<RestaurantHours, 'id' | 'restaurant_id'>>
        Relationships: []
      }
      reservations: {
        Row: Reservation
        Insert: Omit<Reservation, 'id' | 'created_at'>
        Update: Partial<Omit<Reservation, 'id' | 'restaurant_id' | 'created_at'>>
        Relationships: []
      }
      conversations: {
        Row: Conversation
        Insert: Omit<Conversation, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Pick<Conversation, 'messages'>>
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_restaurant_id: {
        Args: Record<string, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
