-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- =====================================================
-- AI ASSISTANT: Knowledge Base & RAG System
-- =====================================================

-- 1. Knowledge Sources (Hauptinhalte)
CREATE TABLE public.knowledge_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('method', 'platform', 'faq', 'repertoire', 'mental')),
  language TEXT NOT NULL DEFAULT 'both' CHECK (language IN ('de', 'en', 'both')),
  visibility TEXT NOT NULL DEFAULT 'FREE' CHECK (visibility IN ('FREE', 'BASIC', 'PREMIUM', 'ADMIN')),
  tags TEXT[] DEFAULT '{}',
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Knowledge Chunks (für RAG Retrieval)
CREATE TABLE public.knowledge_chunks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id UUID REFERENCES public.knowledge_sources(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  embedding_json JSONB,
  tags TEXT[] DEFAULT '{}',
  plan_required TEXT NOT NULL DEFAULT 'FREE' CHECK (plan_required IN ('FREE', 'BASIC', 'PREMIUM')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Repertoire Items (Musikdatenbank)
CREATE TABLE public.repertoire_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  composer TEXT,
  type TEXT,
  difficulty TEXT,
  key TEXT,
  tempo_bpm INTEGER,
  techniques_tags TEXT[] DEFAULT '{}',
  goal TEXT,
  common_pitfalls TEXT,
  practice_steps TEXT,
  target_minutes INTEGER,
  plan_required TEXT NOT NULL DEFAULT 'FREE' CHECK (plan_required IN ('FREE', 'BASIC', 'PREMIUM')),
  notes TEXT,
  language TEXT NOT NULL DEFAULT 'both' CHECK (language IN ('de', 'en', 'both')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Assistant Conversations (Chat-Verlauf)
CREATE TABLE public.assistant_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Assistant Messages
CREATE TABLE public.assistant_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.assistant_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  mode TEXT CHECK (mode IN ('platform', 'technique', 'mental', 'repertoire', 'mixed')),
  language TEXT CHECK (language IN ('de', 'en')),
  used_source_ids UUID[] DEFAULT '{}',
  feedback TEXT CHECK (feedback IN ('positive', 'negative')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Unanswered Questions (für Admin-Review)
CREATE TABLE public.assistant_unanswered_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  question TEXT NOT NULL,
  detected_intent TEXT,
  language TEXT CHECK (language IN ('de', 'en')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'answered', 'dismissed')),
  admin_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on all tables
ALTER TABLE public.knowledge_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repertoire_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistant_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistant_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistant_unanswered_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for knowledge_sources (read-only for all authenticated users)
CREATE POLICY "Anyone can read knowledge sources" 
ON public.knowledge_sources 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage knowledge sources" 
ON public.knowledge_sources 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for knowledge_chunks
CREATE POLICY "Anyone can read knowledge chunks" 
ON public.knowledge_chunks 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage knowledge chunks" 
ON public.knowledge_chunks 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for repertoire_items
CREATE POLICY "Anyone can read repertoire items" 
ON public.repertoire_items 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage repertoire items" 
ON public.repertoire_items 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for assistant_conversations
CREATE POLICY "Users can view their own conversations" 
ON public.assistant_conversations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations" 
ON public.assistant_conversations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" 
ON public.assistant_conversations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations" 
ON public.assistant_conversations 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for assistant_messages
CREATE POLICY "Users can view their own messages" 
ON public.assistant_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.assistant_conversations 
    WHERE id = assistant_messages.conversation_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create messages in their conversations" 
ON public.assistant_messages 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.assistant_conversations 
    WHERE id = assistant_messages.conversation_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own messages" 
ON public.assistant_messages 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.assistant_conversations 
    WHERE id = assistant_messages.conversation_id 
    AND user_id = auth.uid()
  )
);

-- RLS Policies for unanswered questions
CREATE POLICY "Users can view their own unanswered questions" 
ON public.assistant_unanswered_questions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create unanswered questions" 
ON public.assistant_unanswered_questions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all unanswered questions" 
ON public.assistant_unanswered_questions 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Indexes for performance
CREATE INDEX idx_knowledge_chunks_source_id ON public.knowledge_chunks(source_id);
CREATE INDEX idx_knowledge_chunks_plan ON public.knowledge_chunks(plan_required);
CREATE INDEX idx_knowledge_sources_type ON public.knowledge_sources(type);
CREATE INDEX idx_knowledge_sources_language ON public.knowledge_sources(language);
CREATE INDEX idx_repertoire_items_difficulty ON public.repertoire_items(difficulty);
CREATE INDEX idx_repertoire_items_type ON public.repertoire_items(type);
CREATE INDEX idx_assistant_conversations_user ON public.assistant_conversations(user_id);
CREATE INDEX idx_assistant_messages_conversation ON public.assistant_messages(conversation_id);
CREATE INDEX idx_unanswered_questions_status ON public.assistant_unanswered_questions(status);

-- Trigger for updated_at
CREATE TRIGGER update_knowledge_sources_updated_at
BEFORE UPDATE ON public.knowledge_sources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_knowledge_chunks_updated_at
BEFORE UPDATE ON public.knowledge_chunks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_repertoire_items_updated_at
BEFORE UPDATE ON public.repertoire_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assistant_conversations_updated_at
BEFORE UPDATE ON public.assistant_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();