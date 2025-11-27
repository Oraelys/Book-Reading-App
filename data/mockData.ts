export const mockUser = {
  id: 'user-123',
  name: 'John Doe',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
};

export const mockMessages = [
  {
    id: '1',
    user_id: 'user-456',
    message_text: 'Hey! How are you?',
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '2',
    user_id: 'user-123',
    message_text: "I'm doing great! Just working on a new project.",
    created_at: new Date(Date.now() - 3500000).toISOString(),
  },
  {
    id: '3',
    user_id: 'user-456',
    message_text: 'That sounds exciting! Tell me more about it.',
    created_at: new Date(Date.now() - 3400000).toISOString(),
  },
];

export const mockChats = [
  {
    id: 'chat-1',
    user_id: 'user-456',
    user_name: 'Sarah Wilson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    last_message: 'That sounds exciting! Tell me more about it.',
    last_message_time: new Date(Date.now() - 3400000).toISOString(),
    unread_count: 2,
  },
  {
    id: 'chat-2',
    user_id: 'user-789',
    user_name: 'Mike Chen',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
    last_message: 'See you tomorrow!',
    last_message_time: new Date(Date.now() - 7200000).toISOString(),
    unread_count: 0,
  },
  {
    id: 'chat-3',
    user_id: 'user-101',
    user_name: 'Emily Brown',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
    last_message: 'Thanks for your help! 🙏',
    last_message_time: new Date(Date.now() - 14400000).toISOString(),
    unread_count: 0,
  },
  {
    id: 'chat-4',
    user_id: 'user-202',
    user_name: 'David Lee',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
    last_message: 'Did you see the game last night?',
    last_message_time: new Date(Date.now() - 86400000).toISOString(),
    unread_count: 1,
  },
];

export const mockStatuses = [
  {
    id: '1',
    user_id: 'user-789',
    user_name: 'Alice Smith',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
    media_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
    caption: 'Beautiful sunset today! 🌅',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    views: 42,
  },
  {
    id: '2',
    user_id: 'user-101',
    user_name: 'Bob Johnson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
    media_url: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=400',
    caption: 'Coffee time ☕',
    created_at: new Date(Date.now() - 10800000).toISOString(),
    views: 28,
  },
  {
    id: '3',
    user_id: 'user-202',
    user_name: 'Carol White',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carol',
    media_url: 'https://images.unsplash.com/photo-1551963831-b3b1ca40c98e?w=400',
    caption: 'Breakfast goals 🥑',
    created_at: new Date(Date.now() - 14400000).toISOString(),
    views: 35,
  },
];
