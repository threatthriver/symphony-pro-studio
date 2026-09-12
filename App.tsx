import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  StatusBar,
  TouchableOpacity,
  Text,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Home, Search, Library, Settings as SettingsIcon } from 'lucide-react-native';

import { PlayerProvider } from './src/context/PlayerContext';
import { AudioEngine } from './src/components/AudioEngine';
import { MiniPlayer } from './src/components/MiniPlayer';
import { FullPlayerModal } from './src/components/FullPlayerModal';
import { QueueModal } from './src/components/QueueModal';

import { HomeScreen } from './src/screens/HomeScreen';
import { SearchScreen } from './src/screens/SearchScreen';
import { LibraryScreen } from './src/screens/LibraryScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

type Tab = 'home' | 'search' | 'library' | 'settings';

function MainApp() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const insets = useSafeAreaInsets();

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen />;
      case 'search':
        return <SearchScreen />;
      case 'library':
        return <LibraryScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <View style={[styles.mainContainer, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* Active Screen Content */}
      <View style={styles.screenContainer}>{renderScreen()}</View>

      {/* Docked Mini Player (appears if a track is playing) */}
      <MiniPlayer />

      {/* Bottom Navigation Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('home')}
          activeOpacity={0.7}
        >
          <Home
            size={22}
            color={activeTab === 'home' ? '#FF1E44' : '#8A8A9E'}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'home' && styles.activeTabLabel,
            ]}
          >
            Home
          </Text>
          {activeTab === 'home' && <View style={styles.activeDot} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('search')}
          activeOpacity={0.7}
        >
          <Search
            size={22}
            color={activeTab === 'search' ? '#FF1E44' : '#8A8A9E'}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'search' && styles.activeTabLabel,
            ]}
          >
            Explore
          </Text>
          {activeTab === 'search' && <View style={styles.activeDot} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('library')}
          activeOpacity={0.7}
        >
          <Library
            size={22}
            color={activeTab === 'library' ? '#FF1E44' : '#8A8A9E'}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'library' && styles.activeTabLabel,
            ]}
          >
            Library
          </Text>
          {activeTab === 'library' && <View style={styles.activeDot} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('settings')}
          activeOpacity={0.7}
        >
          <SettingsIcon
            size={22}
            color={activeTab === 'settings' ? '#FF1E44' : '#8A8A9E'}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'settings' && styles.activeTabLabel,
            ]}
          >
            Settings
          </Text>
          {activeTab === 'settings' && <View style={styles.activeDot} />}
        </TouchableOpacity>
      </View>

      {/* Modals and Headless Services */}
      <FullPlayerModal />
      <QueueModal />
      <AudioEngine />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PlayerProvider>
        <MainApp />
      </PlayerProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#08080A',
  },
  screenContainer: {
    flex: 1,
  },
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: '#121217',
    borderTopWidth: 1,
    borderTopColor: '#22222C',
    paddingTop: 10,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    position: 'relative',
  },
  tabLabel: {
    color: '#8A8A9E',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 0.2,
  },
  activeTabLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FF1E44',
    marginTop: 4,
  },
});
