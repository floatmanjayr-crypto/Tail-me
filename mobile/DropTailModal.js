import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
} from "react-native";

export default function DropTailModal({ visible, onClose, onSubmit }) {
  const [url, setUrl] = useState("");
  const [to, setTo] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!url.trim()) return;

    setLoading(true);

    await onSubmit({
      url: url.trim(),
      recipients: to ? [to.trim()] : [],
      visibility: to ? "private" : visibility,
    });

    setLoading(false);
    setUrl("");
    setTo("");
    setVisibility("public");
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View style={{
        flex: 1,
        backgroundColor: "#0B0F14",
        padding: 20,
        paddingTop: 60
      }}>
        <Text style={{
          fontSize: 22,
          fontWeight: "900",
          color: "#fff"
        }}>
          Drop a Tail 🦊
        </Text>

        <Text style={{
          color: "#6B7280",
          marginTop: 4,
          marginBottom: 20
        }}>
          Release something into the wild.
        </Text>

        <TextInput
          value={url}
          onChangeText={setUrl}
          placeholder="Paste link..."
          placeholderTextColor="#6B7280"
          style={{
            backgroundColor: "#121826",
            borderRadius: 14,
            padding: 14,
            color: "#fff",
            borderWidth: 1,
            borderColor: "#1E293B"
          }}
        />

        {visibility === "private" && (
          <TextInput
            value={to}
            onChangeText={setTo}
            placeholder="Send to @username"
            placeholderTextColor="#6B7280"
            style={{
              marginTop: 12,
              backgroundColor: "#121826",
              borderRadius: 14,
              padding: 14,
              color: "#fff",
              borderWidth: 1,
              borderColor: "#1E293B"
            }}
          />
        )}

        <View style={{
          flexDirection: "row",
          gap: 10,
          marginTop: 14
        }}>
          <TouchableOpacity
            onPress={() => setVisibility("public")}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 12,
              backgroundColor: visibility === "public" ? "#FF5C5C" : "#121826",
              alignItems: "center"
            }}
          >
            <Text style={{
              color: visibility === "public" ? "#000" : "#CBD5E1",
              fontWeight: "800"
            }}>
              🌍 Public
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setVisibility("private")}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 12,
              backgroundColor: visibility === "private" ? "#FF5C5C" : "#121826",
              alignItems: "center"
            }}
          >
            <Text style={{
              color: visibility === "private" ? "#000" : "#CBD5E1",
              fontWeight: "800"
            }}>
              🔒 Private
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleSend}
          disabled={loading}
          style={{
            marginTop: 30,
            padding: 16,
            borderRadius: 16,
            backgroundColor: "#FF5C5C",
            alignItems: "center"
          }}
        >
          <Text style={{
            color: "#000",
            fontWeight: "900",
            fontSize: 16
          }}>
            {loading ? "Releasing..." : "Release Tail 🦊"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onClose}
          style={{
            marginTop: 20,
            alignItems: "center"
          }}
        >
          <Text style={{ color: "#6B7280" }}>
            Cancel
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}