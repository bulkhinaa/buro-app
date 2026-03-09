-- =============================================
-- Chat enhancements: reply_to, update/delete policies
-- =============================================

-- Add reply_to column for message replies
ALTER TABLE chat_messages ADD COLUMN reply_to UUID REFERENCES chat_messages(id) ON DELETE SET NULL;

-- Allow project participants to update their own messages (for editing)
CREATE POLICY "Users can update own messages" ON chat_messages
  FOR UPDATE USING (sender_id = auth.uid());

-- Allow project participants to delete their own messages
CREATE POLICY "Users can delete own messages" ON chat_messages
  FOR DELETE USING (sender_id = auth.uid());

-- Index for reply lookups
CREATE INDEX idx_chat_reply_to ON chat_messages(reply_to);
