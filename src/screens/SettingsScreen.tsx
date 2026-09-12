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
        <Text style={styles.headerTitle}>Studio Settings</Text>
        <Text style={styles.headerSubtitle}>CLOUD BACKEND & AUDIO CONFIGURATION</Text>
      </View>

      {/* Server & yt-dlp Status Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconCircle}>
            <Server size={18} color="#FF1E44" />
          </View>
          <Text style={styles.cardTitle}>Symphony Cloud Engine</Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Connection Status:</Text>
          <View style={styles.statusBadge}>
            {serverConfig.isConnected ? (
              <Wifi size={14} color="#00E599" />
            ) : (
              <WifiOff size={14} color="#FF5252" />
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
          <Text style={styles.statusLabel}>yt-dlp Core Engine:</Text>
          <Text style={styles.statusValueHighlight}>
            {serverConfig.ytDlpVersion}
          </Text>
        </View>

        {/* Input for Base URL */}
        <Text style={styles.inputLabel}>Active Server Host</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={hostInput}
            onChangeText={setHostInput}
            placeholder="https://symphony-backend-d2lk.onrender.com"
            placeholderTextColor="#6A6A7D"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveHost}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <RefreshCw size={15} color="#FFFFFF" />
            ) : (
              <Check size={16} color="#FFFFFF" />
            )}
            <Text style={styles.saveButtonText}>Apply</Text>
          </TouchableOpacity>
        </View>

        {/* Presets */}
        <Text style={styles.presetsLabel}>Quick Presets:</Text>
        <View style={styles.presetsRow}>
          <TouchableOpacity
            style={[
              styles.presetChip,
              hostInput.includes('onrender') && styles.presetChipActive,
            ]}
            onPress={() => setPreset('https://symphony-backend-d2lk.onrender.com')}
          >
            <Text
              style={[
                styles.presetChipText,
                hostInput.includes('onrender') && styles.presetChipTextActive,
              ]}
            >
              Render Cloud (24/7)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.presetChip,
              hostInput.includes('localhost') && styles.presetChipActive,
            ]}
            onPress={() => setPreset('http://localhost:5050')}
          >
            <Text
              style={[
                styles.presetChipText,
                hostInput.includes('localhost') && styles.presetChipTextActive,
              ]}
            >
              Localhost (iOS)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.presetChip,
              hostInput.includes('10.0.2.2') && styles.presetChipActive,
            ]}
            onPress={() => setPreset('http://10.0.2.2:5050')}
          >
            <Text
              style={[
                styles.presetChipText,
                hostInput.includes('10.0.2.2') && styles.presetChipTextActive,
              ]}
            >
              Android (10.0.2.2)
            </Text>
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
          <View style={styles.iconCircle}>
            <Sliders size={18} color="#FF1E44" />
          </View>
          <Text style={styles.cardTitle}>Audio Fidelity & Engine</Text>
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingItemTitle}>High Fidelity Audio Pipeline</Text>
          <Text style={styles.settingItemSub}>
            Direct Opus / m4a bestaudio streams with dynamic failover piping.
          </Text>
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingItemTitle}>Background Battery Optimizer</Text>
          <Text style={styles.settingItemSub}>
            Active (throttles background audio polling to 2500ms when minimized).
          </Text>
        </View>
      </View>

      {/* Storage & Cache Management */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconCircle}>
            <Database size={18} color="#FF1E44" />
          </View>
          <Text style={styles.cardTitle}>Data & Storage</Text>
        </View>

        <TouchableOpacity
          style={styles.dangerButton}
          onPress={handleClearData}
          activeOpacity={0.8}
        >
          <Text style={styles.dangerButtonText}>Clear History & Storage Cache</Text>
        </TouchableOpacity>
      </View>

      {/* About */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconCircle}>
            <Info size={18} color="#FF1E44" />
          </View>
          <Text style={styles.cardTitle}>About Symphony Pro</Text>
        </View>
        <Text style={styles.aboutText}>
          Symphony Pro Studio Edition. High performance, battery-optimized React Native
          client powered by 24/7 cloud extraction on Render with hardware native driver animations.
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
    color: '#00E599',
  },
  statusDisconnected: {
    color: '#FF5252',
  },
  testResultSuccess: {
    color: '#00E599',
  },
  testResultError: {
    color: '#FF5252',
  },
  container: {
    flex: 1,
    backgroundColor: '#08080A',
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
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: '#6A6A7D',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 2,
  },
  card: {
    backgroundColor: '#12121A',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#242434',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 30, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    color: '#8E8E9F',
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
    color: '#8E8E9F',
    fontSize: 12,
    marginTop: 8,
    marginBottom: 6,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#181824',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2A2A3C',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 13,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF1E44',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginLeft: 10,
    shadowColor: '#FF1E44',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 4,
  },
  presetsLabel: {
    color: '#6A6A7D',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 14,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  presetChip: {
    backgroundColor: '#161622',
    borderWidth: 1,
    borderColor: '#262638',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    marginRight: 8,
    marginBottom: 6,
  },
  presetChipActive: {
    borderColor: '#FF1E44',
    backgroundColor: 'rgba(255, 30, 68, 0.1)',
  },
  presetChipText: {
    color: '#8E8E9F',
    fontSize: 12,
  },
  presetChipTextActive: {
    color: '#FF1E44',
    fontWeight: '600',
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
    fontSize: 14,
    fontWeight: '600',
  },
  settingItemSub: {
    color: '#8E8E9F',
    fontSize: 13,
    marginTop: 3,
    lineHeight: 18,
  },
  dangerButton: {
    backgroundColor: 'rgba(255, 30, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 30, 68, 0.3)',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#FF1E44',
    fontSize: 13,
    fontWeight: '700',
  },
  aboutText: {
    color: '#8E8E9F',
    fontSize: 13,
    lineHeight: 20,
  },
});
