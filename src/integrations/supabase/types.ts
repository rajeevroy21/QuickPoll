export type Database = {
  public: {
    Tables: {
      polls: {
        Row: {
          id: string
          question: string
          created_at: string
        }
        Insert: {
          id?: string
          question: string
          created_at?: string
        }
        Update: {
          id?: string
          question?: string
          created_at?: string
        }
      }

      poll_options: {
        Row: {
          id: string
          label: string
          poll_id: string
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          label: string
          poll_id: string
          position?: number
          created_at?: string
        }
        Update: {
          id?: string
          label?: string
          poll_id?: string
          position?: number
          created_at?: string
        }
      }

      votes: {
        Row: {
          id: string
          option_id: string
          poll_id: string
          voter_fingerprint: string
          created_at: string
        }
        Insert: {
          id?: string
          option_id: string
          poll_id: string
          voter_fingerprint: string
          created_at?: string
        }
        Update: {
          id?: string
          option_id?: string
          poll_id?: string
          voter_fingerprint?: string
          created_at?: string
        }
      }
    }
  }
}
