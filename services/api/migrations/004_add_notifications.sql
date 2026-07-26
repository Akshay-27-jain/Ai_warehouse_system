-- Migration: add notification recipient and metadata fields
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS recipient_id INTEGER REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS link VARCHAR(255),
  ADD COLUMN IF NOT EXISTS meta JSONB;

-- Create index for faster queries on recipient/unread
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_is_read ON notifications(recipient_id, is_read);
