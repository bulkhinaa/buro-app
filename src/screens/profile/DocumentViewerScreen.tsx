import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors } from '../../theme';

interface Props {
  route: { params: { uri: string } };
}

export function DocumentViewerScreen({ route }: Props) {
  const { uri } = route.params;
  const [loading, setLoading] = useState(true);

  // On web platform we're already in a browser — open in new tab
  if (Platform.OS === 'web') {
    Linking.openURL(uri);
    return null;
  }

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
      <WebView
        source={{ uri }}
        onLoadEnd={() => setLoading(false)}
        style={styles.webview}
        allowsInlineMediaPlayback={false}
        javaScriptEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3EDE8',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3EDE8',
    zIndex: 10,
  },
  webview: {
    flex: 1,
    backgroundColor: '#F3EDE8',
  },
});
