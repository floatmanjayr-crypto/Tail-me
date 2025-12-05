import React, { useEffect } from 'react';
import { View, Text, Alert } from 'react-native';
import io from 'socket.io-client';

const SOCKET = io('http://10.102.9.10:4000');   // same LAN IP as Metro

export default function App() {
  useEffect(() => {
    SOCKET.emit('join', 'demo-user-2');               // who we follow
    SOCKET.on('incomingTail', data => {
      Alert.alert(
        `${data.from} tailed you`,
        `${data.title}\n${data.note}`
      );
    });
  }, []);

  return (
    <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
      <Text style={{fontSize:24}}>Tail-me listener active</Text>
    </View>
  );
}