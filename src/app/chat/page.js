'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, limit, doc, getDoc, updateDoc, setDoc, where } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { uploadImage } from '@/lib/cloudinary';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useGamification } from '@/context/GamificationContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { MessagesSquare, Send, Hash, Menu, X, Image as ImageIcon, CheckCircle, ExternalLink, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { createNotification } from '@/lib/notifications';

const PUBLIC_ROOMS = [
  { id: 'general',          label: 'general',          emoji: '💬', col: 'chatMessages',            desc: 'General announcements and student chatter', type: 'public' },
  { id: 'cse',              label: 'cse',              emoji: '💻', col: 'chatMessages_cse',        desc: 'Computer Science department discussion', type: 'public' },
  { id: 'entc',             label: 'entc',             emoji: '📡', col: 'chatMessages_entc',       desc: 'Electronics & Telecomm discussion', type: 'public' },
  { id: 'mechanical',       label: 'mechanical',       emoji: '⚙️', col: 'chatMessages_mech',       desc: 'Mechanical engineering discussion', type: 'public' },
  { id: 'civil',            label: 'civil',            emoji: '🏗️', col: 'chatMessages_civil',      desc: 'Civil engineering discussion', type: 'public' },
  { id: 'placements',       label: 'placements',       emoji: '💼', col: 'chatMessages_placements', desc: 'Placement preparation, mock talks & jobs', type: 'public' },
];

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={
        <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', color: '#94a3b8' }}>
          <div className="spinner spinner-lg" />
        </div>
      }>
        <ChatContent />
      </Suspense>
    </ProtectedRoute>
  );
}

function ChatContent() {
  const { user, userData } = useAuth();
  const toast = useToast();
  const { gainXP } = useGamification();
  const searchParams = useSearchParams();
  const itemId = searchParams.get('itemId');
  const sellerIdParam = searchParams.get('sellerId');
  const sellerNameParam = searchParams.get('sellerName');

  const [room, setRoom] = useState(PUBLIC_ROOMS[0]);
  const [dmRooms, setDmRooms] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [channelsOpen, setChannelsOpen] = useState(true);
  const [activeItem, setActiveItem] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [chatUploadProgress, setChatUploadProgress] = useState(0);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Fetch DM Rooms
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'direct_chats'),
      where('participants', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const fetchedDms = snap.docs.map(d => {
        const data = d.data();
        const otherUserId = data.participants.find(id => id !== user.uid);
        const otherUserName = data.participantNames ? data.participantNames[otherUserId] : 'User';
        return {
          id: d.id,
          label: otherUserName || 'User',
          emoji: '👤',
          type: 'dm',
          desc: 'Direct Message',
          data
        };
      });
      setDmRooms(fetchedDms);
    });
    return () => unsub();
  }, [user]);

  // Handle auto-routing to DM from URL params
  useEffect(() => {
    if (!user || !sellerIdParam) return;
    
    // Don't DM yourself
    if (sellerIdParam === user.uid) return;

    const setupDm = async () => {
      const chatId = user.uid < sellerIdParam ? `${user.uid}_${sellerIdParam}` : `${sellerIdParam}_${user.uid}`;
      const chatRef = doc(db, 'direct_chats', chatId);
      const chatSnap = await getDoc(chatRef);
      
      const otherName = sellerNameParam || 'Seller';
      const myName = userData?.displayName || 'Anonymous';

      if (!chatSnap.exists()) {
        // Create new DM
        await setDoc(chatRef, {
          participants: [user.uid, sellerIdParam],
          participantNames: {
            [user.uid]: myName,
            [sellerIdParam]: otherName
          },
          updatedAt: serverTimestamp(),
          lastMessage: ''
        });
      }

      setRoom({
        id: chatId,
        label: otherName,
        emoji: '👤',
        type: 'dm',
        desc: 'Direct Message',
        data: { participants: [user.uid, sellerIdParam] }
      });
    };
    setupDm();
  }, [user, sellerIdParam, sellerNameParam, userData]);

  // Fetch active item details for listing context
  useEffect(() => {
    if (!itemId) {
      setActiveItem(null);
      return;
    }
    const fetchItem = async () => {
      try {
        const docRef = doc(db, 'listings', itemId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setActiveItem({ id: snap.id, ...snap.data() });
        }
      } catch (err) {
        console.error("Error fetching active item for chat context:", err);
      }
    };
    fetchItem();
  }, [itemId]);

  // Fetch Messages based on active room
  useEffect(() => {
    if (!room || !user) return;
    setMessages([]);
    let q;

    if (room.type === 'dm') {
      q = query(collection(db, 'direct_chats', room.id, 'messages'), orderBy('createdAt', 'asc'), limit(200));
    } else {
      q = query(collection(db, room.col), orderBy('createdAt', 'asc'), limit(200));
    }

    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [room, user]);

  useEffect(() => {
    if (messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
    }
  }, [messages]);

  const sendMessage = async (msgText, mediaUrl = null) => {
    if (!user) return;
    const msgData = {
      text: msgText,
      senderId: user.uid,
      senderName: userData?.displayName || 'Anonymous',
      createdAt: serverTimestamp(),
    };
    if (mediaUrl) {
      msgData.mediaUrl = mediaUrl;
    }

    if (room.type === 'dm') {
      // Add to messages subcollection
      await addDoc(collection(db, 'direct_chats', room.id, 'messages'), msgData);
      
      // Update parent document
      let lastMsgSnippet = msgText;
      if (!lastMsgSnippet && mediaUrl) lastMsgSnippet = '📷 Image';
      if (lastMsgSnippet && lastMsgSnippet.length > 30) lastMsgSnippet = lastMsgSnippet.substring(0, 30) + '...';

      await updateDoc(doc(db, 'direct_chats', room.id), {
        lastMessage: lastMsgSnippet,
        updatedAt: serverTimestamp()
      });

      const recipientId = room.data?.participants?.find(id => id !== user.uid);
      if (recipientId) {
        await createNotification(
          recipientId,
          `New message from ${userData?.displayName || 'a student'}`,
          msgText || '📷 Sent an image',
          'Community',
          { link: '/chat', chatId: room.id, type: 'direct_message' }
        );
      }
    } else {
      // Public room
      await addDoc(collection(db, room.col), msgData);
    }
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      await sendMessage(input.trim());
      setInput('');
    } catch (err) {
      console.error(err);
      toast.error('Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleAttachClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid image type. Please select a JPG, PNG, or WEBP image.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB.');
      return;
    }

    setUploading(true);
    setChatUploadProgress(0);
    try {
      const downloadURL = await uploadImage(file, (progress) => {
        setChatUploadProgress(progress);
      }, 'sharevit/chat');

      await sendMessage('', downloadURL);
      toast.success('Image sent!');
    } catch (err) {
      console.error('Error uploading image:', err);
      toast.error(err.message || 'Failed to upload image.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleMarkCompleted = async () => {
    if (!activeItem || !user || activeItem.sellerId !== user.uid) return;

    let finalStatus = 'Completed';
    if (activeItem.listingType === 'Sell') finalStatus = 'Sold';
    else if (activeItem.listingType === 'Rent') finalStatus = 'Rented';
    else if (activeItem.listingType === 'Exchange') finalStatus = 'Exchanged';

    try {
      const docRef = doc(db, 'listings', activeItem.id);
      await updateDoc(docRef, { status: finalStatus });

      let xpAmount = 40;
      if (finalStatus === 'Sold') xpAmount = 100;
      else if (finalStatus === 'Rented') xpAmount = 80;
      gainXP(xpAmount, `Completed transaction for: ${activeItem.title}`);

      const systemMsg = `🎉 TRANSACTION STATUS UPDATE: "${activeItem.title}" has been marked as ${finalStatus} by the seller. Thank you for using ShareVIT!`;
      
      if (room.type === 'dm') {
        await addDoc(collection(db, 'direct_chats', room.id, 'messages'), {
          text: systemMsg,
          senderId: 'system',
          senderName: 'System',
          createdAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, room.col), {
          text: systemMsg,
          senderId: 'system',
          senderName: 'System',
          createdAt: serverTimestamp(),
        });
      }

      setActiveItem(prev => ({ ...prev, status: finalStatus }));
      toast.success(`Listing marked as ${finalStatus}!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status.');
    }
  };

  return (
    <div className="page-content" style={{ padding: 'var(--space-6)', height: 'calc(100vh - var(--navbar-height))', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0b0f19' }}>
      
      {/* Main Grid Wrapper */}
      <div style={{
        width: '100%',
        maxWidth: '1200px',
        display: 'flex',
        gap: '24px',
        height: '85vh',
        position: 'relative'
      }}>
        
        {/* Left Channels Sidebar */}
        <div className={`chat-sidebar ${channelsOpen ? 'open' : ''}`} style={{
          width: '260px',
          background: '#111827',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '24px',
          display: channelsOpen ? 'flex' : 'none',
          flexDirection: 'column',
          padding: '24px 16px',
          gap: '20px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          transition: 'transform 0.3s ease-in-out',
        }}>
          {/* Sidebar Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessagesSquare size={18} style={{ color: 'var(--accent-primary)' }} />
              <span>ShareVIT Server</span>
            </h3>
            <button className="navbar-hamburger" onClick={() => setChannelsOpen(false)} style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>
          
          {/* Channels List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', flex: 1, scrollbarWidth: 'none' }}>
            
            {/* Direct Messages Section */}
            {dmRooms.length > 0 && (
              <>
                <p style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', paddingLeft: '8px', marginBottom: '4px' }}>Direct Messages</p>
                {dmRooms.map(r => {
                  const isActive = room.id === r.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => {
                        setRoom(r);
                        setChannelsOpen(false);
                      }}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: 'none',
                        background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
                        color: isActive ? '#fff' : 'var(--text-secondary)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '13.5px',
                        outline: 'none',
                        fontWeight: isActive ? '600' : '400',
                        marginBottom: '4px'
                      }}
                    >
                      <UserIcon size={16} style={{ color: isActive ? 'var(--accent-primary-hover)' : 'var(--text-tertiary)' }} />
                      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.label}</span>
                        {r.data?.lastMessage && (
                          <span style={{ fontSize: '10.5px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {r.data.lastMessage}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
                <div style={{ height: '12px' }} />
              </>
            )}

            <p style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', paddingLeft: '8px', marginBottom: '4px' }}>Text Channels</p>
            {PUBLIC_ROOMS.map(r => {
              const isActive = room.id === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => {
                    setRoom(r);
                    setChannelsOpen(false);
                  }}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
                    color: isActive ? '#fff' : 'var(--text-secondary)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13.5px',
                    outline: 'none',
                    fontWeight: isActive ? '600' : '400'
                  }}
                >
                  <Hash size={16} style={{ color: isActive ? 'var(--accent-primary-hover)' : 'var(--text-tertiary)' }} />
                  <span>{r.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat Message Pane */}
        <div style={{
          flex: 1,
          background: 'rgba(15, 23, 41, 0.6)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '24px',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{ padding: '20px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => setChannelsOpen(!channelsOpen)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px', display: 'flex', marginRight: '4px' }}>
              <Menu size={20} />
            </button>
            {room.type === 'dm' ? (
              <UserIcon size={22} style={{ color: 'var(--accent-primary)' }} />
            ) : (
              <Hash size={22} style={{ color: 'var(--accent-primary)' }} />
            )}
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{room.label}</span>
                {room.type !== 'dm' && <span style={{ fontSize: '16px' }}>{room.emoji}</span>}
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>{room.desc}</p>
            </div>
          </div>

          {/* Active Item Context Banner */}
          {activeItem && (
            <div className="active-item-banner" style={{
              padding: '12px 24px',
              background: 'rgba(99, 102, 241, 0.08)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {activeItem.imageUrl ? (
                  <img 
                    src={activeItem.imageUrl} 
                    alt={activeItem.title} 
                    style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} 
                  />
                ) : (
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>📦</div>
                )}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 'bold', color: '#fff', fontSize: '14px' }}>{activeItem.title}</span>
                    <span className={`badge ${activeItem.listingType === 'Donate' ? 'badge-success' : activeItem.listingType === 'Sell' ? 'badge-warning' : 'badge-info'}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                      {activeItem.listingType}
                    </span>
                    {activeItem.status && activeItem.status !== 'active' && (
                      <span className="badge badge-secondary" style={{ fontSize: '10px', padding: '2px 6px', background: '#475569' }}>
                        {activeItem.status}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                    Seller: {activeItem.sellerName || 'Verified Student'} • Price: {activeItem.price > 0 ? `₹${activeItem.price}` : 'Free'} • Condition: {activeItem.condition}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {user && activeItem.sellerId === user.uid && (!activeItem.status || activeItem.status === 'active') && (
                  <button 
                    onClick={handleMarkCompleted}
                    style={{
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'opacity 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.opacity = '0.9'}
                    onMouseOut={e => e.currentTarget.style.opacity = '1'}
                  >
                    <CheckCircle size={14} /> Mark Completed
                  </button>
                )}
                
                <Link 
                  href={`/marketplace/${activeItem.id}`}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#f8fafc',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: '500',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <ExternalLink size={14} /> View Item
                </Link>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="chat-messages" style={{ flex: 1, padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', scrollbarWidth: 'thin' }}>
            {messages.length === 0 && (
              <div className="empty-state" style={{ padding: '32px', color: '#94a3b8', textAlign: 'center' }}>
                <p>{room.type === 'dm' ? `This is the beginning of your chat history with ${room.label}. Say hi! 👋` : `Welcome to #${room.label}! This is the start of the channel. 👋`}</p>
              </div>
            )}
            {messages.map((msg) => {
              const isUser = msg.senderId === user?.uid;
              const isSystem = msg.senderId === 'system';

              if (isSystem) {
                return (
                  <div key={msg.id} style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '10px 16px',
                    margin: '8px 0',
                    background: 'rgba(99, 102, 241, 0.08)',
                    border: '1px dashed rgba(99, 102, 241, 0.2)',
                    borderRadius: '12px',
                    color: '#a5b4fc',
                    fontSize: '13px',
                    textAlign: 'center',
                    width: '100%',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    <span>{msg.text}</span>
                  </div>
                );
              }
              
              const getAvatarColor = (name) => {
                const colors = ['#f43f5e', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];
                let hash = 0;
                if (!name) name = 'Anonymous';
                for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
                return colors[Math.abs(hash) % colors.length];
              };
              const senderName = msg.senderName || 'Anonymous';
              const avatarColor = getAvatarColor(senderName);
              const initial = senderName.charAt(0).toUpperCase();

              return (
                <div key={msg.id} style={{ display: 'flex', alignSelf: isUser ? 'flex-end' : 'flex-start', gap: '10px', maxWidth: '85%', flexDirection: isUser ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
                  {/* Avatar */}
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '15px',
                    fontWeight: 'bold',
                    color: '#fff',
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    background: isUser ? '#6366f1' : avatarColor
                  }}>
                    {initial}
                  </div>

                  {/* Message Content Wrapper */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', maxWidth: '100%' }}>
                    {!isUser && room.type !== 'dm' && (
                      <span style={{ fontSize: '12.5px', fontWeight: '500', color: '#94a3b8', marginBottom: '4px', marginLeft: '4px' }}>
                        {senderName}
                      </span>
                    )}
                    
                    {/* Bubble */}
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: '16px',
                      fontSize: '14.5px',
                      background: isUser ? '#6366f1' : '#1e293b',
                      border: isUser ? 'none' : '1px solid rgba(255,255,255,0.05)',
                      color: '#f8fafc',
                      overflowWrap: 'break-word',
                      minWidth: '80px',
                      maxWidth: '100%'
                    }}>
                      {msg.text && <p style={{ lineHeight: '1.6', margin: 0 }}>{msg.text}</p>}
                      
                      {msg.mediaUrl && (
                        <img 
                          src={msg.mediaUrl} 
                          alt="Sent attachment" 
                          loading="lazy" 
                          style={{
                            maxWidth: '100%',
                            maxHeight: '260px',
                            borderRadius: '12px',
                            marginTop: msg.text ? '8px' : '0',
                            display: 'block',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                          }}
                          onClick={() => window.open(msg.mediaUrl, '_blank')}
                        />
                      )}

                      <p style={{ 
                        fontSize: '10px', 
                        color: isUser ? 'rgba(255,255,255,0.75)' : '#94a3b8', 
                        marginTop: '6px', 
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        gap: '4px',
                        whiteSpace: 'nowrap',
                        margin: '6px 0 0 0'
                      }}>
                        {msg.createdAt?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ''}
                        {isUser && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} style={{ height: '1px' }} />
          </div>

          {/* Input Bar */}
          <div style={{ padding: '20px 32px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <form onSubmit={handleSend} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                style={{ display: 'none' }} 
              />
              <button
                type="button"
                onClick={handleAttachClick}
                disabled={uploading || sending}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '50%',
                  width: '42px',
                  height: '42px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#cbd5e1',
                  cursor: (uploading || sending) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  flexShrink: 0
                }}
                title="Send Image"
              >
                {uploading ? (
                  <div className="spinner" style={{ width: '16px', height: '16px', borderTopColor: 'var(--accent-primary)' }} />
                ) : (
                  <ImageIcon size={18} />
                )}
              </button>

              <input
                placeholder={uploading ? `Uploading image (${chatUploadProgress}%)...` : (room.type === 'dm' ? `Message ${room.label}` : `Message #${room.label}`)}
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={sending || uploading}
                style={{
                  flex: 1,
                  background: '#0b0f19',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '24px',
                  padding: '14px 20px',
                  color: '#f8fafc',
                  outline: 'none',
                  fontSize: '14.5px',
                  transition: 'all 0.3s ease'
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#6366f1';
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                }}
              />
              <button
                type="submit"
                disabled={sending || uploading || !input.trim()}
                style={{
                  background: '#6366f1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '24px',
                  padding: '0 20px',
                  height: '42px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: (sending || uploading || !input.trim()) ? 'not-allowed' : 'pointer',
                  opacity: (sending || uploading || !input.trim()) ? 0.6 : 1,
                  fontWeight: '500'
                }}
              >
                {sending ? '...' : (
                  <>
                    <span>Send</span>
                    <Send size={16} strokeWidth={2} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
