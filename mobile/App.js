import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  Alert, 
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  SafeAreaView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';
import { WebView } from 'react-native-webview';

const SOCKET_SERVER = 'http://10.102.9.10:4000'; // CHANGE TO YOUR IP

export default function App() {
  const [socket, setSocket] = useState(null);
  const [user, setUser] = useState(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [showTailPopup, setShowTailPopup] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [tempUsername, setTempUsername] = useState('');

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const userData = await AsyncStorage.getItem('catchMyTailUser');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      connectSocket(parsedUser);
    } else {
      setShowRegistration(true);
    }
  };

  const connectSocket = (userData) => {
    const SOCKET = io(SOCKET_SERVER);

    SOCKET.on('connect', () => {
      console.log('✅ Connected');
      SOCKET.emit('register', userData);
    });

    SOCKET.on('registration-complete', (data) => {
      console.log('✅ Registered');
    });

    SOCKET.on('tail-received', (tail) => {
      Alert.alert(
        `${tail.from} sent you a tail!`,
        tail.message || 'Join me',
        [
          { text: 'Catch', onPress: () => SOCKET.emit('catch-tail', { tailId: tail.id }) },
          { text: 'Later' }
        ]
      );
    });

    SOCKET.on('session-started', (session) => {
      setActiveSession(session);
    });

    SOCKET.on('new-chat-message', (message) => {
      if (activeSession) {
        setActiveSession(prev => ({
          ...prev,
          session: {
            ...prev.session,
            messages: [...(prev.session.messages || []), message]
          }
        }));
      }
    });

    setSocket(SOCKET);
  };

  // REGISTRATION MODAL
  if (showRegistration) {
    return (
      <SafeAreaView style={styles.centeredView}>
        <View style={styles.registrationCard}>
          <Text style={styles.logo}>🦊</Text>
          <Text style={styles.title}>Catch My Tail</Text>

          <TextInput
            style={styles.input}
            placeholder="Username"
            value={tempUsername}
            onChangeText={setTempUsername}
          />

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={async () => {
              if (tempUsername) {
                const userData = { username: tempUsername, contacts: ['demo-user-2'] };
                await AsyncStorage.setItem('catchMyTailUser', JSON.stringify(userData));
                setUser(userData);
                setShowRegistration(false);
                connectSocket(userData);
              }
            }}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // MAIN APP
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centeredView}>
        <Text style={styles.statusText}>🦊 Catch My Tail Active</Text>
        <Text style={styles.username}>Logged in as {user?.username}</Text>

        <TouchableOpacity
          style={styles.floatingTail}
          onPress={() => setShowTailPopup(true)}
        >
          <Text style={styles.tailEmoji}>🦊</Text>
        </TouchableOpacity>
      </View>

      {/* TAIL POPUP */}
      <Modal visible={showTailPopup} transparent animationType="fade">
        <TouchableOpacity 
          style={styles.popupOverlay}
          activeOpacity={1}
          onPress={() => setShowTailPopup(false)}
        >
          <View style={styles.popupCard} onStartShouldSetResponder={() => true}>
            <Text style={styles.popupTitle}>🦊 Send Tail</Text>
            <Text>Feature: Send current view to friends</Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                if (socket) {
                  socket.emit('send-tail', {
                    recipients: ['demo-user-2'],
                    url: 'mobile://current-view',
                    title: 'Check this out!',
                    message: 'Testing'
                  });
                  setShowTailPopup(false);
                  Alert.alert('✅', 'Tail sent!');
                }
              }}
            >
              <Text style={styles.buttonText}>Send Test Tail</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ACTIVE SESSION */}
      {activeSession && (
        <Modal visible={true} animationType="slide">
          <SafeAreaView style={styles.container}>
            <View style={styles.sessionHeader}>
              <Text style={styles.sessionTitle}>
                Tailing with {activeSession.session.host}
              </Text>
              <TouchableOpacity 
                onPress={() => {
                  socket.emit('end-tail-session', { tailId: activeSession.session.id });
                  setActiveSession(null);
                }}
              >
                <Text style={styles.endText}>End</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.webViewContainer}>
              <WebView
                source={{ uri: activeSession.session.url }}
                style={styles.webView}
              />
            </View>

            <View style={styles.chatContainer}>
              <FlatList
                data={activeSession.session.messages || []}
                renderItem={({ item }) => (
                  <View style={[
                    styles.chatMessage,
                    item.from === user.username ? styles.myMessage : styles.theirMessage
                  ]}>
                    <Text>{item.text}</Text>
                  </View>
                )}
              />

              <View style={styles.chatInputContainer}>
                <TextInput
                  style={styles.chatTextInput}
                  placeholder="Type message..."
                  onSubmitEditing={(e) => {
                    if (socket) {
                      socket.emit('tail-chat', {
                        tailId: activeSession.session.id,
                        text: e.nativeEvent.text
                      });
                    }
                  }}
                />
              </View>
            </View>
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  registrationCard: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10
  },
  logo: { fontSize: 60, marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 30 },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16
  },
  primaryButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10
  },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  statusText: { fontSize: 24, marginBottom: 10 },
  username: { fontSize: 16, color: '#666' },
  floatingTail: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 70,
    height: 70,
    backgroundColor: '#FF6B6B',
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10
  },
  tailEmoji: { fontSize: 35 },
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  popupCard: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20
  },
  popupTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#FF6B6B'
  },
  sessionTitle: { color: 'white', fontSize: 16, fontWeight: '600' },
  endText: { color: 'white', fontWeight: '600' },
  webViewContainer: { flex: 1 },
  webView: { flex: 1 },
  chatContainer: { height: 200, borderTopWidth: 1, borderTopColor: '#EEE' },
  chatMessage: { padding: 10, margin: 5, borderRadius: 10 },
  myMessage: { alignSelf: 'flex-end', backgroundColor: '#FF6B6B' },
  theirMessage: { alignSelf: 'flex-start', backgroundColor: '#F0F0F0' },
  chatInputContainer: { padding: 10 },
  chatTextInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8
  }
});