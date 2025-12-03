import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { socket } from "../socket";

export default function Chat() {
  const { user } = useAuth();
  const [receiverId, setReceiverId] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    socket.connect();
    socket.emit("join", user.id);

    socket.on("receive-message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("receive-message");
      socket.disconnect();
    };
  }, [user]);

  const sendMessage = () => {
    if (!message.trim() || !receiverId.trim()) return;
    socket.emit("send-message", {
      senderId: user.id,
      receiverId,
      text: message,
    });
    setMessage("");
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div style={styles.chatContainer}>
      {/* Left DM Threads */}
      <div style={styles.leftSidebar}>
        <h3 style={styles.sidebarTitle}>Messages</h3>

        {/* Example DM List – you can connect this to backend later */}
        {["alice", "bob", "charlie", "david"].map((username, index) => (
          <div
            key={index}
            style={styles.dmItem}
            onClick={() => setReceiverId(`user-${index}`)}
          >
            <div style={styles.dmAvatar}>{username[0].toUpperCase()}</div>
            <div>
              <div style={styles.dmName}>{username}</div>
              <div style={styles.dmLastMsg}>Tap to start chat</div>
            </div>
          </div>
        ))}
      </div>

      {/* Right Chat Panel */}
      <div style={styles.chatPanel}>
        {!receiverId ? (
          <div style={styles.noChatSelected}>
            <h2>Select a conversation</h2>
            <p>Choose a user from the left side to start chatting</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={styles.chatHeader}>
              <div style={styles.headerAvatar}>
                {receiverId[0]?.toUpperCase()}
              </div>
              <span style={styles.headerName}>{receiverId}</span>
            </div>

            {/* Messages */}
            <div style={styles.messagesContainer}>
              {messages.map((msg, idx) => {
                const isMe = msg.sender === user.id;
                return (
                  <div
                    key={idx}
                    style={{
                      ...styles.messageBubble,
                      ...(isMe ? styles.myMessage : styles.theirMessage),
                    }}
                  >
                    {msg.text}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={styles.inputContainer}>
              <input
                placeholder="Message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                style={styles.input}
              />
              <button onClick={sendMessage} style={styles.sendBtn}>
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  chatContainer: {
    display: "flex",
    height: "80vh",
    border: "1px solid #262626",
    background: "#000",
    color: "#fff",
    borderRadius: "8px",
    overflow: "hidden",
  },

  // LEFT SIDEBAR
  leftSidebar: {
    width: "280px",
    borderRight: "1px solid #262626",
    padding: "12px",
    overflowY: "auto",
  },
  sidebarTitle: {
    margin: 0,
    marginBottom: "12px",
    fontSize: "22px",
  },
  dmItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 6px",
    borderRadius: "8px",
    cursor: "pointer",
  },
  dmAvatar: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    background: "#262626",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
  },
  dmName: {
    fontSize: "15px",
    fontWeight: "600",
  },
  dmLastMsg: {
    fontSize: "13px",
    color: "#aaa",
  },

  // RIGHT PANEL
  chatPanel: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  chatHeader: {
    height: "60px",
    borderBottom: "1px solid #262626",
    display: "flex",
    alignItems: "center",
    padding: "0 16px",
    gap: "12px",
  },
  headerAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "#262626",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  headerName: {
    fontSize: "16px",
    fontWeight: "600",
  },

  noChatSelected: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#aaa",
  },

  messagesContainer: {
    flex: 1,
    padding: "16px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  messageBubble: {
    maxWidth: "60%",
    padding: "10px 14px",
    borderRadius: "16px",
    fontSize: "14px",
    lineHeight: "1.4",
  },
  myMessage: {
    alignSelf: "flex-end",
    background: "#3797F0",
    borderBottomRightRadius: "0px",
  },
  theirMessage: {
    alignSelf: "flex-start",
    background: "#262626",
    borderBottomLeftRadius: "0px",
  },

  inputContainer: {
    display: "flex",
    padding: "12px",
    borderTop: "1px solid #262626",
    gap: "8px",
  },
  input: {
    flex: 1,
    background: "#121212",
    border: "1px solid #333",
    borderRadius: "24px",
    color: "#fff",
    padding: "10px 14px",
    fontSize: "14px",
  },
  sendBtn: {
    background: "#3797F0",
    border: "none",
    padding: "10px 16px",
    borderRadius: "24px",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
  },
};
