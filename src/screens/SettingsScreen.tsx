import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  Server,
  Wifi,
  WifiOff,
  RefreshCw,
  Sliders,
  Database,
  Info,
  Check,
} from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SettingsScreen: React.FC = () => {
  const { serverConfig, updateServerHost, refreshServerStatus } = usePlayer();

  const [hostInput, setHostInput] = useState(serverConfig.baseUrl);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleSaveHost = async () => {
    setSaving(true);
    setTestResult(null);
    try {
      await updateServerHost(hostInput);
      setTestResult('Successfully connected to server!');
    } catch {
      setTestResult('Failed to connect to specified host.');
    } finally {
      setSaving(false);
    }
  };

  const setPreset = (presetUrl: string) => {
    setHostInput(presetUrl);
  };

  const handleClearData = async () => {
    try {
      await AsyncStorage.clear();
      setTestResult('App data and cache cleared.');
      refreshServerStatus();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      {/* Server & yt-dlp Status Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Server size={20} color="#FF0000" />
          <Text style={styles.cardTitle}>yt-dlp Companion Server</Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Connection Status:</Text>
          <View style={styles.statusBadge}>
            {serverConfig.isConnected ? (
              <Wifi size={14} color="#00FF66" />
            ) : (
              <WifiOff size={14} color="#FF6666" />
            )}
            <Text
              style={[
                styles.statusValue,
                serverConfig.isConnected
                  ? styles.statusConnected
                  : styles.statusDisconnected,
              ]}
            >
              {serverConfig.isConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>yt-dlp Version:</Text>
          <Text style={styles.statusValueHighlight}>
            {serverConfig.ytDlpVersion}
          </Text>
        </View>

        {/* Input for Base URL */}
        <Text style={styles.inputLabel}>Server Base URL</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={hostInput}
            onChangeText={setHostInput}
            placeholder="http://localhost:5050"
            placeholderTextColor="#666666"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveHost}
            disabled={saving}
          >
            {saving ? (
              <RefreshCw size={16} color="#000000" />
            ) : (
              <Check size={18} color="#000000" />
            )}
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Presets */}
        <Text style={styles.presetsLabel}>Quick Presets:</Text>
        <View style={styles.presetsRow}>
          <TouchableOpacity
            style={styles.presetChip}
            onPress={() => setPreset('https://symphony-backend-d2lk.onrender.com')}
          >
            <Text style={styles.presetChipText}>Render Cloud (24/7)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.presetChip}
            onPress={() => setPreset('http://localhost:5050')}
          >
            <Text style={styles.presetChipText}>Localhost (iOS)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.presetChip}
            onPress={() => setPreset('http://10.0.2.2:5050')}
          >
            <Text style={styles.presetChipText}>Android (10.0.2.2)</Text>
          </TouchableOpacity>
        </View>

        {testResult && (
          <Text
            style={[
              styles.testResultText,
              testResult.includes('Successfully')
                ? styles.testResultSuccess
                : styles.testResultError,
            ]}
          >
            {testResult}
          </Text>
        )}
      </View>

      {/* Audio Engine Configuration */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Sliders size={20} color="#FF0000" />
          <Text style={styles.cardTitle}>Audio Engine</Text>
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingItemTitle}>Audio Quality</Text>
          <Text style={styles.settingItemSub}>
            High (Opus / m4a bestaudio format extracted via yt-dlp)
          </Text>
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingItemTitle}>Background Playback</Text>
          <Text style={styles.settingItemSub}>
            Enabled (audio continues playing when minimized)
          </Text>
        </View>
      </View>

      {/* Storage & Cache Management */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Database size={20} color="#FF0000" />
          <Text style={styles.cardTitle}>Data & Storage</Text>
        </View>

        <TouchableOpacity
          style={styles.dangerButton}
          onPress={handleClearData}
          activeOpacity={0.8}
        >
          <Text style={styles.dangerButtonText}>Clear History & Saved Cache</Text>
        </TouchableOpacity>
      </View>

      {/* About */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Info size={20} color="#FF0000" />
          <Text style={styles.cardTitle}>About</Text>
        </View>
        <Text style={styles.aboutText}>
          YouTube Music Bare React Native Client. Powered by yt-dlp and ffmpeg
          for seamless audio stream extraction and offline playback.
        </Text>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  bottomSpacer: {
    height: 120,
  },
  statusConnected: {
    color: '#00FF66',
  },
  statusDisconnected: {
    color: '#FF6666',
  },
  testResultSuccess: {
    color: '#00FF66',
  },
  testResultError: {
    color: '#FF6666',
  },
  container: {
    flex: 1,
    backgroundColor: '#030303',
    paddingHorizontal: 16,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
  },
  card: {
    backgroundColor: '#161616',
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#222222',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    color: '#888888',
    fontSize: 14,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  statusValueHighlight: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  inputLabel: {
    color: '#AAAAAA',
    fontSize: 13,
    marginTop: 8,
    marginBottom: 6,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#242424',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginLeft: 10,
  },
  saveButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 4,
  },
  presetsLabel: {
    color: '#777777',
    fontSize: 12,
    marginTop: 14,
    marginBottom: 8,
  },
  presetsRow: {
    flexDirection: 'row',
  },
  presetChip: {
    backgroundColor: '#222222',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 8,
  },
  presetChipText: {
    color: '#CCCCCC',
    fontSize: 12,
  },
  testResultText: {
    fontSize: 13,
    marginTop: 12,
    fontWeight: '600',
  },
  settingItem: {
    marginBottom: 14,
  },
  settingItemTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  settingItemSub: {
    color: '#888888',
    fontSize: 13,
    marginTop: 3,
  },
  dangerButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.3)',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#FF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  aboutText: {
    color: '#888888',
    fontSize: 13,
    lineHeight: 20,
  },
});
