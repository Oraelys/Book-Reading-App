/*
  # Add Comments and Chat Functionality

  ## New Tables
  1. book_comments - User comments on books
  2. chat_messages - Real-time chat messages between users
  3. chat_rooms - Chat rooms for users

  ## Security
  - Enable RLS on all tables
  - Users can only see and create their own content or public content
*/

-- Create book_comments table
CREATE TABLE IF NOT EXISTS book_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_text text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create chat_rooms table
CREATE TABLE IF NOT EXISTS chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_book_comments_book_id ON book_comments(book_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_book_comments_user_id ON book_comments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_created_by ON chat_rooms(created_by, created_at DESC);

-- Enable Row Level Security
ALTER TABLE book_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for book_comments
CREATE POLICY "Users can view all comments"
  ON book_comments FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own comments"
  ON book_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON book_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON book_comments FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for chat_rooms
CREATE POLICY "Users can view all chat rooms"
  ON chat_rooms FOR SELECT
  USING (true);

CREATE POLICY "Users can create chat rooms"
  ON chat_rooms FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own chat rooms"
  ON chat_rooms FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own chat rooms"
  ON chat_rooms FOR DELETE
  USING (auth.uid() = created_by);

-- RLS Policies for chat_messages
CREATE POLICY "Users can view all messages"
  ON chat_messages FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own messages"
  ON chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages"
  ON chat_messages FOR DELETE
  USING (auth.uid() = user_id);
