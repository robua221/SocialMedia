import { useEffect, useState, useRef } from "react";
import { useAuth, authHeader } from "../context/AuthContext";
import { socket } from "../socket";

export default function Chat() {
  const { user } = useAuth();

  const [userList, setUserList] = useState([]);
  const [receiverId, setReceiverId] = useState("");
  const [activeUser, setActiveUser] = useState(null);

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");

  const [typingFromOther, setTypingFromOther] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  /* ----------------------------------------------------------
     LOAD USER LIST
  ---------------------------------------------------------- */
  useEffect(() => {
    fetch("http://localhost:5001/api/users/all", {
      headers: authHeader(),
    })
      .then((res) => res.json())
      .then((data) => setUserList(data.users || []))
      .catch(console.error);
  }, []);

  /* ----------------------------------------------------------
     CONNECT SOCKET ONLY ONCE
  ---------------------------------------------------------- */
  useEffect(() => {
    if (!user) return;

    socket.connect();
    socket.emit("join", user.id);

    return () => {
      socket.disconnect();
    };
  }, [user]);

  /* ----------------------------------------------------------
     LISTEN TO SOCKET EVENTS — ATTACH ONCE
  ---------------------------------------------------------- */
  useEffect(() => {
    const receiveHandler = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    const onlineHandler = (id) => {
      setOnlineUsers((prev) => new Set([...prev, id]));
    };

    const offlineHandler = (id) => {
      setOnlineUsers((prev) => {
        const s = new Set(prev);
        s.delete(id);
        return s;
      });
    };

    socket.off("receive-message");
    socket.off("user-online");
    socket.off("user-offline");

    socket.on("receive-message", receiveHandler);
    socket.on("user-online", onlineHandler);
    socket.on("user-offline", offlineHandler);

    return () => {
      socket.off("receive-message");
      socket.off("user-online");
      socket.off("user-offline");
    };
  }, []);

  /* ----------------------------------------------------------
     LOAD CHAT HISTORY WHEN SELECTING USER
  ---------------------------------------------------------- */
  useEffect(() => {
    if (!receiverId) return;

    const selected = userList.find((u) => u._id === receiverId);
    setActiveUser(selected);

    fetch(`http://localhost:5001/api/messages/${receiverId}`, {
      headers: authHeader(),
    })
      .then((res) => res.json())
      .then((data) => setMessages(data.messages || []))
      .catch(() => setMessages([]));
  }, [receiverId, userList]);

  /* ----------------------------------------------------------
     TYPING EVENTS — reset on receiver change
  ---------------------------------------------------------- */
  useEffect(() => {
    const typingHandler = ({ senderId }) => {
      if (senderId === receiverId) {
        setTypingFromOther(true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(
          () => setTypingFromOther(false),
          1500
        );
      }
    };

    const stopTypingHandler = ({ senderId }) => {
      if (senderId === receiverId) setTypingFromOther(false);
    };

    socket.off("typing");
    socket.off("stop-typing");

    socket.on("typing", typingHandler);
    socket.on("stop-typing", stopTypingHandler);

    return () => {
      socket.off("typing");
      socket.off("stop-typing");
    };
  }, [receiverId]);

  /* ----------------------------------------------------------
     MARK MESSAGES SEEN
  ---------------------------------------------------------- */
  useEffect(() => {
    if (!receiverId) return;

    socket.emit("mark-seen", {
      senderId: receiverId,
      receiverId: user.id,
    });
  }, [receiverId]);

  /* ----------------------------------------------------------
     SEND MESSAGE
  ---------------------------------------------------------- */
  const sendMessage = () => {
    if (!message.trim()) return;

    socket.emit("send-message", {
      senderId: user.id,
      receiverId,
      text: message,
    });

    setMessage("");
    socket.emit("stop-typing", { senderId: user.id, receiverId });
  };

  /* ----------------------------------------------------------
     AUTO SCROLL WHEN MESSAGES CHANGE
  ---------------------------------------------------------- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ----------------------------------------------------------
     INPUT HANDLER (TYPING)
  ---------------------------------------------------------- */
  const handleMessageChange = (e) => {
    const text = e.target.value;
    setMessage(text);

    if (!receiverId) return;

    if (text.trim()) {
      socket.emit("typing", { senderId: user.id, receiverId });
    } else {
      socket.emit("stop-typing", { senderId: user.id, receiverId });
    }
  };

  /* ----------------------------------------------------------
     UI RENDER
  ---------------------------------------------------------- */
  return (
    <div style={styles.pageContainer}>
      {/* LEFT SIDEBAR */}
      <div style={styles.dmList}>
        <h2 style={styles.inboxTitle}>Messages</h2>

        <div style={styles.userScroll}>
          {(userList || [])
            .filter((u) => u._id !== user.id)
            .map((u) => (
              <div
                key={u._id}
                onClick={() => setReceiverId(u._id)}
                style={{
                  ...styles.dmUser,
                  background: receiverId === u._id ? "#111" : "transparent",
                }}
              >
                <div style={styles.dmAvatar}>{u.username[0].toUpperCase()}</div>
                <div>
                  <div style={styles.dmName}>{u.username}</div>
                  <div style={styles.dmPreview}>Tap to chat</div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* RIGHT CHAT PANEL */}
      <div style={styles.chatPanel}>
        {!receiverId ? (
          <div style={styles.emptyChat}>
            <h1>Select a conversation</h1>
            <p>Choose a user to start chatting</p>
          </div>
        ) : (
          <>
            {/* HEADER */}
            <div style={styles.chatHeader}>
              <div style={styles.headerAvatar}>
                {activeUser?.username[0].toUpperCase()}
              </div>
              <div>
                <div style={styles.headerName}>{activeUser?.username}</div>
                <div style={styles.onlineText}>
                  {typingFromOther
                    ? "Typing..."
                    : onlineUsers.has(receiverId)
                    ? "Online"
                    : "Offline"}
                </div>
              </div>
            </div>

            {/* MESSAGES */}
            <div style={styles.messagesContainer}>
              {messages.map((msg, idx) => {
                const senderId =
                  typeof msg.sender === "string" ? msg.sender : msg.sender?._id;

               const isMe =
  senderId === user.id ||
  senderId === user._id;

                return (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      justifyContent: isMe ? "flex-end" : "flex-start",
                      marginBottom: "10px",
                    }}
                  >
                    {!isMe && (
                      <div style={styles.bubbleAvatar}>
                        {activeUser?.username[0].toUpperCase()}
                      </div>
                    )}

                    <div
                      style={{
                        ...styles.bubble,
                        ...(isMe ? styles.myBubble : styles.theirBubble),
                      }}
                    >
                      {msg.text}

                      {isMe && (
                        <div style={styles.seenText}>
                          {msg.seen
                            ? "Seen ✓✓"
                            : msg.delivered
                            ? "Delivered ✓"
                            : "Sent •"}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              <div ref={messagesEndRef}></div>
            </div>

            {/* INPUT */}
            <div style={styles.inputBar}>
              <input
                value={message}
                onChange={handleMessageChange}
                placeholder="Message..."
                style={styles.input}
              />

              <button onClick={sendMessage} style={styles.sendButton}>
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------
   INSTAGRAM-STYLE UI
---------------------------------------------------------- */
const styles = {
  pageContainer: {
    display: "flex",
    height: "90vh",
    background: "#000",
    color: "#fff",
  },

  dmList: {
    width: "300px",
    borderRight: "1px solid #262626",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
  },

  inboxTitle: {
    fontSize: "22px",
    fontWeight: "600",
  },

  userScroll: {
    marginTop: "20px",
    flex: 1,
    overflowY: "auto",
  },

  dmUser: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "0.2s",
  },

  dmAvatar: {
    width: "46px",
    height: "46px",
    borderRadius: "50%",
    background: "#333",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "18px",
    fontWeight: "600",
  },

  dmName: { fontSize: "15px", fontWeight: "600" },
  dmPreview: { fontSize: "12px", color: "#aaa" },

  chatPanel: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },

  emptyChat: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
    color: "#aaa",
  },

  chatHeader: {
    height: "70px",
    borderBottom: "1px solid #262626",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "0 20px",
  },

  headerAvatar: {
    width: "45px",
    height: "45px",
    borderRadius: "50%",
    background: "#262626",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  headerName: { fontSize: "16px", fontWeight: "600" },
  onlineText: { fontSize: "12px", color: "#777" },

  messagesContainer: {
    flex: 1,
    padding: "20px",
    overflowY: "auto",
  },

  bubble: {
    maxWidth: "70%",
    padding: "10px 14px",
    borderRadius: "20px",
    fontSize: "14px",
    lineHeight: "1.4",
  },

  myBubble: {
    background: "#3797F0",
    alignSelf: "flex-end",
    borderBottomRightRadius: "5px",
  },

  theirBubble: {
    background: "#262626",
    borderBottomLeftRadius: "5px",
  },

  bubbleAvatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "#333",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginRight: "6px",
  },

  seenText: {
    fontSize: "11px",
    textAlign: "right",
    marginTop: "4px",
    opacity: 0.8,
  },

  inputBar: {
    display: "flex",
    padding: "12px 20px",
    borderTop: "1px solid #262626",
    gap: "10px",
  },

  input: {
    flex: 1,
    borderRadius: "20px",
    padding: "12px",
    background: "#111",
    color: "#fff",
    border: "1px solid #333",
  },

  sendButton: {
    background: "#3797F0",
    padding: "12px 18px",
    borderRadius: "20px",
    border: "none",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
  },
};
