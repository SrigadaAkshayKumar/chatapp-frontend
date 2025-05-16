import React, { useEffect, useState, useContext } from "react";
import CryptoJS from "crypto-js";
import { UserContext } from "./UserContext";
import socket from "../socket";
import { ref, get } from "firebase/database";
import { realtimeDb } from "./firebase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faTrashAlt } from "@fortawesome/free-solid-svg-icons";

const Chat = () => {
  const { user } = useContext(UserContext);
  const [recipientId, setRecipientId] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("direct");
  const [chats, setChats] = useState({});
  const [activeChats, setActiveChats] = useState({});
  const [error, setError] = useState("");
  const [decryptPasskeys, setDecryptPasskeys] = useState({});
  const [unreadMessages, setUnreadMessages] = useState({});
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    if (!user || !user.userId) {
      setError("You must be logged in to use the chat.");
      return;
    }

    socket.emit("register", { userId: user.userId });

    const handleReceiveMessage = (data) => {
      const chatKey =
        user.userId < data.senderId
          ? `${user.userId}-${data.senderId}`
          : `${data.senderId}-${user.userId}`;

      setChats((prev) => ({
        ...prev,
        [chatKey]: [
          ...(prev[chatKey] || []),
          {
            ...data,
            decryptedMessage:
              data.messageType === "direct" ? data.encryptedMessage : null,
            isDecrypted: data.messageType === "direct",
            sentTime: data.sentTime,
          },
        ],
      }));
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.emit("loadUnseenMessages", { userId: user.userId });
    socket.on("loadUnseenMessages", (unseenMessages) => {
      setUnreadMessages(unseenMessages);
    });

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("loadUnseenMessages");
    };
  }, [user]);

  const markAsSeen = (chatKey) => {
    setChats((prevChats) => ({
      ...prevChats,
      [chatKey]: [
        ...(prevChats[chatKey] || []),
        ...(unreadMessages[chatKey] || []),
      ],
    }));
    setUnreadMessages((prev) => {
      const updated = { ...prev };
      delete updated[chatKey];
      return updated;
    });
    socket.emit("markMessagesAsSeen", { userId: user.userId, chatKey });
  };

  const decryptMessage = (encryptedMessage, passkey) => {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedMessage, passkey);
      const originalText = bytes.toString(CryptoJS.enc.Utf8);
      return originalText || "Invalid passkey";
    } catch {
      return "Decryption error";
    }
  };

  const handleDecrypt = (senderId, messageIndex) => {
    const passkey = decryptPasskeys[`${senderId}-${messageIndex}`];
    if (!passkey) {
      setError("Passkey is required for decryption.");
      return;
    }

    const decryptedMessage = decryptMessage(
      chats[senderId][messageIndex].encryptedMessage,
      passkey
    );

    setChats((prevChats) => ({
      ...prevChats,
      [senderId]: prevChats[senderId].map((msg, idx) =>
        idx === messageIndex
          ? {
              ...msg,
              decryptedMessage:
                decryptedMessage !== "Invalid passkey" &&
                decryptedMessage !== "Decryption error"
                  ? decryptedMessage
                  : null,
              isDecrypted:
                decryptedMessage !== "Invalid passkey" &&
                decryptedMessage !== "Decryption error",
            }
          : msg
      ),
    }));

    if (
      decryptedMessage === "Invalid passkey" ||
      decryptedMessage === "Decryption error"
    ) {
      setError("Incorrect passkey. Try again.");
    } else {
      setError("");
    }
  };

  const handleSendMessage = async () => {
    if (!user || !user.userId) {
      setError("Please login to send a message.");
      return;
    }

    if (!recipientId || !message) {
      setError("Recipient ID and message are required.");
      return;
    }

    try {
      const userRef = ref(realtimeDb, `Authentication/${recipientId}`);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        setError("Recipient ID is not registered.");
        return;
      }

      const chatKey =
        user.userId < recipientId
          ? `${user.userId}-${recipientId}`
          : `${recipientId}-${user.userId}`;

      const sentTime = new Date().toISOString();
      const encryptedMessage =
        messageType === "encrypted"
          ? CryptoJS.AES.encrypt(
              message,
              decryptPasskeys[recipientId] || ""
            ).toString()
          : message;

      socket.emit("sendMessage", {
        senderId: user.userId,
        recipientId,
        encryptedMessage,
        messageType,
        sentTime,
      });

      setChats((prev) => ({
        ...prev,
        [chatKey]: [
          ...(prev[chatKey] || []),
          {
            senderId: user.userId,
            decryptedMessage: message,
            isDecrypted: true,
            messageType,
            sentTime,
          },
        ],
      }));
      setMessage("");
      setError("");
    } catch (error) {
      setError("Error checking recipient ID. Please try again.");
    }
  };

  const toggleChat = (chatKey) => {
    setActiveChats((prev) => ({
      ...prev,
      [chatKey]: !prev[chatKey],
    }));
  };

  useEffect(() => {
    const savedChats = JSON.parse(localStorage.getItem("chats") || "{}");
    setChats(savedChats);
  }, []);

  useEffect(() => {
    if (chats && Object.keys(chats).length > 0) {
      localStorage.setItem("chats", JSON.stringify(chats));
    }
  }, [chats]);

  const deleteChatMessage = (chatKey, index) => {
    setChats((prevChats) => {
      const updatedChats = { ...prevChats };
      updatedChats[chatKey].splice(index, 1);
      if (updatedChats[chatKey].length === 0) {
        delete updatedChats[chatKey];
      }
      localStorage.setItem("chats", JSON.stringify(updatedChats));
      return updatedChats;
    });
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollButton(window.scrollY > 200);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div>
      <div>
        <h1 className="chat-title">Chat</h1>
        {error && <div className="chat-error">{error}</div>}
        <div className="chat-inputs">
          <input
            className="chat-input"
            placeholder="Recipient ID"
            value={recipientId}
            onChange={(e) => setRecipientId(e.target.value)}
          />
          <input
            className="chat-input"
            placeholder="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <select
            className="chat-select"
            value={messageType}
            onChange={(e) => setMessageType(e.target.value)}
          >
            <option value="direct">Direct Message</option>
            <option value="encrypted">Encrypted Message</option>
          </select>
          {messageType === "encrypted" && (
            <input
              className="chat-input"
              placeholder="Encryption Passkey"
              value={decryptPasskeys[recipientId] || ""}
              onChange={(e) =>
                setDecryptPasskeys({
                  ...decryptPasskeys,
                  [recipientId]: e.target.value,
                })
              }
            />
          )}
          <button className="chat-button" onClick={handleSendMessage}>
            Send
          </button>
        </div>

        <h2 className="chat-section-title">Unread Messages</h2>
        {Object.keys(unreadMessages).map((chatKey) => (
          <div key={chatKey} className="chat-unread-section">
            <h3 className="chat-with">Chat with {chatKey}</h3>
            {unreadMessages[chatKey].map((msg, idx) => (
              <div key={idx} className="chat-message">
                <strong className="chat-message-sender">
                  {msg.senderId === user?.userId ? "You" : msg.senderId}:
                </strong>
                <div className="chat-message-time">
                  {new Date(msg.sentTime).toLocaleString()}
                </div>
                <div className="chat-message-content">
                  {msg.decryptedMessage || msg.encryptedMessage}
                </div>
              </div>
            ))}
            <button className="chat-button" onClick={() => markAsSeen(chatKey)}>
              Mark as Seen
            </button>
          </div>
        ))}

        <h2 className="chat-section-title">Chats</h2>
        {Object.keys(chats).map((chatKey) => (
          <div key={chatKey} className="chat-section">
            <div className="chat-section1" onClick={() => toggleChat(chatKey)}>
              <h3 className="chat-with clickable">Chat with {chatKey}</h3>
              <span>
                <FontAwesomeIcon icon={faBell} className="header-logo-icon" />
              </span>
            </div>
            {activeChats[chatKey] && (
              <div className="chat-active-section">
                {chats[chatKey].map((msg, idx) => (
                  <div key={idx} className="chat-message">
                    <strong className="chat-message-sender">
                      {msg.senderId === user?.userId ? "You" : msg.senderId}:
                    </strong>
                    <div className="chat-flex">
                      <div>
                        <div className="chat-message-content">
                          {msg.decryptedMessage || msg.encryptedMessage}
                        </div>
                        <div className="chat-message-time">
                          {new Date(msg.sentTime).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <button
                          className="chat-delete-button"
                          onClick={() => deleteChatMessage(chatKey, idx)}
                        >
                          <FontAwesomeIcon icon={faTrashAlt} />
                        </button>
                      </div>
                    </div>
                    {msg.senderId !== user?.userId &&
                      msg.messageType === "encrypted" &&
                      !msg.isDecrypted && (
                        <div className="chat-decrypt-section">
                          <input
                            className="chat-input"
                            placeholder="Decrypt Passkey"
                            value={decryptPasskeys[`${chatKey}-${idx}`] || ""}
                            onChange={(e) =>
                              setDecryptPasskeys({
                                ...decryptPasskeys,
                                [`${chatKey}-${idx}`]: e.target.value,
                              })
                            }
                          />
                          <button
                            className="chat-button"
                            onClick={() => handleDecrypt(chatKey, idx)}
                          >
                            Decrypt
                          </button>
                        </div>
                      )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      {showScrollButton && (
        <button className="scroll-to-top" onClick={scrollToTop}>
          ↑
        </button>
      )}
    </div>
  );
};

export default Chat;
