-- Agency Agents Platform — Full Schema
-- Run against a fresh Supabase project

-- ============================================================
-- AGENTS — seeded from markdown files
-- ============================================================
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  division TEXT NOT NULL,
  sub_division TEXT,
  color TEXT NOT NULL DEFAULT 'gray',
  emoji TEXT NOT NULL DEFAULT '',
  vibe TEXT NOT NULL DEFAULT '',
  system_prompt TEXT NOT NULL DEFAULT '',
  soul_content TEXT,
  agents_content TEXT,
  identity_content TEXT,
  default_model TEXT NOT NULL DEFAULT 'claude-sonnet-4-20250514',
  is_system BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_agents_division ON agents(division);
CREATE INDEX idx_agents_slug ON agents(slug);

-- ============================================================
-- TEAMS — user-created agent groups
-- ============================================================
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '🤖',
  color TEXT DEFAULT '#3B82F6',
  default_model TEXT NOT NULL DEFAULT 'claude-sonnet-4-20250514',
  inter_agent_enabled BOOLEAN NOT NULL DEFAULT true,
  is_template BOOLEAN NOT NULL DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_teams_user_id ON teams(user_id);

-- ============================================================
-- TEAM_AGENTS — many-to-many
-- ============================================================
CREATE TABLE team_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  custom_name TEXT,
  custom_model TEXT,
  include_soul BOOLEAN NOT NULL DEFAULT true,
  include_agents BOOLEAN NOT NULL DEFAULT true,
  include_identity BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, agent_id)
);

CREATE INDEX idx_team_agents_team ON team_agents(team_id);

-- ============================================================
-- CONVERSATIONS — chat threads
-- ============================================================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  primary_agent_id UUID REFERENCES agents(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_conversations_team ON conversations(team_id);
CREATE INDEX idx_conversations_user ON conversations(user_id);

-- ============================================================
-- HANDOFFS — agent-to-agent delegation (before messages so FK works)
-- ============================================================
CREATE TABLE handoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  task_id UUID,  -- FK added after tasks table
  from_agent_id UUID NOT NULL REFERENCES agents(id),
  to_agent_id UUID NOT NULL REFERENCES agents(id),
  context TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'completed', 'rejected')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  result TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_handoffs_conversation ON handoffs(conversation_id);
CREATE INDEX idx_handoffs_team ON handoffs(team_id);

-- ============================================================
-- MESSAGES — all conversation messages
-- ============================================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'handoff')),
  content TEXT NOT NULL,
  agent_id UUID REFERENCES agents(id),
  parent_message_id UUID REFERENCES messages(id),
  handoff_id UUID REFERENCES handoffs(id),
  token_count_input INT,
  token_count_output INT,
  model_used TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created ON messages(conversation_id, created_at);

-- ============================================================
-- TASKS — work items
-- ============================================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'backlog' CHECK (status IN ('backlog', 'in_progress', 'in_qa', 'passed', 'failed', 'blocked')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  assigned_agent_id UUID REFERENCES agents(id),
  qa_agent_id UUID REFERENCES agents(id),
  conversation_id UUID REFERENCES conversations(id),
  retry_count INT NOT NULL DEFAULT 0,
  max_retries INT NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_team ON tasks(team_id);
CREATE INDEX idx_tasks_status ON tasks(team_id, status);

-- Add deferred FK from handoffs to tasks
ALTER TABLE handoffs ADD CONSTRAINT fk_handoffs_task FOREIGN KEY (task_id) REFERENCES tasks(id);

-- ============================================================
-- AGENT_SESSIONS — runtime state
-- ============================================================
CREATE TABLE agent_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id),
  status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('active', 'idle', 'error', 'queued')),
  current_task_id UUID REFERENCES tasks(id),
  tasks_completed INT NOT NULL DEFAULT 0,
  first_pass_rate REAL NOT NULL DEFAULT 0,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_agent_sessions_team ON agent_sessions(team_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE handoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;

-- Agents: everyone reads system agents
CREATE POLICY "agents_read_system" ON agents FOR SELECT USING (is_system = true);
CREATE POLICY "agents_read_all_authenticated" ON agents FOR SELECT TO authenticated USING (true);

-- Teams: own teams + templates
CREATE POLICY "teams_select" ON teams FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_template = true);
CREATE POLICY "teams_insert" ON teams FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "teams_update" ON teams FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "teams_delete" ON teams FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Team agents: through team ownership
CREATE POLICY "team_agents_select" ON team_agents FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM teams WHERE id = team_id AND (user_id = auth.uid() OR is_template = true)));
CREATE POLICY "team_agents_insert" ON team_agents FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM teams WHERE id = team_id AND user_id = auth.uid()));
CREATE POLICY "team_agents_update" ON team_agents FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM teams WHERE id = team_id AND user_id = auth.uid()));
CREATE POLICY "team_agents_delete" ON team_agents FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM teams WHERE id = team_id AND user_id = auth.uid()));

-- Conversations: own only
CREATE POLICY "conversations_select" ON conversations FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "conversations_insert" ON conversations FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "conversations_update" ON conversations FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Messages: through conversation ownership
CREATE POLICY "messages_select" ON messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM conversations WHERE id = conversation_id AND user_id = auth.uid()));
CREATE POLICY "messages_insert" ON messages FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM conversations WHERE id = conversation_id AND user_id = auth.uid()));

-- Tasks: own only
CREATE POLICY "tasks_select" ON tasks FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "tasks_insert" ON tasks FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "tasks_update" ON tasks FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "tasks_delete" ON tasks FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Handoffs: through conversation ownership
CREATE POLICY "handoffs_select" ON handoffs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM conversations WHERE id = conversation_id AND user_id = auth.uid()));
CREATE POLICY "handoffs_insert" ON handoffs FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM conversations WHERE id = conversation_id AND user_id = auth.uid()));
CREATE POLICY "handoffs_update" ON handoffs FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM conversations WHERE id = conversation_id AND user_id = auth.uid()));

-- Agent sessions: through team ownership
CREATE POLICY "agent_sessions_select" ON agent_sessions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM teams WHERE id = team_id AND user_id = auth.uid()));
CREATE POLICY "agent_sessions_insert" ON agent_sessions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM teams WHERE id = team_id AND user_id = auth.uid()));
CREATE POLICY "agent_sessions_update" ON agent_sessions FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM teams WHERE id = team_id AND user_id = auth.uid()));

-- ============================================================
-- REALTIME — enable for live updates
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE handoffs;
ALTER PUBLICATION supabase_realtime ADD TABLE agent_sessions;

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_agents_updated_at BEFORE UPDATE ON agents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
