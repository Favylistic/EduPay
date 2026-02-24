-- messages: Direct messaging system for employees to HR
CREATE TABLE IF NOT EXISTS public.messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content         text NOT NULL,
  read_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX idx_messages_conversation ON public.messages(sender_id, receiver_id);
CREATE INDEX idx_messages_created ON public.messages(created_at);

-- Users can read messages they sent or received
CREATE POLICY "messages_select_own" ON public.messages FOR SELECT
  USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

-- Users can insert messages (send)
CREATE POLICY "messages_insert_own" ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
  );

-- Users can mark messages as read
CREATE POLICY "messages_update_own" ON public.messages FOR UPDATE
  USING (
    auth.uid() = receiver_id
  );

-- Admins can delete messages
CREATE POLICY "messages_delete_admin" ON public.messages FOR DELETE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('super_admin','hr_manager')
  );
