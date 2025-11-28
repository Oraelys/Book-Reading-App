import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import * as DocumentPicker from 'expo-document-picker';
import {
  Settings,
  LogOut,
  Bell,
  Moon,
  Globe,
  Lock,
  HelpCircle,
  DollarSign,
  CreditCard,
  TrendingUp,
  Camera,
  ChevronRight,
} from 'lucide-react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'settings' | 'earnings'>('settings');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  
  // Settings states
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);
  
  // Writer/earnings states (mock data)
  const [isWriter, setIsWriter] = useState(true);
  const [totalEarnings, setTotalEarnings] = useState(1250.50);
  const [pendingEarnings, setPendingEarnings] = useState(320.00);
  const [hasBankAccount, setHasBankAccount] = useState(false);

  const handlePickImage = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const handleSignOut = async () => {
    if (Platform.OS === 'web') {
      if (confirm('Are you sure you want to sign out?')) {
        await signOut();
        router.replace('/login');
      }
    } else {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: async () => {
              await signOut();
              router.replace('/login');
            },
          },
        ]
      );
    }
  };

  const handleAddBankAccount = () => {
    Alert.alert(
      'Add Bank Account',
      'This feature will allow you to link your bank account for withdrawals.',
      [{ text: 'OK' }]
    );
  };

  const handleWithdraw = () => {
    if (!hasBankAccount) {
      Alert.alert(
        'No Bank Account',
        'Please add a bank account first to withdraw funds.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Withdraw Funds',
        `Withdraw $${totalEarnings.toFixed(2)} to your bank account?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Withdraw', onPress: () => console.log('Withdrawing...') },
        ]
      );
    }
  };

  const renderSettingsTab = () => (
    <View style={styles.tabContent}>
      {/* Notification Settings */}
      <View style={styles.settingItem}>
        <View style={styles.settingLeft}>
          <Bell size={20} color="#007AFF" />
          <Text style={styles.settingText}>Notifications</Text>
        </View>
        <Switch
          value={notifications}
          onValueChange={setNotifications}
          trackColor={{ false: '#ddd', true: '#007AFF' }}
        />
      </View>

      {/* Dark Mode */}
      <View style={styles.settingItem}>
        <View style={styles.settingLeft}>
          <Moon size={20} color="#007AFF" />
          <Text style={styles.settingText}>Dark Mode</Text>
        </View>
        <Switch
          value={darkMode}
          onValueChange={setDarkMode}
          trackColor={{ false: '#ddd', true: '#007AFF' }}
        />
      </View>

      {/* Auto Backup */}
      <View style={styles.settingItem}>
        <View style={styles.settingLeft}>
          <Settings size={20} color="#007AFF" />
          <Text style={styles.settingText}>Auto Backup</Text>
        </View>
        <Switch
          value={autoBackup}
          onValueChange={setAutoBackup}
          trackColor={{ false: '#ddd', true: '#007AFF' }}
        />
      </View>

      <View style={styles.divider} />

      {/* Navigation Options */}
      <TouchableOpacity style={styles.settingItem}>
        <View style={styles.settingLeft}>
          <Lock size={20} color="#007AFF" />
          <Text style={styles.settingText}>Privacy & Security</Text>
        </View>
        <ChevronRight size={20} color="#999" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingItem}>
        <View style={styles.settingLeft}>
          <Globe size={20} color="#007AFF" />
          <Text style={styles.settingText}>Language</Text>
        </View>
        <ChevronRight size={20} color="#999" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingItem}>
        <View style={styles.settingLeft}>
          <HelpCircle size={20} color="#007AFF" />
          <Text style={styles.settingText}>Help & Support</Text>
        </View>
        <ChevronRight size={20} color="#999" />
      </TouchableOpacity>

      <View style={styles.divider} />

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
        <LogOut size={20} color="#ff3b30" />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEarningsTab = () => (
    <View style={styles.tabContent}>
      {!isWriter ? (
        <View style={styles.notWriterContainer}>
          <DollarSign size={48} color="#ccc" />
          <Text style={styles.notWriterTitle}>Become a Writer</Text>
          <Text style={styles.notWriterText}>
            Start writing and publishing your own novels to earn money
          </Text>
          <TouchableOpacity style={styles.becomeWriterButton}>
            <Text style={styles.becomeWriterButtonText}>Apply as Writer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Earnings Cards */}
          <View style={styles.earningsCards}>
            <View style={styles.earningCard}>
              <View style={styles.earningCardHeader}>
                <DollarSign size={20} color="#4CAF50" />
                <Text style={styles.earningCardLabel}>Total Earnings</Text>
              </View>
              <Text style={styles.earningAmount}>${totalEarnings.toFixed(2)}</Text>
            </View>

            <View style={styles.earningCard}>
              <View style={styles.earningCardHeader}>
                <TrendingUp size={20} color="#FF9800" />
                <Text style={styles.earningCardLabel}>Pending</Text>
              </View>
              <Text style={styles.earningAmount}>${pendingEarnings.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Bank Account Section */}
          <View style={styles.bankSection}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            
            {!hasBankAccount ? (
              <TouchableOpacity
                style={styles.addBankButton}
                onPress={handleAddBankAccount}
              >
                <CreditCard size={24} color="#007AFF" />
                <View style={styles.addBankContent}>
                  <Text style={styles.addBankTitle}>Add Bank Account</Text>
                  <Text style={styles.addBankSubtitle}>
                    Link your bank to withdraw earnings
                  </Text>
                </View>
                <ChevronRight size={20} color="#007AFF" />
              </TouchableOpacity>
            ) : (
              <View style={styles.bankCard}>
                <CreditCard size={24} color="#007AFF" />
                <View style={styles.bankInfo}>
                  <Text style={styles.bankName}>Chase Bank</Text>
                  <Text style={styles.bankAccount}>•••• 4242</Text>
                </View>
                <TouchableOpacity>
                  <Text style={styles.changeButton}>Change</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Withdraw Button */}
          <TouchableOpacity
            style={[
              styles.withdrawButton,
              !hasBankAccount && styles.withdrawButtonDisabled,
            ]}
            onPress={handleWithdraw}
            disabled={!hasBankAccount}
          >
            <Text style={styles.withdrawButtonText}>
              Withdraw ${totalEarnings.toFixed(2)}
            </Text>
          </TouchableOpacity>

          {/* Earnings History */}
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            
            <View style={styles.transactionItem}>
              <View>
                <Text style={styles.transactionTitle}>Reader Purchase</Text>
                <Text style={styles.transactionDate}>Nov 25, 2024</Text>
              </View>
              <Text style={styles.transactionAmount}>+$15.99</Text>
            </View>

            <View style={styles.transactionItem}>
              <View>
                <Text style={styles.transactionTitle}>Reader Purchase</Text>
                <Text style={styles.transactionDate}>Nov 22, 2024</Text>
              </View>
              <Text style={styles.transactionAmount}>+$12.50</Text>
            </View>

            <View style={styles.transactionItem}>
              <View>
                <Text style={styles.transactionTitle}>Withdrawal</Text>
                <Text style={styles.transactionDate}>Nov 20, 2024</Text>
              </View>
              <Text style={[styles.transactionAmount, styles.transactionNegative]}>
                -$500.00
              </Text>
            </View>
          </View>
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.profileImageContainer}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.profilePlaceholder}>
                <Text style={styles.profileInitial}>
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <TouchableOpacity style={styles.cameraButton} onPress={handlePickImage}>
              <Camera size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>{user?.email?.split('@')[0] || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          {isWriter && (
            <View style={styles.writerBadge}>
              <Text style={styles.writerBadgeText}>✍️ Writer</Text>
            </View>
          )}
        </View>

        {/* Tabs Section */}
        <View style={styles.tabsContainer}>
          {/* Tab Controls */}
          <View style={styles.tabControls}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'settings' && styles.tabActive]}
              onPress={() => setActiveTab('settings')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'settings' && styles.tabTextActive,
                ]}
              >
                Settings
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'earnings' && styles.tabActive]}
              onPress={() => setActiveTab('earnings')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'earnings' && styles.tabTextActive,
                ]}
              >
                Earnings
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          {activeTab === 'settings' ? renderSettingsTab() : renderEarningsTab()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profilePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontSize: 40,
    fontWeight: '700',
    color: '#fff',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  writerBadge: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#FFF3E0',
    borderRadius: 16,
  },
  writerBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6F00',
  },
  tabsContainer: {
    marginTop: 16,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    minHeight: 400,
  },
  tabControls: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#007AFF',
  },
  tabContent: {
    padding: 24,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff3b30',
  },
  notWriterContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  notWriterTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 16,
  },
  notWriterText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  becomeWriterButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  becomeWriterButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  earningsCards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  earningCard: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
  },
  earningCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  earningCardLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  earningAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  bankSection: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  addBankButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    gap: 12,
  },
  addBankContent: {
    flex: 1,
  },
  addBankTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  addBankSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  bankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    gap: 12,
  },
  bankInfo: {
    flex: 1,
  },
  bankName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  bankAccount: {
    fontSize: 14,
    color: '#666',
  },
  changeButton: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  withdrawButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  withdrawButtonDisabled: {
    backgroundColor: '#ccc',
  },
  withdrawButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  historySection: {
    marginTop: 32,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#666',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4CAF50',
  },
  transactionNegative: {
    color: '#ff3b30',
  },
});