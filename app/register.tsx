import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import * as DocumentPicker from 'expo-document-picker';
import { Camera, User } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp, verifyOtp } = useAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<any>(null);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const pickProfileImage = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri);
        setProfileImageFile(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      setError('Failed to pick image');
    }
  };

  const uploadProfileImage = async (userId: string): Promise<string | null> => {
    if (!profileImageFile) return null;

    try {
      console.log('Starting profile image upload for user:', userId);
      
      // For React Native, we need to use fetch to get the file as arraybuffer
      const response = await fetch(profileImageFile.uri);
      const arrayBuffer = await response.arrayBuffer();
      const fileData = new Uint8Array(arrayBuffer);
      
      const fileExt = profileImageFile.name?.split('.').pop() || 'jpg';
      const fileName = `${userId}_${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      console.log('Uploading to path:', filePath);

      // Upload using Uint8Array instead of blob
      const { data, error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, fileData, {
          contentType: profileImageFile.mimeType || 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful:', data);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      console.log('Public URL:', urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading profile image:', error);
      Alert.alert('Warning', 'Profile picture upload failed, but account will be created.');
      return null;
    }
  };

  const createUserProfile = async (userId: string, userEmail: string) => {
    try {
      console.log('=== Creating Profile ===');
      console.log('User ID:', userId);
      console.log('Email:', userEmail);
      console.log('Username:', username.trim());
      console.log('Has profile image:', !!profileImageFile);
      
      let profilePictureUrl = null;
      if (profileImageFile) {
        console.log('Uploading profile picture...');
        profilePictureUrl = await uploadProfileImage(userId);
        console.log('Profile picture uploaded:', profilePictureUrl);
      }

      console.log('Inserting profile into database...');
      const profileData = {
        id: userId,
        username: username.trim(),
        email: userEmail,
        avatar_url: profilePictureUrl,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      console.log('Profile data:', profileData);

      const { data, error: upsertError } = await supabase
        .from('profiles')
        .upsert(profileData, {
          onConflict: 'id'
        })
        .select()
        .single();

      if (upsertError) {
        console.error('❌ Profile upsert error:', upsertError);
        throw upsertError;
      }

      console.log('✅ Profile created successfully:', data);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error creating profile:', error);
      throw error;
    }
  };

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword || !username) {
      setError('Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Check username availability
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username.trim())
        .maybeSingle();

      if (existingProfile) {
        setError('Username is already taken');
        setLoading(false);
        return;
      }

      const signUpResult = await signUp(email, password);

      if (signUpResult.error) {
        setError(signUpResult.error.message);
        setLoading(false);
        return;
      }

      // signUp returns { error, data } but data might be undefined
      const signUpData = signUpResult.data;
      
      if (signUpData?.user) {
        setUserId(signUpData.user.id);
        
        // Check if email confirmation is required
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData?.session) {
          // User is already logged in (email confirmation disabled)
          console.log('Email confirmation disabled, creating profile immediately');
          
          try {
            await createUserProfile(signUpData.user.id, signUpData.user.email || email);
            
            Alert.alert(
              'Success!',
              'Your account has been created successfully!',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    setLoading(false);
                    router.replace('/(tabs)');
                  },
                },
              ]
            );
          } catch (profileError) {
            console.error('Profile creation error:', profileError);
            setLoading(false);
            Alert.alert(
              'Account Created',
              'Your account was created but profile setup failed. Please update your profile in settings.',
              [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
            );
          }
        } else {
          // Email confirmation is enabled, show OTP screen
          setShowOtpInput(true);
          setLoading(false);
          Alert.alert(
            'Check Your Email',
            'We sent a verification code to your email. Please check your inbox (and spam folder).',
            [{ text: 'OK' }]
          );
        }
      } else {
        // No user returned, but no error either - probably need to verify email
        setShowOtpInput(true);
        setLoading(false);
        Alert.alert(
          'Check Your Email',
          'We sent a verification code to your email. Please verify to continue.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Signup error:', error);
      setError('Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const verifyResult = await verifyOtp(email, otp);

      if (verifyResult.error) {
        setError(verifyResult.error.message);
        setLoading(false);
        return;
      }

      const verifyData = verifyResult.data;

      if (verifyData?.user) {
        console.log('OTP verified, creating profile for user:', verifyData.user.id);
        
        try {
          await createUserProfile(verifyData.user.id, verifyData.user.email || email);
          console.log('Profile created successfully, redirecting...');
          
          Alert.alert(
            'Success!',
            'Your account is ready!',
            [
              {
                text: 'OK',
                onPress: () => {
                  setLoading(false);
                  setTimeout(() => {
                    router.replace('/(tabs)');
                  }, 300);
                },
              },
            ]
          );
        } catch (profileError) {
          console.error('Profile creation error:', profileError);
          setLoading(false);
          Alert.alert(
            'Profile Setup',
            'Account created but profile setup failed. Please update your profile in settings.',
            [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
          );
        }
      } else {
        setError('Verification failed. Please try again.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError('Verification failed. Please try again.');
      setLoading(false);
    }
  };

  const handleSkipVerification = () => {
    Alert.alert(
      'Skip Verification?',
      'This is only available in development. In production, email verification is required for security.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: async () => {
            if (userId) {
              try {
                await createUserProfile(userId, email);
                router.replace('/(tabs)');
              } catch (error) {
                console.error('Error creating profile:', error);
                Alert.alert('Error', 'Failed to create profile');
              }
            }
          },
        },
      ]
    );
  };

  const handleResendOTP = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) throw error;

      Alert.alert('Success', 'Verification code resent! Check your email.');
    } catch (error) {
      console.error('Resend error:', error);
      Alert.alert('Error', 'Failed to resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (showOtpInput) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Text style={styles.title}>Verify Your Email</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to {email}
            </Text>
            <Text style={styles.note}>
              Check your spam folder if you don't see the email
            </Text>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Enter 6-digit code"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                editable={!loading}
              />

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleVerifyOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Verify & Create Profile</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleResendOTP}
                disabled={loading}
              >
                <Text style={styles.secondaryButtonText}>Resend Code</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => setShowOtpInput(false)}
                disabled={loading}
              >
                <Text style={styles.linkText}>Go back</Text>
              </TouchableOpacity>

              {/* Development only - Skip verification */}
              {__DEV__ && (
                <TouchableOpacity
                  style={styles.devButton}
                  onPress={handleSkipVerification}
                >
                  <Text style={styles.devButtonText}>
                    [DEV] Skip Verification
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to start your reading journey</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.form}>
            {/* Profile Picture Picker */}
            <View style={styles.profileSection}>
              <TouchableOpacity 
                style={styles.profileImageContainer}
                onPress={pickProfileImage}
              >
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.profileImage} />
                ) : (
                  <View style={styles.profilePlaceholder}>
                    <User size={40} color="#999" />
                  </View>
                )}
                <View style={styles.cameraIcon}>
                  <Camera size={16} color="#fff" />
                </View>
              </TouchableOpacity>
              <Text style={styles.profileHint}>Tap to add profile picture (optional)</Text>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              editable={!loading}
            />

            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />

            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!loading}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Sign Up</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => router.back()}
              disabled={loading}
            >
              <Text style={styles.linkText}>
                Already have an account? Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  note: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 24,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 8,
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
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  cameraIcon: {
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
  profileHint: {
    fontSize: 12,
    color: '#999',
  },
  form: {
    gap: 16,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  button: {
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    height: 50,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    padding: 12,
    alignItems: 'center',
  },
  linkText: {
    color: '#007AFF',
    fontSize: 14,
  },
  error: {
    color: '#ff3b30',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  devButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  devButtonText: {
    color: '#FF6F00',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});