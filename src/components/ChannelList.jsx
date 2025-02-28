import React, { useState, useEffect } from 'react';
import sb from './SendBird';

const ChannelList = ({ user, onChannelSelect }) => {
    const [channels, setChannels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [groupChannelName, setGroupChannelName] = useState('');
    const [inviteUserIds, setInviteUserIds] = useState('');
    const [creatingChannel, setCreatingChannel] = useState(false);
    const [invitedChannels, setInvitedChannels] = useState([]);

    useEffect(() => {
        if (!sb || !sb.currentUser) {
            console.error('SendBird is not initialized or user not connected');
            return;
        }
    
        setLoading(true);
    
        // Fetch Open Channels
        const openChannelQuery = sb.OpenChannel.createOpenChannelListQuery();
        openChannelQuery.next((openChannels, openError) => {
            if (openError) {
                console.error('Failed to fetch open channels:', openError);
                setLoading(false);
                return;
            }
    
            // Fetch Group Channels
            const groupChannelQuery = sb.GroupChannel.createMyGroupChannelListQuery();
            groupChannelQuery.includeEmpty = true;
            groupChannelQuery.invitedByMe = false; // Fetch invitations
            groupChannelQuery.limit = 20;
            groupChannelQuery.invitedMemberStateFilter = 'invited'; 
    
            groupChannelQuery.next((groupChannels, groupError) => {
                setLoading(false);
                if (groupError) {
                    console.error('Failed to fetch group channels:', groupError);
                    return;
                }
    
                console.log("Fetched Group Channels:", groupChannels); // Debugging step
    
                // Separate joined and invited group channels
                const joinedChannels = groupChannels.filter(channel => channel.myMemberState === 'joined');
                const invitedChannels = groupChannels.filter(channel => channel.myMemberState === 'invited');
    
                console.log("Joined Channels:", joinedChannels);  //Debugging step
                console.log("Invited Channels:", invitedChannels);  // Debugging step
    
                setChannels([...openChannels, ...joinedChannels]); 
                setInvitedChannels(invitedChannels);  
            });
        });
    }, []);      
    
    const acceptInvitation = async (channel) => {
        try {
            if (!channel.myMemberState || channel.myMemberState !== "invited") {
                alert("You are not invited to this channel!");
                return;
            }
    
            // Accept the invitation
            await channel.acceptInvitation();
            console.log("Invitation accepted:", channel);
            
            // Add this explicit join after accepting invitation
            await channel.join();
            console.log("Explicitly joined channel after accepting invitation");
    
            // Fetch the updated channel info
            const updatedChannel = await sb.GroupChannel.getChannel(channel.url);
    
            if (updatedChannel.myMemberState === "joined") {
                // Update state to show the channel in the main list
                setInvitedChannels((prevChannels) => prevChannels.filter((ch) => ch.url !== channel.url));
                setChannels((prevChannels) => [...prevChannels, updatedChannel]);
                onChannelSelect(updatedChannel);
                alert(`Joined channel: ${updatedChannel.name}`);
            } else {
                alert(`Failed to join channel: ${updatedChannel.name}. Please try again or check channel settings.`);
            }
    
        } catch (error) {
            console.error("Failed to accept invitation:", error);
            alert(`Error: ${error.message}`);
        }
    };
    
    
    const rejectInvitation = (channel) => {
        channel.rejectInvitation((response, error) => {
            if (error) {
                console.error("Failed to reject invitation:", error);
                alert("Error rejecting invitation!");
                return;
            }
            console.log("Invitation rejected:", response);
            setInvitedChannels(prev => prev.filter(c => c.url !== channel.url)); // ✅ Remove from invited list
        });
    };

    const joinChannel = (channel) => {
        if (!channel.isOpenChannel()) {
            // Group channel: Use enter for private group chats
            channel.join((response, error) => {
                if (error) {
                    console.error('Failed to join group channel:', error);
                    return;
                }
                console.log(`Joined group channel: ${channel.name}`);
                onChannelSelect(channel);
            });
        } else if (channel.isOpenChannel()) {
            // Open channel: Use enter for public channels
            channel.enter((error) => {
                if (error) {
                    console.error('Failed to join open channel:', error);
                    return;
                }
                console.log(`Joined open channel: ${channel.name}`);
                onChannelSelect(channel);
            });
        } else {
            console.warn("Unknown channel type. Cannot join.");
        }
    };
    
    // const handleCreateGroupChannel = async () => {
    //     if (!groupChannelName.trim()) {
    //         alert("Channel name is required!");
    //         return;
    //     }
    
    //     const userIdsArray = inviteUserIds.split(',').map(id => id.trim()).filter(id => id);
    //     if (userIdsArray.length === 0) {
    //         alert("Please enter at least one user ID to invite.");
    //         return;
    //     }
    
    //     setCreatingChannel(true);
    
    //     const params = new sb.GroupChannelParams();
    //     params.name = groupChannelName;
    //     params.isDistinct = false;
    //     params.autoAcceptInvitation = false; // Ensure manual acceptance
    //     params.addUserIds(userIdsArray); 
    
    //     try {
    //         const channel = await sb.GroupChannel.createChannel(params);
    //         console.log("Group channel created:", channel);
    //         alert(`Group channel "${channel.name}" created successfully!`);
    
    //         // Invite users after channel creation
    //         await channel.inviteWithUserIds(userIdsArray);
    //         console.log("Users invited:", userIdsArray);
    
    //         // Add the new channel to the state so it appears in the list
    //         setChannels(prevChannels => [channel, ...prevChannels]);
    
    //         setGroupChannelName('');
    //         setInviteUserIds('');
    
    //         // Handle invitation response events
    //         sb.addChannelHandler("InvitationHandler", {
    //             onUserReceivedInvitation: (channel, invitees) => {
    //                 console.log(`Users invited to ${channel.name}:`, invitees);
    //             },
    //             onUserDeclinedInvitation: (channel, invitees) => {
    //                 console.log(`Users declined the invite to ${channel.name}:`, invitees);
    //             }
    //         });
    
    //     } catch (error) {
    //         console.error("Failed to create group channel:", error);
    //         alert(`Error: ${error.message}`);
    //     } finally {
    //         setCreatingChannel(false);
    //     }
    // };

    const handleCreateGroupChannel = async () => {
        if (!groupChannelName.trim()) {
            alert("Channel name is required!");
            return;
        }
    
        const userIdsArray = inviteUserIds.split(',').map(id => id.trim()).filter(id => id);
        if (userIdsArray.length === 0) {
            alert("Please enter at least one user ID to invite.");
            return;
        }
    
        setCreatingChannel(true);
    
        const params = new sb.GroupChannelParams();
        params.name = groupChannelName;
        params.isDistinct = false;
        params.autoAcceptInvitation = false; // Manual acceptance for invitees
        params.isPublic = true;
    
        // Add the creator directly to the channel
        params.addUserIds([sb.currentUser.userId, ...userIdsArray]); 
    
        try {
            const channel = await sb.GroupChannel.createChannel(params);
            console.log("Group channel created:", channel);
            alert(`Group channel "${channel.name}" created successfully!`);
            
            // Invite only other users (not the creator)
            await channel.inviteWithUserIds(userIdsArray);
            console.log("Users invited:", userIdsArray);
    
            // Add the new channel to the state so it appears in the list
            setChannels(prevChannels => [channel, ...prevChannels]);
    
            setGroupChannelName('');
            setInviteUserIds('');
    
            // Handle invitation response events
            sb.addChannelHandler("InvitationHandler", {
                onUserReceivedInvitation: (channel, invitees) => {
                    console.log(`Users invited to ${channel.name}:`, invitees);
                },
                onUserDeclinedInvitation: (channel, invitees) => {
                    console.log(`Users declined the invite to ${channel.name}:`, invitees);
                }
            });
    
        } catch (error) {
            console.error("Failed to create group channel:", error);
            alert(`Error: ${error.message}`);
        } finally {
            setCreatingChannel(false);
        }
    };
    
    

    return (
        <div style={{ width: '350px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)', maxHeight: '95vh', overflowY: 'auto' }}>
            
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#6200ea', paddingBottom: '10px', borderBottom: '2px solid #e0e0e0', marginBottom: '15px' }}>
                Available Channels
            </div>

            {/* Pending Invitations */}
            {/* Display Invited Group Channels */}
            {invitedChannels.length > 0 && (
                <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#ffe0b2', borderRadius: '8px' }}>
                    <h3 style={{ fontSize: '16px', color: '#d84315' }}>Pending Invitations</h3>
                    {invitedChannels.map(channel => (
                        <div key={channel.url} style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                            <div style={{ fontWeight: 'bold', color: '#333' }}>{channel.name}</div>
                            <div style={{ marginTop: '5px' }}>
                                <button 
                                    onClick={() => acceptInvitation(channel)} 
                                    style={{ marginRight: '10px', padding: '5px 10px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '5px' }}>
                                    Accept
                                </button>
                                <button 
                                    onClick={() => rejectInvitation(channel)} 
                                    style={{ padding: '5px 10px', backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: '5px' }}>
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {loading ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#6200ea' }}>Loading channels...</div>
            ) : channels.length > 0 ? (
                channels.map((channel) => (
                    <div key={channel.url} style={{ 
                        marginBottom: '12px', 
                        padding: '15px', 
                        backgroundColor: channel.isOpenChannel ? '#e3f2fd' : 'white',  // 🔵 Open Channels = Blue
                        borderRadius: '8px', 
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between' 
                    }} onClick={() => joinChannel(channel)}>
                        <div>
                            <div style={{ fontWeight: 'bold', color: '#333', fontSize: '16px', marginBottom: '5px' }}>
                                {channel.name} {channel.isOpenChannel ? '🌐' : '👥'}
                            </div>
                            <div style={{ fontSize: '13px', color: '#666' }}>
                                {channel.isOpenChannel ? `${channel.participantCount || 0} participants` : `Group Channel`}
                            </div>
                        </div>
                        <button style={{ 
                            background: '#6200ea', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '20px', 
                            padding: '8px 15px', 
                            fontSize: '14px', 
                            cursor: 'pointer' 
                        }} onClick={(e) => { e.stopPropagation(); joinChannel(channel); }}>
                            {channel.isOpenChannel ? "Join" : "Enter"}
                        </button>
                    </div>
                ))
                
            ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>No channels found</div>
            )}

            {/* Create Group Channel Section */}
            <div style={{ marginTop: '30px', padding: '15px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
                <h3 style={{ fontSize: '16px', color: '#6200ea', marginBottom: '10px' }}>Create Group Channel</h3>
                <input 
                    type="text" 
                    placeholder="Enter channel name" 
                    value={groupChannelName} 
                    onChange={(e) => setGroupChannelName(e.target.value)} 
                    style={{ width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
                />
                <input 
                    type="text" 
                    placeholder="Enter user IDs (comma-separated)" 
                    value={inviteUserIds} 
                    onChange={(e) => setInviteUserIds(e.target.value)} 
                    style={{ width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
                />
                <button 
                    onClick={handleCreateGroupChannel} 
                    disabled={creatingChannel} 
                    style={{ width: '100%', padding: '10px', background: '#6200ea', color: 'white', border: 'none', borderRadius: '5px', cursor: creatingChannel ? 'not-allowed' : 'pointer' }}>
                    {creatingChannel ? "Creating..." : "Create Group Channel"}
                </button>
            </div>
        </div>
    );
};

export default ChannelList;