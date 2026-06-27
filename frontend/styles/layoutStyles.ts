// /styles/layoutStyles.ts
import { StyleSheet } from 'react-native';

export const TAB_HEIGHT = 70;

export const layoutStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  screenContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },

  fullScreenContent: {
    flex: 1,
    marginBottom: TAB_HEIGHT + 20,
  },

  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: TAB_HEIGHT + 20,
  },

  welcomeContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },

  mainTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },

  mainSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },

  tabButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 10,
    gap: 12,
    backgroundColor: '#f5f5f5',
  },

  tabButton: {
    flex: 1,
    height: TAB_HEIGHT,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },

  tabButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },

  chatButton: {
    backgroundColor: '#007AFF',
  },

  statusButton: {
    backgroundColor: '#34C759',
  },

  activeButton: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
});
