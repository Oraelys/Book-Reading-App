// /components/navigation/AnimatedChatStatusTab.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageCircle, User } from 'lucide-react-native';

import {navStyles} from  '@/styles/navStyles';
import { ChatScreen } from '../chat/chatScreen';
import { ChatListScreen } from '../chat/chatListScreen';
import { StatusScreen } from '../status/statusScreen';
import { mockChats } from '@/data/mockData';

export const AnimatedChatStatusTab = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'status' | null>(null);

  /** Stores currently opened chat */
  const [activeChat, setActiveChat] = useState<{
    id: string;
    user_id: string;
  } | null>(null);

  const resetToHome = () => {
    setActiveTab(null);
    setActiveChat(null);
  };

  const openChat = (chatId: string, userId: string) => {
    setActiveChat({ id: chatId, user_id: userId });
  };

  const chatUser = activeChat
    ? mockChats.find(c => c.id === activeChat.id)
    : null;

  return (
    <SafeAreaView style={navStyles.container}>
      {/* -------------------------------------- */}
      {/* HOME SPLASH (when no tab selected) */}
      {/* -------------------------------------- */}

      {!activeTab && (
        <View style={navStyles.homeContainer}>
          <Text style={navStyles.homeTitle}>Social Hub</Text>
          <Text style={navStyles.homeSubtitle}>
            Connect with friends through chat and status updates
          </Text>
        </View>
      )}

      {/* -------------------------------------- */}
      {/* CHAT TAB AREA */}
      {/* -------------------------------------- */}

      {activeTab === 'chat' && (
        <View style={navStyles.fullScreen}>
          {activeChat && chatUser ? (
            <ChatScreen
              chatUser={{
                id: chatUser.user_id,
                name: chatUser.user_name,
                avatar: chatUser.avatar,
              }}
              onBack={() => setActiveChat(null)}
            />
          ) : (
            <ChatListScreen onSelectChat={openChat} />
          )}
        </View>
      )}

      {/* -------------------------------------- */}
      {/* STATUS TAB AREA */}
      {/* -------------------------------------- */}

      {activeTab === 'status' && (
        <View style={navStyles.fullScreen}>
          <StatusScreen />
        </View>
      )}

      {/* -------------------------------------- */}
      {/* BOTTOM TABS */}
      {/* -------------------------------------- */}

      <View style={navStyles.tabContainer}>
        {/* CHAT BUTTON */}
        <TouchableOpacity
          style={[
            navStyles.tabButton,
            navStyles.chatTab,
            activeTab === 'chat' && navStyles.tabActive,
          ]}
          onPress={() => {
            if (activeTab === 'chat') resetToHome();
            else {
              setActiveTab('chat');
              setActiveChat(null);
            }
          }}
        >
          <MessageCircle size={22} color="#fff" />
          <Text style={navStyles.tabLabel}>Chat</Text>
        </TouchableOpacity>

        {/* STATUS BUTTON */}
        <TouchableOpacity
          style={[
            navStyles.tabButton,
            navStyles.statusTab,
            activeTab === 'status' && navStyles.tabActive,
          ]}
          onPress={() => {
            if (activeTab === 'status') resetToHome();
            else {
              setActiveTab('status');
              setActiveChat(null);
            }
          }}
        >
          <User size={22} color="#fff" />
          <Text style={navStyles.tabLabel}>Status</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};
