export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      admin_feedback_requests: {
        Row: {
          chat_id: string | null
          created_at: string
          id: string
          message: string | null
          status: string
          updated_at: string
          user_id: string
          user_video_id: string
        }
        Insert: {
          chat_id?: string | null
          created_at?: string
          id?: string
          message?: string | null
          status?: string
          updated_at?: string
          user_id: string
          user_video_id: string
        }
        Update: {
          chat_id?: string | null
          created_at?: string
          id?: string
          message?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          user_video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_feedback_requests_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "video_chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_feedback_requests_user_video_id_fkey"
            columns: ["user_video_id"]
            isOneToOne: false
            referencedRelation: "user_recordings"
            referencedColumns: ["id"]
          },
        ]
      }
      assistant_conversations: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      assistant_messages: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string
          feedback: string | null
          id: string
          language: string | null
          mode: string | null
          role: string
          used_source_ids: string[] | null
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string
          feedback?: string | null
          id?: string
          language?: string | null
          mode?: string | null
          role: string
          used_source_ids?: string[] | null
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string
          feedback?: string | null
          id?: string
          language?: string | null
          mode?: string | null
          role?: string
          used_source_ids?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "assistant_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "assistant_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      assistant_unanswered_questions: {
        Row: {
          admin_response: string | null
          created_at: string
          detected_intent: string | null
          id: string
          language: string | null
          question: string
          resolved_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          admin_response?: string | null
          created_at?: string
          detected_intent?: string | null
          id?: string
          language?: string | null
          question: string
          resolved_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          admin_response?: string | null
          created_at?: string
          detected_intent?: string | null
          id?: string
          language?: string | null
          question?: string
          resolved_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      classroom_participants: {
        Row: {
          classroom_id: string
          id: string
          invited_at: string
          joined_at: string | null
          left_at: string | null
          user_id: string
        }
        Insert: {
          classroom_id: string
          id?: string
          invited_at?: string
          joined_at?: string | null
          left_at?: string | null
          user_id: string
        }
        Update: {
          classroom_id?: string
          id?: string
          invited_at?: string
          joined_at?: string | null
          left_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classroom_participants_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
        ]
      }
      classrooms: {
        Row: {
          created_at: string
          ended_at: string | null
          host_id: string
          id: string
          is_live: boolean
          is_recording: boolean
          max_participants: number
          scheduled_at: string | null
          title: string | null
          visibility: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          host_id: string
          id?: string
          is_live?: boolean
          is_recording?: boolean
          max_participants?: number
          scheduled_at?: string | null
          title?: string | null
          visibility?: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          host_id?: string
          id?: string
          is_live?: boolean
          is_recording?: boolean
          max_participants?: number
          scheduled_at?: string | null
          title?: string | null
          visibility?: string
        }
        Relationships: []
      }
      digimember_products: {
        Row: {
          app_plan: string | null
          checkout_url: string | null
          created_at: string
          id: string
          is_active: boolean
          last_synced_at: string
          name: string
          product_id: string
          type: string | null
          updated_at: string
        }
        Insert: {
          app_plan?: string | null
          checkout_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_synced_at?: string
          name: string
          product_id: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          app_plan?: string | null
          checkout_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_synced_at?: string
          name?: string
          product_id?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          id: string
          is_enabled: boolean
          key: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          is_enabled?: boolean
          key: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          is_enabled?: boolean
          key?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          created_at: string
          date: string
          id: string
          minutes: number
          mood: number | null
          notes: string | null
          tags: string[] | null
          updated_at: string
          user_id: string
          video_ids: string[] | null
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          minutes?: number
          mood?: number | null
          notes?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
          video_ids?: string[] | null
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          minutes?: number
          mood?: number | null
          notes?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
          video_ids?: string[] | null
        }
        Relationships: []
      }
      knowledge_chunks: {
        Row: {
          chunk_text: string
          chunk_text_en: string | null
          chunk_text_es: string | null
          created_at: string
          embedding_json: Json | null
          embedding_json_en: Json | null
          embedding_json_es: Json | null
          id: string
          plan_required: string
          source_id: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          chunk_text: string
          chunk_text_en?: string | null
          chunk_text_es?: string | null
          created_at?: string
          embedding_json?: Json | null
          embedding_json_en?: Json | null
          embedding_json_es?: Json | null
          id?: string
          plan_required?: string
          source_id?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          chunk_text?: string
          chunk_text_en?: string | null
          chunk_text_es?: string | null
          created_at?: string
          embedding_json?: Json | null
          embedding_json_en?: Json | null
          embedding_json_es?: Json | null
          id?: string
          plan_required?: string
          source_id?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_chunks_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "knowledge_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_sources: {
        Row: {
          content: string | null
          content_en: string | null
          content_es: string | null
          created_at: string
          id: string
          language: string
          tags: string[] | null
          title: string
          title_en: string | null
          title_es: string | null
          type: string
          updated_at: string
          visibility: string
        }
        Insert: {
          content?: string | null
          content_en?: string | null
          content_es?: string | null
          created_at?: string
          id?: string
          language?: string
          tags?: string[] | null
          title: string
          title_en?: string | null
          title_es?: string | null
          type: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          content?: string | null
          content_en?: string | null
          content_es?: string | null
          created_at?: string
          id?: string
          language?: string
          tags?: string[] | null
          title?: string
          title_en?: string | null
          title_es?: string | null
          type?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: []
      }
      levels: {
        Row: {
          created_at: string
          description: string | null
          description_en: string | null
          description_es: string | null
          difficulty: string | null
          id: string
          is_active: boolean
          language: string | null
          required_plan: string | null
          required_plan_key: string | null
          sort_order: number
          thumbnail_url: string | null
          title: string
          title_en: string | null
          title_es: string | null
          updated_at: string
          vimeo_showcase_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          description_en?: string | null
          description_es?: string | null
          difficulty?: string | null
          id?: string
          is_active?: boolean
          language?: string | null
          required_plan?: string | null
          required_plan_key?: string | null
          sort_order?: number
          thumbnail_url?: string | null
          title: string
          title_en?: string | null
          title_es?: string | null
          updated_at?: string
          vimeo_showcase_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          description_en?: string | null
          description_es?: string | null
          difficulty?: string | null
          id?: string
          is_active?: boolean
          language?: string | null
          required_plan?: string | null
          required_plan_key?: string | null
          sort_order?: number
          thumbnail_url?: string | null
          title?: string
          title_en?: string | null
          title_es?: string | null
          updated_at?: string
          vimeo_showcase_id?: string
        }
        Relationships: []
      }
      musicxml_audio_tracks: {
        Row: {
          audio_url: string
          created_at: string
          duration: number | null
          id: string
          musicxml_document_id: string
          original_filename: string
          sort_index: number
          title: string
        }
        Insert: {
          audio_url: string
          created_at?: string
          duration?: number | null
          id?: string
          musicxml_document_id: string
          original_filename: string
          sort_index?: number
          title: string
        }
        Update: {
          audio_url?: string
          created_at?: string
          duration?: number | null
          id?: string
          musicxml_document_id?: string
          original_filename?: string
          sort_index?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "musicxml_audio_tracks_musicxml_document_id_fkey"
            columns: ["musicxml_document_id"]
            isOneToOne: false
            referencedRelation: "musicxml_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      musicxml_documents: {
        Row: {
          category: string | null
          category_en: string | null
          category_es: string | null
          created_at: string
          id: string
          is_active: boolean
          language: string | null
          level_id: string | null
          plan_required: string
          sort_index: number
          title: string
          title_en: string | null
          title_es: string | null
          updated_at: string
          xml_file_url: string
        }
        Insert: {
          category?: string | null
          category_en?: string | null
          category_es?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          language?: string | null
          level_id?: string | null
          plan_required?: string
          sort_index?: number
          title: string
          title_en?: string | null
          title_es?: string | null
          updated_at?: string
          xml_file_url: string
        }
        Update: {
          category?: string | null
          category_en?: string | null
          category_es?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          language?: string | null
          level_id?: string | null
          plan_required?: string
          sort_index?: number
          title?: string
          title_en?: string | null
          title_es?: string | null
          updated_at?: string
          xml_file_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "musicxml_documents_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
        ]
      }
      musicxml_user_annotations: {
        Row: {
          annotation_type: string
          bar_number: number
          color: string | null
          content: string | null
          created_at: string
          id: string
          musicxml_document_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          annotation_type?: string
          bar_number: number
          color?: string | null
          content?: string | null
          created_at?: string
          id?: string
          musicxml_document_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          annotation_type?: string
          bar_number?: number
          color?: string | null
          content?: string | null
          created_at?: string
          id?: string
          musicxml_document_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "musicxml_user_annotations_musicxml_document_id_fkey"
            columns: ["musicxml_document_id"]
            isOneToOne: false
            referencedRelation: "musicxml_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      musicxml_user_state: {
        Row: {
          is_concert_pitch: boolean | null
          last_bar: number | null
          last_tempo: number | null
          musicxml_document_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          is_concert_pitch?: boolean | null
          last_bar?: number | null
          last_tempo?: number | null
          musicxml_document_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          is_concert_pitch?: boolean | null
          last_bar?: number | null
          last_tempo?: number | null
          musicxml_document_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "musicxml_user_state_musicxml_document_id_fkey"
            columns: ["musicxml_document_id"]
            isOneToOne: false
            referencedRelation: "musicxml_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_audio_tracks: {
        Row: {
          audio_url: string
          created_at: string
          duration: number | null
          id: string
          level_id: string | null
          original_filename: string
          page_number: number
          pdf_document_id: string
          sort_index: number
          title: string
        }
        Insert: {
          audio_url: string
          created_at?: string
          duration?: number | null
          id?: string
          level_id?: string | null
          original_filename: string
          page_number: number
          pdf_document_id: string
          sort_index?: number
          title: string
        }
        Update: {
          audio_url?: string
          created_at?: string
          duration?: number | null
          id?: string
          level_id?: string | null
          original_filename?: string
          page_number?: number
          pdf_document_id?: string
          sort_index?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdf_audio_tracks_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdf_audio_tracks_pdf_document_id_fkey"
            columns: ["pdf_document_id"]
            isOneToOne: false
            referencedRelation: "pdf_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_documents: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          description_en: string | null
          description_es: string | null
          id: string
          is_active: boolean
          language: string | null
          level_id: string | null
          page_count: number
          pdf_file_url: string
          plan_required: string
          sort_index: number
          title: string
          title_en: string | null
          title_es: string | null
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          description_en?: string | null
          description_es?: string | null
          id?: string
          is_active?: boolean
          language?: string | null
          level_id?: string | null
          page_count?: number
          pdf_file_url: string
          plan_required?: string
          sort_index?: number
          title: string
          title_en?: string | null
          title_es?: string | null
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          description_en?: string | null
          description_es?: string | null
          id?: string
          is_active?: boolean
          language?: string | null
          level_id?: string | null
          page_count?: number
          pdf_file_url?: string
          plan_required?: string
          sort_index?: number
          title?: string
          title_en?: string | null
          title_es?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdf_documents_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_user_annotations: {
        Row: {
          annotations_json: Json
          id: string
          page_number: number
          pdf_document_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          annotations_json?: Json
          id?: string
          page_number: number
          pdf_document_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          annotations_json?: Json
          id?: string
          page_number?: number
          pdf_document_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdf_user_annotations_pdf_document_id_fkey"
            columns: ["pdf_document_id"]
            isOneToOne: false
            referencedRelation: "pdf_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_user_state: {
        Row: {
          last_audio_track_id: string | null
          last_page: number
          last_playback_rate: number
          last_zoom: number
          pdf_document_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          last_audio_track_id?: string | null
          last_page?: number
          last_playback_rate?: number
          last_zoom?: number
          pdf_document_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          last_audio_track_id?: string | null
          last_page?: number
          last_playback_rate?: number
          last_zoom?: number
          pdf_document_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdf_user_state_last_audio_track_id_fkey"
            columns: ["last_audio_track_id"]
            isOneToOne: false
            referencedRelation: "pdf_audio_tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdf_user_state_pdf_document_id_fkey"
            columns: ["pdf_document_id"]
            isOneToOne: false
            referencedRelation: "pdf_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          display_name: string
          id: string
          is_default_free: boolean
          key: string
          rank: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          is_default_free?: boolean
          key: string
          rank?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          is_default_free?: boolean
          key?: string
          rank?: number
          updated_at?: string
        }
        Relationships: []
      }
      product_plan_mapping: {
        Row: {
          checkout_url: string | null
          created_at: string
          digimember_product_id: string
          id: string
          is_enabled: boolean
          plan_key: string
          updated_at: string
        }
        Insert: {
          checkout_url?: string | null
          created_at?: string
          digimember_product_id: string
          id?: string
          is_enabled?: boolean
          plan_key?: string
          updated_at?: string
        }
        Update: {
          checkout_url?: string | null
          created_at?: string
          digimember_product_id?: string
          id?: string
          is_enabled?: boolean
          plan_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          is_teacher: boolean
          privacy_setting: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          is_teacher?: boolean
          privacy_setting?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_teacher?: boolean
          privacy_setting?: string
          updated_at?: string
        }
        Relationships: []
      }
      recording_shares: {
        Row: {
          id: string
          recording_id: string
          shared_at: string
          shared_with_user_id: string
        }
        Insert: {
          id?: string
          recording_id: string
          shared_at?: string
          shared_with_user_id: string
        }
        Update: {
          id?: string
          recording_id?: string
          shared_at?: string
          shared_with_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recording_shares_recording_id_fkey"
            columns: ["recording_id"]
            isOneToOne: false
            referencedRelation: "user_recordings"
            referencedColumns: ["id"]
          },
        ]
      }
      repertoire_items: {
        Row: {
          common_pitfalls: string | null
          common_pitfalls_en: string | null
          common_pitfalls_es: string | null
          composer: string | null
          created_at: string
          difficulty: string | null
          goal: string | null
          goal_en: string | null
          goal_es: string | null
          id: string
          key: string | null
          language: string
          notes: string | null
          notes_en: string | null
          notes_es: string | null
          plan_required: string
          practice_steps: string | null
          practice_steps_en: string | null
          practice_steps_es: string | null
          target_minutes: number | null
          techniques_tags: string[] | null
          tempo_bpm: number | null
          title: string
          title_en: string | null
          title_es: string | null
          type: string | null
          updated_at: string
        }
        Insert: {
          common_pitfalls?: string | null
          common_pitfalls_en?: string | null
          common_pitfalls_es?: string | null
          composer?: string | null
          created_at?: string
          difficulty?: string | null
          goal?: string | null
          goal_en?: string | null
          goal_es?: string | null
          id?: string
          key?: string | null
          language?: string
          notes?: string | null
          notes_en?: string | null
          notes_es?: string | null
          plan_required?: string
          practice_steps?: string | null
          practice_steps_en?: string | null
          practice_steps_es?: string | null
          target_minutes?: number | null
          techniques_tags?: string[] | null
          tempo_bpm?: number | null
          title: string
          title_en?: string | null
          title_es?: string | null
          type?: string | null
          updated_at?: string
        }
        Update: {
          common_pitfalls?: string | null
          common_pitfalls_en?: string | null
          common_pitfalls_es?: string | null
          composer?: string | null
          created_at?: string
          difficulty?: string | null
          goal?: string | null
          goal_en?: string | null
          goal_es?: string | null
          id?: string
          key?: string | null
          language?: string
          notes?: string | null
          notes_en?: string | null
          notes_es?: string | null
          plan_required?: string
          practice_steps?: string | null
          practice_steps_en?: string | null
          practice_steps_es?: string | null
          target_minutes?: number | null
          techniques_tags?: string[] | null
          tempo_bpm?: number | null
          title?: string
          title_en?: string | null
          title_es?: string | null
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sections: {
        Row: {
          created_at: string
          id: string
          level_id: string
          sort_order: number
          title: string
          title_en: string | null
          title_es: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          level_id: string
          sort_order?: number
          title: string
          title_en?: string | null
          title_es?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          level_id?: string
          sort_order?: number
          title?: string
          title_en?: string | null
          title_es?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sections_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_assignments: {
        Row: {
          assigned_at: string
          id: string
          is_active: boolean
          teacher_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          id?: string
          is_active?: boolean
          teacher_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          id?: string
          is_active?: boolean
          teacher_id?: string
          user_id?: string
        }
        Relationships: []
      }
      todos: {
        Row: {
          created_at: string
          due_date: string | null
          id: string
          is_completed: boolean
          journal_entry_id: string | null
          notes: string | null
          priority: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          due_date?: string | null
          id?: string
          is_completed?: boolean
          journal_entry_id?: string | null
          notes?: string | null
          priority?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          due_date?: string | null
          id?: string
          is_completed?: boolean
          journal_entry_id?: string | null
          notes?: string | null
          priority?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "todos_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      user_membership_cache: {
        Row: {
          active_product_ids: Json | null
          created_at: string
          id: string
          last_checked_at: string
          plan_key: string
          plan_rank: number
          updated_at: string
          user_id: string
        }
        Insert: {
          active_product_ids?: Json | null
          created_at?: string
          id?: string
          last_checked_at?: string
          plan_key?: string
          plan_rank?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          active_product_ids?: Json | null
          created_at?: string
          id?: string
          last_checked_at?: string
          plan_key?: string
          plan_rank?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_memberships: {
        Row: {
          active_product_ids: string[] | null
          created_at: string
          current_plan: string
          id: string
          last_synced_at: string
          plan_key: string | null
          plan_rank: number | null
          updated_at: string
          user_id: string
          wp_user_id: string | null
        }
        Insert: {
          active_product_ids?: string[] | null
          created_at?: string
          current_plan?: string
          id?: string
          last_synced_at?: string
          plan_key?: string | null
          plan_rank?: number | null
          updated_at?: string
          user_id: string
          wp_user_id?: string | null
        }
        Update: {
          active_product_ids?: string[] | null
          created_at?: string
          current_plan?: string
          id?: string
          last_synced_at?: string
          plan_key?: string | null
          plan_rank?: number | null
          updated_at?: string
          user_id?: string
          wp_user_id?: string | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string | null
          id: string
          language: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          language?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          language?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_recordings: {
        Row: {
          created_at: string
          duration_seconds: number | null
          id: string
          storage_path: string
          title: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          id?: string
          storage_path: string
          title?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          id?: string
          storage_path?: string
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_video_progress: {
        Row: {
          id: string
          playback_speed: number
          progress_percent: number
          updated_at: string
          user_id: string
          video_id: string
        }
        Insert: {
          id?: string
          playback_speed?: number
          progress_percent?: number
          updated_at?: string
          user_id: string
          video_id: string
        }
        Update: {
          id?: string
          playback_speed?: number
          progress_percent?: number
          updated_at?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_video_progress_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_chat_messages: {
        Row: {
          chat_id: string
          content: string | null
          created_at: string
          id: string
          is_read: boolean
          message_type: string
          sender_role: string
          sender_user_id: string
          timestamp_seconds: number | null
          video_storage_path: string | null
        }
        Insert: {
          chat_id: string
          content?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message_type: string
          sender_role: string
          sender_user_id: string
          timestamp_seconds?: number | null
          video_storage_path?: string | null
        }
        Update: {
          chat_id?: string
          content?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message_type?: string
          sender_role?: string
          sender_user_id?: string
          timestamp_seconds?: number | null
          video_storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "video_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      video_chat_participants: {
        Row: {
          chat_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          chat_id: string
          id?: string
          joined_at?: string
          role: string
          user_id: string
        }
        Update: {
          chat_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_chat_participants_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "video_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      video_chats: {
        Row: {
          context_type: string
          created_at: string
          created_by: string
          id: string
          reference_video_id: string | null
          updated_at: string
        }
        Insert: {
          context_type: string
          created_at?: string
          created_by: string
          id?: string
          reference_video_id?: string | null
          updated_at?: string
        }
        Update: {
          context_type?: string
          created_at?: string
          created_by?: string
          id?: string
          reference_video_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_chats_reference_video_id_fkey"
            columns: ["reference_video_id"]
            isOneToOne: false
            referencedRelation: "user_recordings"
            referencedColumns: ["id"]
          },
        ]
      }
      video_completions: {
        Row: {
          completed_at: string
          id: string
          playback_speed: number
          user_id: string
          video_id: string | null
        }
        Insert: {
          completed_at?: string
          id?: string
          playback_speed?: number
          user_id: string
          video_id?: string | null
        }
        Update: {
          completed_at?: string
          id?: string
          playback_speed?: number
          user_id?: string
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_completions_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_shares: {
        Row: {
          chat_id: string | null
          id: string
          revoked_at: string | null
          share_type: string
          shared_at: string
          shared_by_user_id: string
          shared_with_user_id: string
          video_id: string
        }
        Insert: {
          chat_id?: string | null
          id?: string
          revoked_at?: string | null
          share_type: string
          shared_at?: string
          shared_by_user_id: string
          shared_with_user_id: string
          video_id: string
        }
        Update: {
          chat_id?: string | null
          id?: string
          revoked_at?: string | null
          share_type?: string
          shared_at?: string
          shared_by_user_id?: string
          shared_with_user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_shares_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "video_chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_shares_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "user_recordings"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          created_at: string
          description: string | null
          description_en: string | null
          description_es: string | null
          duration_seconds: number | null
          id: string
          is_active: boolean
          language: string | null
          last_synced_at: string
          level_id: string
          section_id: string | null
          sort_order: number
          thumbnail_url: string | null
          title: string
          title_en: string | null
          title_es: string | null
          updated_at: string
          vimeo_player_url: string | null
          vimeo_video_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          description_en?: string | null
          description_es?: string | null
          duration_seconds?: number | null
          id?: string
          is_active?: boolean
          language?: string | null
          last_synced_at?: string
          level_id: string
          section_id?: string | null
          sort_order?: number
          thumbnail_url?: string | null
          title: string
          title_en?: string | null
          title_es?: string | null
          updated_at?: string
          vimeo_player_url?: string | null
          vimeo_video_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          description_en?: string | null
          description_es?: string | null
          duration_seconds?: number | null
          id?: string
          is_active?: boolean
          language?: string | null
          last_synced_at?: string
          level_id?: string
          section_id?: string | null
          sort_order?: number
          thumbnail_url?: string | null
          title?: string
          title_en?: string | null
          title_es?: string | null
          updated_at?: string
          vimeo_player_url?: string | null
          vimeo_video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "videos_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      vimeo_sync_log: {
        Row: {
          error_message: string | null
          id: string
          level_id: string | null
          status: string
          synced_at: string
          videos_added: number
          videos_deactivated: number
          videos_updated: number
        }
        Insert: {
          error_message?: string | null
          id?: string
          level_id?: string | null
          status: string
          synced_at?: string
          videos_added?: number
          videos_deactivated?: number
          videos_updated?: number
        }
        Update: {
          error_message?: string | null
          id?: string
          level_id?: string | null
          status?: string
          synced_at?: string
          videos_added?: number
          videos_deactivated?: number
          videos_updated?: number
        }
        Relationships: [
          {
            foreignKeyName: "vimeo_sync_log_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      admin_dashboard_stats: {
        Row: {
          active_this_week: number | null
          active_today: number | null
          total_stars: number | null
          total_users: number | null
        }
        Relationships: []
      }
      admin_plan_stats: {
        Row: {
          display_name: string | null
          plan_key: string | null
          rank: number | null
          user_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_view_chat_recording: { Args: { file_path: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_chat_creator: {
        Args: { _chat_id: string; _user_id: string }
        Returns: boolean
      }
      is_chat_participant: {
        Args: { _chat_id: string; _user_id: string }
        Returns: boolean
      }
      is_recording_owner: { Args: { recording_id: string }; Returns: boolean }
      is_recording_shared_with_me: {
        Args: { recording_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
