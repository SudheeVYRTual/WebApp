import React, { useState, useEffect } from 'react';
import sb from './SendBird';

const Chat = ({ channel, onLeaveChannel }) => {
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [replyTo, setReplyTo] = useState(null);
    const [threadMessages, setThreadMessages] = useState([]);
    const [expandedThreads, setExpandedThreads] = useState({});
    const [threadPreviews, setThreadPreviews] = useState({});
    
    // Get current user from SendBird
    const currentUser = sb.currentUser;

    useEffect(() => {
        if (channel) {
            // Load initial messages
            console.log("chat  :");
            console.log(channel);       
            // Add this debugging code to print all available methods on your channel
            const messageListQuery = channel.createPreviousMessageListQuery();
            messageListQuery.load(30, true, (fetchedMessages, error) => {
                if (error) {
                    console.error('Failed to load messages:', error);
                    return;
                }
                setMessages(fetchedMessages);
            });

            const channelHandler = new sb.ChannelHandler();

            // Handle incoming messages
            channelHandler.onMessageReceived = (receivedChannel, newMessage) => {
                // Only update if this is for our current channel
                if (receivedChannel.url === channel.url) {
                    setMessages((prevMessages) => [...prevMessages, newMessage]);

                    // Update thread messages if a reply comes in for the currently viewed thread
                    if (replyTo && newMessage.parentMessageId === replyTo.messageId) {
                        setThreadMessages((prevThreadMessages) => [...prevThreadMessages, newMessage]);
                    }
                }
            };

            // Handle thread info updates
            channelHandler.onThreadInfoUpdated = (receivedChannel, threadInfoUpdateEvent) => {
                // Only update if this is for our current channel
                if (receivedChannel.url === channel.url) {
                    // Update the message in the main list
                    setMessages(prevMessages => {
                        return prevMessages.map(msg => {
                            if (msg.messageId === threadInfoUpdateEvent.targetMessageId) {
                                // Create a new message object with updated threadInfo
                                return {
                                    ...msg,
                                    threadInfo: {
                                        ...msg.threadInfo,
                                        replyCount: threadInfoUpdateEvent.replyCount
                                    }
                                };
                            }
                            return msg;
                        });
                    });

                    // If we're currently viewing this thread, refresh it
                    if (replyTo && threadInfoUpdateEvent.targetMessageId === replyTo.messageId) {
                        refreshThreadMessages(replyTo);
                    }
                }
            };

            // Register the handler with a unique ID
            const handlerId = `${channel.url}_handler_${Date.now()}`;
            sb.addChannelHandler(handlerId, channelHandler);

            // Clean up
            return () => sb.removeChannelHandler(handlerId);
        }
    }, [channel, replyTo]);

    const sendMessage = () => {
        if (message.trim()) {
            const params = new sb.UserMessageParams();
            params.message = message;

            if (replyTo) {
                params.parentMessageId = replyTo.messageId; // Send message as a reply
            }

            channel.sendUserMessage(params, (sentMessage, error) => {
                if (error) {
                    console.error('Failed to send message:', error);
                    return;
                }
                
                // If not a threaded message, add to main message list
                if (!replyTo) {
                    setMessages(prevMessages => [...prevMessages, sentMessage]);
                } else {
                    // For threaded messages, update the reply count in the parent message
                    setMessages(prevMessages => {
                        return prevMessages.map(msg => {
                            if (msg.messageId === replyTo.messageId) {
                                const updatedReplyCount = (msg.threadInfo?.replyCount || 0) + 1;
                                return {
                                    ...msg,
                                    threadInfo: {
                                        ...msg.threadInfo,
                                        replyCount: updatedReplyCount
                                    }
                                };
                            }
                            return msg;
                        });
                    });
                    
                    // Add the reply to the thread view
                    setThreadMessages(prevThreadMessages => [...prevThreadMessages, sentMessage]);
                }
                
                setMessage('');
            });
        }
    };

    const refreshThreadMessages = (parentMessage) => {
        const params = {
            prevResultSize: 20,
            nextResultSize: 0,
            isInclusive: true,
            reverse: false,
            includeParentMessageInfo: true,
        };

        parentMessage.getThreadedMessagesByTimestamp(Date.now(), params)
            .then(({ parentMessage, threadedMessages }) => {
                setThreadMessages([...threadedMessages]);
                setReplyTo(parentMessage);
            })
            .catch((error) => {
                console.error('Failed to refresh thread messages:', error);
            });
    };

    const loadThreadMessages = (parentMessage) => {
        const params = {
            prevResultSize: 20,
            nextResultSize: 0,
            isInclusive: true,
            reverse: false,
            includeParentMessageInfo: true,
        };

        parentMessage.getThreadedMessagesByTimestamp(Date.now(), params)
            .then(({ parentMessage, threadedMessages }) => {
                setThreadMessages([...threadedMessages]);
                setReplyTo(parentMessage);
            })
            .catch((error) => {
                console.error('Failed to load thread messages:', error);
            });
    };

    const toggleThreadPreview = (messageId) => {
        setExpandedThreads(prev => ({
            ...prev,
            [messageId]: !prev[messageId]
        }));
        
        // If we're expanding and don't already have thread messages loaded
        if (!expandedThreads[messageId]) {
            const parentMessage = messages.find(msg => msg.messageId === messageId);
            if (parentMessage) {
                const params = {
                    prevResultSize: 3, // Just load a few for the preview
                    nextResultSize: 0,
                    isInclusive: true,
                    reverse: false,
                    includeParentMessageInfo: true,
                };

                parentMessage.getThreadedMessagesByTimestamp(Date.now(), params)
                    .then(({ threadedMessages }) => {
                        // Store preview messages in a new state variable to handle multiple threads
                        setThreadPreviews(prev => ({
                            ...prev,
                            [messageId]: threadedMessages
                        }));
                    })
                    .catch((error) => {
                        console.error('Failed to load thread preview:', error);
                    });
            }
        }
    };

    const closeThread = () => {
        setThreadMessages([]);
        setReplyTo(null);
    };

    const leaveChannel = async () => {
        console.log("Channel object:", channel);
        console.log("Channel type:", channel?.constructor?.name);
    
        if (!channel) {
            console.error("Invalid channel object.");
            return;
        }
    
        if (channel instanceof sb.OpenChannel) {
            try {
                await channel.exit(); // This works for OpenChannel
                alert(`Exited channel: ${channel.name}`);
                onLeaveChannel();
            } catch (error) {
                console.error("Failed to exit Open Channel:", error);
            }
        } else if (channel instanceof sb.GroupChannel) {
            try {
                await channel.leave(); // This works for GroupChannel
                alert(`Left group channel: ${channel.name}`);
                onLeaveChannel();
            } catch (error) {
                console.error("Failed to leave Group Channel:", error);
            }
        } else {
            console.error("Unknown channel type.");
        }
    };    

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const shouldShowDate = (currentMessage, previousMessage) => {
        if (!previousMessage) return true;
        const currentDate = new Date(currentMessage.createdAt).toDateString();
        const previousDate = new Date(previousMessage.createdAt).toDateString();
        return currentDate !== previousDate;
    };

    // Function to check if a message is from the current user
    const isCurrentUserMessage = (message) => {
        return message.sender && currentUser && message.sender.userId === currentUser.userId;
    };

    return (
        <div style={{ display: 'flex', height: '95vh', width: '80vw', margin: '20px auto' }}>
            {/* Main Chat Window */}
            <div style={{ flex: replyTo ? 1 : 2, display: 'flex', flexDirection: 'column', border: '1px solid #ccc', borderRadius: '10px' }}>
                <div style={{ padding: '15px', backgroundColor: '#6200ea', color: '#fff', fontSize: '20px', textAlign: 'center' }}>
                    {channel.name}
                    <button onClick={leaveChannel} style={{ float: 'right', background: 'red', color: '#fff', padding: '5px 10px', borderRadius: '5px', border: 'none', cursor: 'pointer' }}>
                        Leave Channel
                    </button>
                </div>
    
                <div style={{ flex: 1, padding: '20px', overflowY: 'auto', backgroundColor: '#f9f9f9' }}>
                    {messages.map((msg, index) => {
                        const isMyMessage = isCurrentUserMessage(msg);
                        return (
                        <div key={msg.messageId || index} style={{ marginBottom: '20px' }}>
                            {shouldShowDate(msg, messages[index - 1]) && (
                                <div style={{ textAlign: 'center', color: '#666', margin: '20px 0', fontSize: '14px', fontWeight: 'bold' }}>
                                    {formatDate(msg.createdAt)}
                                </div>
                            )}
                            <div>
                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'flex-start',
                                    justifyContent: isMyMessage ? 'flex-end' : 'flex-start', // Align my messages to right
                                }}>
                                    {!isMyMessage && (
                                        <div style={{ 
                                            marginRight: '8px', 
                                            backgroundColor: '#e0e0e0', 
                                            borderRadius: '50%', 
                                            width: '36px', 
                                            height: '36px', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center', 
                                            color: '#6200ea', 
                                            fontWeight: 'bold' 
                                        }}>
                                            {msg.sender?.nickname ? msg.sender.nickname.charAt(0).toUpperCase() : 'A'}
                                        </div>
                                    )}
                                    <div style={{ flex: isMyMessage ? 'initial' : 1, maxWidth: '70%' }}>
                                        <div style={{ 
                                            display: 'flex', 
                                            alignItems: 'center',
                                            justifyContent: isMyMessage ? 'flex-end' : 'flex-start' // Align text right for my messages
                                        }}>
                                            {!isMyMessage && (
                                                <strong style={{ color: '#6200ea', marginRight: '8px' }}>
                                                    {msg.sender?.nickname || 'Anonymous'}
                                                </strong>
                                            )}
                                            <span style={{ fontSize: '12px', color: '#666' }}>{formatTime(msg.createdAt)}</span>
                                            {/* Checkmark for sent messages */}
                                            <span style={{ marginLeft: '5px', color: '#8e24aa' }}>✓</span>
                                        </div>
                                        <div style={{ 
                                            backgroundColor: isMyMessage ? '#dcf8c6' : '#e1bee7', // Light green for my messages
                                            padding: '12px', 
                                            borderRadius: '15px', 
                                            display: 'inline-block', 
                                            maxWidth: '100%', 
                                            marginTop: '5px',
                                            float: isMyMessage ? 'right' : 'left', // Float right for my messages
                                            borderTopRightRadius: isMyMessage ? '4px' : '15px', // WhatsApp style pointed edge
                                            borderTopLeftRadius: !isMyMessage ? '4px' : '15px',
                                        }}>
                                            {msg.message}
                                        </div>
                                        
                                        <div style={{ clear: 'both' }}></div>
                                        
                                        {/* Thread info indicator */}
                                        {msg.threadInfo && msg.threadInfo.replyCount > 0 && (
                                            <div style={{ 
                                                marginTop: '5px',
                                                textAlign: isMyMessage ? 'right' : 'left' // Align to right for my messages
                                            }}>
                                                <div 
                                                    style={{ 
                                                        display: 'inline-flex', 
                                                        alignItems: 'center',
                                                        color: '#6200ea',
                                                        cursor: 'pointer',
                                                        fontSize: '13px'
                                                    }}
                                                    onClick={() => loadThreadMessages(msg)}
                                                >
                                                    <span style={{ 
                                                        backgroundColor: '#f0e6ff', 
                                                        borderRadius: '12px',
                                                        padding: '4px 8px',
                                                        display: 'flex',
                                                        alignItems: 'center'
                                                    }}>
                                                        <span>{msg.threadInfo.replyCount} replies</span>
                                                        <span style={{ marginLeft: '5px', fontSize: '12px' }}>▶</span>
                                                    </span>
                                                </div>
                                                
                                                {/* Thread preview */}
                                                {expandedThreads[msg.messageId] && threadPreviews[msg.messageId] && (
                                                    <div style={{ 
                                                        marginLeft: isMyMessage ? '0' : '20px',
                                                        marginRight: isMyMessage ? '20px' : '0',
                                                        marginTop: '5px',
                                                        borderLeft: isMyMessage ? 'none' : '2px solid #e0e0e0',
                                                        borderRight: isMyMessage ? '2px solid #e0e0e0' : 'none',
                                                        paddingLeft: isMyMessage ? '0' : '10px',
                                                        paddingRight: isMyMessage ? '10px' : '0',
                                                        textAlign: isMyMessage ? 'right' : 'left'
                                                    }}>
                                                        {threadPreviews[msg.messageId].slice(0, 2).map(reply => (
                                                            <div key={reply.messageId} style={{ marginBottom: '8px' }}>
                                                                <div style={{ 
                                                                    display: 'flex', 
                                                                    alignItems: 'center',
                                                                    justifyContent: isCurrentUserMessage(reply) ? 'flex-end' : 'flex-start'
                                                                }}>
                                                                    {!isCurrentUserMessage(reply) && (
                                                                        <div style={{ 
                                                                            marginRight: '5px', 
                                                                            backgroundColor: '#e0e0e0', 
                                                                            borderRadius: '50%', 
                                                                            width: '24px', 
                                                                            height: '24px', 
                                                                            display: 'flex', 
                                                                            alignItems: 'center', 
                                                                            justifyContent: 'center', 
                                                                            fontSize: '12px'
                                                                        }}>
                                                                            {reply.sender?.nickname ? reply.sender.nickname.charAt(0).toUpperCase() : 'A'}
                                                                        </div>
                                                                    )}
                                                                    <strong style={{ fontSize: '12px' }}>{reply.sender?.nickname || 'Anonymous'}</strong>
                                                                </div>
                                                                <div style={{ 
                                                                    fontSize: '13px', 
                                                                    marginTop: '3px',
                                                                    textAlign: isCurrentUserMessage(reply) ? 'right' : 'left'
                                                                }}>
                                                                    {reply.message}
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {threadPreviews[msg.messageId].length > 2 && (
                                                            <div style={{ 
                                                                color: '#6200ea', 
                                                                fontSize: '13px', 
                                                                cursor: 'pointer', 
                                                                marginTop: '5px',
                                                                textAlign: isMyMessage ? 'right' : 'left'
                                                            }}
                                                            onClick={() => loadThreadMessages(msg)}>
                                                                View more replies...
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        
                                        {/* Reply button */}
                                        <div style={{ 
                                            marginTop: '5px',
                                            textAlign: isMyMessage ? 'right' : 'left' // Align to right for my messages 
                                        }}>
                                            <button 
                                                onClick={() => setReplyTo(msg)} 
                                                style={{ 
                                                    color: '#6200ea', 
                                                    border: 'none', 
                                                    background: 'none', 
                                                    cursor: 'pointer',
                                                    fontSize: '13px',
                                                    padding: '2px 0'
                                                }}
                                            >
                                                Reply
                                            </button>
                                        </div>
                                    </div>
                                    {isMyMessage && (
                                        <div style={{ 
                                            marginLeft: '8px', 
                                            backgroundColor: '#6200ea', 
                                            borderRadius: '50%', 
                                            width: '36px', 
                                            height: '36px', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center', 
                                            color: 'white', 
                                            fontWeight: 'bold' 
                                        }}>
                                            {currentUser?.nickname ? currentUser.nickname.charAt(0).toUpperCase() : 'Me'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )})}
                </div>
    
                {/* Input Box for main chat */}
                <div style={{ padding: '15px', borderTop: '1px solid #ccc', display: 'flex' }}>
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type a message..."
                        style={{ flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    />
                    <button onClick={sendMessage} style={{ marginLeft: '10px', padding: '10px 20px', background: '#6200ea', color: '#fff', borderRadius: '5px', border: 'none', cursor: 'pointer' }}>
                        Send
                    </button>
                </div>
            </div>
    
            {/* Thread Panel */}
            {replyTo && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', border: '1px solid #ccc', borderRadius: '10px', marginLeft: '10px' }}>
                    <div style={{ padding: '15px', backgroundColor: '#6200ea', color: '#fff', fontSize: '18px' }}>
                        Thread
                        <button onClick={closeThread} style={{ float: 'right', background: '#ff1744', color: '#fff', padding: '5px 10px', borderRadius: '5px', border: 'none', cursor: 'pointer' }}>
                            Close
                        </button>
                    </div>
    
                    <div style={{ flex: 1, padding: '20px', overflowY: 'auto', backgroundColor: '#f9f9f9' }}>
                        {/* Display parent message first */}
                        <div style={{ marginBottom: '25px' }}>
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'flex-start',
                                justifyContent: isCurrentUserMessage(replyTo) ? 'flex-end' : 'flex-start'
                            }}>
                                {!isCurrentUserMessage(replyTo) && (
                                    <div style={{ 
                                        marginRight: '8px', 
                                        backgroundColor: '#e0e0e0', 
                                        borderRadius: '50%', 
                                        width: '36px', 
                                        height: '36px', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        color: '#3f51b5', 
                                        fontWeight: 'bold' 
                                    }}>
                                        {replyTo.sender?.nickname ? replyTo.sender.nickname.charAt(0).toUpperCase() : 'A'}
                                    </div>
                                )}
                                <div style={{ flex: isCurrentUserMessage(replyTo) ? 'initial' : 1, maxWidth: '70%' }}>
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center',
                                        justifyContent: isCurrentUserMessage(replyTo) ? 'flex-end' : 'flex-start'
                                    }}>
                                        {!isCurrentUserMessage(replyTo) && (
                                            <strong style={{ color: '#3f51b5', marginRight: '8px' }}>
                                                {replyTo.sender?.nickname || 'Anonymous'}
                                            </strong>
                                        )}
                                        <span style={{ fontSize: '12px', color: '#666' }}>{formatTime(replyTo.createdAt)}</span>
                                        <span style={{ marginLeft: '5px', color: '#8e24aa' }}>✓</span>
                                    </div>
                                    <div style={{ 
                                        backgroundColor: isCurrentUserMessage(replyTo) ? '#dcf8c6' : '#c5cae9', 
                                        padding: '12px', 
                                        borderRadius: '15px', 
                                        display: 'inline-block', 
                                        maxWidth: '100%', 
                                        marginTop: '5px',
                                        float: isCurrentUserMessage(replyTo) ? 'right' : 'left',
                                        borderTopRightRadius: isCurrentUserMessage(replyTo) ? '4px' : '15px',
                                        borderTopLeftRadius: !isCurrentUserMessage(replyTo) ? '4px' : '15px',
                                    }}>
                                        {replyTo.message}
                                    </div>
                                    <div style={{ clear: 'both' }}></div>
                                </div>
                                {isCurrentUserMessage(replyTo) && (
                                    <div style={{ 
                                        marginLeft: '8px', 
                                        backgroundColor: '#6200ea', 
                                        borderRadius: '50%', 
                                        width: '36px', 
                                        height: '36px', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        color: 'white', 
                                        fontWeight: 'bold' 
                                    }}>
                                        {currentUser?.nickname ? currentUser.nickname.charAt(0).toUpperCase() : 'Me'}
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Thread replies count */}
                        <div style={{ 
                            textAlign: 'left', 
                            color: '#666', 
                            margin: '20px 0', 
                            fontSize: '14px',
                            padding: '8px 0',
                            borderBottom: '1px solid #e0e0e0'
                        }}>
                            {threadMessages.length === 1 ? "1 reply" : `${threadMessages.length} replies`}
                        </div>
                        
                        {/* Display thread messages */}
                        {threadMessages.map((threadMsg) => {
                            const isMyThreadMsg = isCurrentUserMessage(threadMsg);
                            return (
                            <div key={threadMsg.messageId} style={{ marginBottom: '15px' }}>
                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'flex-start',
                                    justifyContent: isMyThreadMsg ? 'flex-end' : 'flex-start'
                                }}>
                                    {!isMyThreadMsg && (
                                        <div style={{ 
                                            marginRight: '8px', 
                                            backgroundColor: '#e0e0e0', 
                                            borderRadius: '50%', 
                                            width: '36px', 
                                            height: '36px', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center', 
                                            color: '#9c27b0', 
                                            fontWeight: 'bold' 
                                        }}>
                                            {threadMsg.sender?.nickname ? threadMsg.sender.nickname.charAt(0).toUpperCase() : 'A'}
                                        </div>
                                    )}
                                    <div style={{ flex: isMyThreadMsg ? 'initial' : 1, maxWidth: '70%' }}>
                                        <div style={{ 
                                            display: 'flex', 
                                            alignItems: 'center',
                                            justifyContent: isMyThreadMsg ? 'flex-end' : 'flex-start'
                                        }}>
                                            {!isMyThreadMsg && (
                                                <strong style={{ color: '#9c27b0', marginRight: '8px' }}>
                                                    {threadMsg.sender?.nickname || 'Anonymous'}
                                                </strong>
                                            )}
                                            <span style={{ fontSize: '12px', color: '#666' }}>{formatTime(threadMsg.createdAt)}</span>
                                            <span style={{ marginLeft: '5px', color: '#8e24aa' }}>✓</span>
                                        </div>
                                        <div style={{ 
                                            backgroundColor: isMyThreadMsg ? '#dcf8c6' : '#f3e5f5', 
                                            padding: '10px', 
                                            borderRadius: '15px', 
                                            display: 'inline-block', 
                                            maxWidth: '100%', 
                                            marginTop: '5px',
                                            float: isMyThreadMsg ? 'right' : 'left',
                                            borderTopRightRadius: isMyThreadMsg ? '4px' : '15px',
                                            borderTopLeftRadius: !isMyThreadMsg ? '4px' : '15px',
                                        }}>
                                            {threadMsg.message}
                                        </div>
                                        <div style={{ clear: 'both' }}></div>
                                    </div>
                                    {isMyThreadMsg && (
                                        <div style={{ 
                                            marginLeft: '8px', 
                                            backgroundColor: '#6200ea', 
                                            borderRadius: '50%', 
                                            width: '36px', 
                                            height: '36px', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center', 
                                            color: 'white', 
                                            fontWeight: 'bold' 
                                        }}>
                                            {currentUser?.nickname ? currentUser.nickname.charAt(0).toUpperCase() : 'Me'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )})}
                    </div>
    
                    {/* Input box for thread replies */}
                    <div style={{ padding: '15px', borderTop: '1px solid #ccc', display: 'flex' }}>
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder={`Reply to thread...`}
                            style={{ flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        />
                        <button onClick={sendMessage} style={{ marginLeft: '10px', padding: '10px 20px', background: '#6200ea', color: '#fff', borderRadius: '5px', border: 'none', cursor: 'pointer' }}>
                            Reply
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chat;