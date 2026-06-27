// /styles/statusStyles.ts
import { StyleSheet } from 'react-native';

export const statusStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollArea: {
    padding: 16,
    paddingBottom: 40,
  },

  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },

  /** MY STATUS */
  myStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  myStatusIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#34C759',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  myStatusTextColumn: {
    marginLeft: 16,
  },
  myStatusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  myStatusSubtitle: {
    fontSize: 14,
    color: '#666',
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 14,
    textTransform: 'uppercase',
  },

  /** STATUS ROW */
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatarBorder: {
    padding: 3,
    borderWidth: 2,
    borderRadius: 32,
    borderColor: '#34C759',
    marginRight: 12,
  },
  statusAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },

  statusInfo: {
    flex: 1,
  },
  statusName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusTime: {
    fontSize: 13,
    color: '#666',
  },

  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#ddd',
  },

  /** VIEWER */
  viewerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  viewerImage: {
    width: '100%',
    height: '100%',
  },
  viewerOverlay: {
    ...StyleSheet.absoluteFillObject,
  },

  progressRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 14,
  },
  progressBar: {
    height: 3,
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 2,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
  },

  viewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  viewerUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  viewerUsername: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  viewerTime: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },

  tapLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '35%',
  },
  tapRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '65%',
  },

  viewerFooter: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 16,
  },
  viewerCaption: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 16,
  },
  viewerActions: {
    flexDirection: 'row',
    gap: 16,
  },

  /** CREATE STATUS */
  createContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  createBackground: {
    width: '100%',
    height: '100%',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },

  createHeaderRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  createUserInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  createUserAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
  },
  createUserName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  createInputRow: {
    position: 'absolute',
    bottom: 90,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  captionInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },

  imageButton: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },

  postButton: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postDisabled: {
    opacity: 0.35,
  },
});
