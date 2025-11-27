// /styles/navStyles.ts
import { StyleSheet } from 'react-native';

export const navStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  homeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  homeTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#333',
    marginBottom: 10,
  },
  homeSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },

  fullScreen: {
    flex: 1,
    marginBottom: 95,
  },

  /** TABS */
  tabContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },

  tabButton: {
    flex: 1,
    height: 70,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  tabLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },

  chatTab: {
    backgroundColor: '#007AFF',
  },
  statusTab: {
    backgroundColor: '#34C759',
  },
  tabActive: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
});
