// components/reader/PdfViewer.tsx
import * as CSS from 'csstype';
import * as FileSystem from 'expo-file-system';
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { WebViewErrorEvent, WebViewHttpErrorEvent, WebViewNavigationEvent, WebViewSource } from 'react-native-webview/lib/WebViewTypes';

// expo-file-system v19's public types no longer expose the legacy API used by this
// viewer, while the native module still provides it in the environments supported
// by this component. Keep the compatibility boundary local to this legacy viewer.
const LegacyFileSystem = FileSystem as typeof FileSystem & {
  cacheDirectory?: string;
  writeAsStringAsync: (fileUri: string, contents: string, options?: { encoding?: string }) => Promise<void>;
  deleteAsync: (fileUri: string, options?: { idempotent?: boolean }) => Promise<void>;
  getInfoAsync: (fileUri: string) => Promise<{ exists: boolean }>;
  EncodingType?: { Base64: string };
};

const cacheDirectory = LegacyFileSystem.cacheDirectory ?? '';
const writeAsStringAsync = LegacyFileSystem.writeAsStringAsync;
const deleteAsync = LegacyFileSystem.deleteAsync;
const getInfoAsync = LegacyFileSystem.getInfoAsync;
const EncodingType = LegacyFileSystem.EncodingType ?? { Base64: 'base64' };

export type RenderType = 'DIRECT_URL' | 'DIRECT_BASE64' | 'BASE64_TO_LOCAL_PDF' | 'URL_TO_BASE64' | 'GOOGLE_READER' | 'GOOGLE_DRIVE_VIEWER';
export interface CustomStyle { readerContainer?: CSS.Properties; readerContainerDocument?: CSS.Properties; readerContainerNumbers?: CSS.Properties; readerContainerNumbersContent?: CSS.Properties; readerContainerZoomContainer?: CSS.Properties; readerContainerZoomContainerButton?: CSS.Properties; readerContainerNavigate?: CSS.Properties; readerContainerNavigateArrow?: CSS.Properties; }
export interface Source { uri?: string; base64?: string; headers?: { [key: string]: string } }
export interface Props { source: Source; style?: View['props']['style']; webviewStyle?: WebView['props']['style']; webviewProps?: WebView['props']; noLoader?: boolean; customStyle?: CustomStyle; useGoogleDriveViewer?: boolean; useGoogleReader?: boolean; withScroll?: boolean; withPinchZoom?: boolean; maximumPinchZoomScale?: number; onLoad?: (event: WebViewNavigationEvent) => void; onLoadEnd?: (event: WebViewNavigationEvent | WebViewErrorEvent) => void; onError?: (event: WebViewErrorEvent | WebViewHttpErrorEvent | string) => void; }

const originWhitelist = ['http://*', 'https://*', 'file://*', 'data:*', 'content:*'];
const htmlPath = `${cacheDirectory}index.html`;
const pdfPath = `${cacheDirectory}file.pdf`;

async function writePDFAsync(base64: string) { await writeAsStringAsync(pdfPath, base64.replace('data:application/pdf;base64,', ''), { encoding: EncodingType.Base64 }); }
export async function removeFilesAsync(): Promise<void> { const html = await getInfoAsync(htmlPath); if (html.exists) await deleteAsync(htmlPath, { idempotent: true }); const pdf = await getInfoAsync(pdfPath); if (pdf.exists) await deleteAsync(pdfPath, { idempotent: true }); }
const getGoogleReaderUrl = (url: string) => `https://docs.google.com/viewer?url=${url}`;
const getGoogleDriveUrl = (url: string) => `https://drive.google.com/viewerng/viewer?embedded=true&url=${url}`;
const Loader = () => <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}><ActivityIndicator size="large" color="#007AFF" /></View>;
const validate = ({ onError, renderType, source }: { onError: (event: WebViewErrorEvent | WebViewHttpErrorEvent | string) => void; renderType: RenderType; source: Source }) => { if (!renderType || !source) onError('source is undefined'); else if ((renderType === 'DIRECT_URL' || renderType === 'GOOGLE_READER' || renderType === 'GOOGLE_DRIVE_VIEWER' || renderType === 'URL_TO_BASE64') && (!source.uri || !(source.uri.startsWith('http') || source.uri.startsWith('file') || source.uri.startsWith('content')))) onError(`source.uri is undefined or not started with http, file or content source.uri = ${source.uri}`); else if ((renderType === 'BASE64_TO_LOCAL_PDF' || renderType === 'DIRECT_BASE64') && (!source.base64 || !source.base64.startsWith('data:application/pdf;base64,'))) onError('Base64 is not correct (ie. start with data:application/pdf;base64,)'); };
const init = async ({ renderType, setReady, source }: { renderType?: RenderType; setReady: Dispatch<SetStateAction<boolean>>; source: Source }) => { try { if (renderType === 'BASE64_TO_LOCAL_PDF') await writePDFAsync(source.base64!); setReady(true); } catch (error) { console.error(error); } };
const getRenderType = ({ source, useGoogleDriveViewer, useGoogleReader }: { source: Source; useGoogleDriveViewer?: boolean; useGoogleReader?: boolean }): RenderType | undefined => { const { uri, base64 } = source; if (useGoogleReader) return 'GOOGLE_READER'; if (useGoogleDriveViewer) return 'GOOGLE_DRIVE_VIEWER'; if (Platform.OS === 'ios') { if (uri !== undefined) return 'DIRECT_URL'; if (base64 !== undefined) return 'BASE64_TO_LOCAL_PDF'; } if (base64 !== undefined) return 'DIRECT_BASE64'; if (uri !== undefined) return 'URL_TO_BASE64'; return undefined; };
const getWebviewSource = ({ source, renderType, onError }: { source: Source; renderType?: RenderType; onError: (event: WebViewErrorEvent | WebViewHttpErrorEvent | string) => void }): WebViewSource | undefined => { const { uri, headers } = source; switch (renderType) { case 'GOOGLE_READER': return { uri: getGoogleReaderUrl(uri!) }; case 'GOOGLE_DRIVE_VIEWER': return { uri: getGoogleDriveUrl(uri || '') }; case 'DIRECT_BASE64': case 'URL_TO_BASE64': return { uri: htmlPath }; case 'DIRECT_URL': return { headers, uri: uri! }; case 'BASE64_TO_LOCAL_PDF': return { uri: pdfPath }; default: onError('Unknown RenderType'); return undefined; } };

const PdfViewer = ({ source, style, webviewStyle, webviewProps, noLoader = false, useGoogleDriveViewer, useGoogleReader, onLoad, onLoadEnd, onError = console.error }: Props) => {
  const [ready, setReady] = useState(false); const [renderType, setRenderType] = useState<RenderType>(); const [renderedOnce, setRenderedOnce] = useState(false);
  useEffect(() => { if (renderType) { validate({ onError, renderType, source }); init({ renderType, setReady, source }); } return () => { if (renderType === 'DIRECT_BASE64' || renderType === 'URL_TO_BASE64' || renderType === 'BASE64_TO_LOCAL_PDF') removeFilesAsync(); }; }, [renderType]);
  useEffect(() => { if (source.uri || source.base64) { setReady(false); setRenderType(getRenderType({ source, useGoogleDriveViewer, useGoogleReader })); } }, [source.uri, source.base64]);
  const sourceToUse = useMemo(() => renderType && source ? getWebviewSource({ onError, renderType, source }) : undefined, [onError, renderType, source]);
  const isAndroid = useMemo(() => Platform.OS === 'android', []);
  return ready ? <View style={[styles.container, style]}><WebView {...{ onError, onHttpError: onError, onLoad: event => { setRenderedOnce(true); onLoad?.(event); }, onLoadEnd, originWhitelist, source: renderedOnce || !isAndroid ? sourceToUse : undefined, style: [styles.webview, webviewStyle] }} allowFileAccess={isAndroid} allowFileAccessFromFileURLs={isAndroid} allowUniversalAccessFromFileURLs={isAndroid} scalesPageToFit={Platform.select({ android: false })} mixedContentMode={isAndroid ? 'always' : undefined} sharedCookiesEnabled={false} startInLoadingState={!noLoader} renderLoading={() => noLoader ? <View /> : <Loader />} {...webviewProps} /></View> : <View style={styles.loaderContainer}>{!noLoader && <Loader />}</View>;
};
const styles = StyleSheet.create({ container: { flex: 1 }, loaderContainer: { alignItems: 'center', flex: 1, justifyContent: 'center' }, webview: { flex: 1 } });
export default PdfViewer;
