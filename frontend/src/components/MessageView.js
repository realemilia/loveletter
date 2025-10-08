import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Heart, 
  ArrowLeft, 
  Lock,
  Unlock,
  Calendar,
  User,
  Mail,
  MailOpen,
  Key,
  Eye,
  EyeOff,
  Trash2,
  Reply
} from 'lucide-react';
import { useAuth } from '../App';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { useToast } from '../hooks/use-toast';

const MessageView = () => {
  const [message, setMessage] = useState(null);
  const [secretCode, setSecretCode] = useState('');
  const [showSecretCode, setShowSecretCode] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(false);
  
  const { id } = useParams();
  const { user, token, api } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchMessage();
  }, [id]);

  const fetchMessage = async () => {
    try {
      const response = await axios.get(`${api}/messages/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const messageData = response.data;
      setMessage(messageData);
      
      // Mark as read if it's an inbox message and not already read
      if (messageData.recipient === user.username && !messageData.read_at && !messageData.secret_code) {
        markAsRead();
      }
      
      // Check if message needs to be unlocked
      if (messageData.secret_code && messageData.recipient === user.username && !messageData.read_at) {
        setIsUnlocked(false);
      } else {
        setIsUnlocked(true);
      }
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load message",
        variant: "destructive",
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      await axios.post(`${api}/messages/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleUnlock = async () => {
    if (!secretCode.trim()) {
      toast({
        title: "Missing Secret Code",
        description: "Please enter the secret code",
        variant: "destructive",
      });
      return;
    }

    setUnlocking(true);
    
    try {
      await axios.post(`${api}/messages/${id}/unlock`, {
        secret_code: secretCode.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setIsUnlocked(true);
      toast({
        title: "Message Unlocked! 💕",
        description: "Your secret message has been revealed",
      });

      // Refresh message data
      fetchMessage();
    } catch (error) {
      toast({
        title: "Wrong Secret Code",
        description: "The secret code you entered is incorrect",
        variant: "destructive",
      });
    } finally {
      setUnlocking(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${api}/messages/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast({
        title: "Message Deleted",
        description: "The message has been deleted",
      });
      
      navigate('/');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-love flex items-center justify-center">
        <div className="text-center">
          <div className="loading-hearts text-4xl mb-4">
            <span>💕</span>
            <span>💕</span>
            <span>💕</span>
          </div>
          <p className="text-rose-600 font-medium">Loading your love letter...</p>
        </div>
      </div>
    );
  }

  if (!message) {
    return null;
  }

  const isFromMe = message.sender === user.username;
  const needsUnlock = message.secret_code && !isUnlocked && message.recipient === user.username;

  return (
    <div className="min-h-screen gradient-love">
      {/* Header */}
      <header className="glass border-b border-rose-200/30 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="btn-soft"
              data-testid="back-button"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Heart className="w-8 h-8 text-rose-500 heart-pulse" fill="currentColor" />
            <h1 className="text-2xl font-bold font-romantic text-gray-800">
              Love Letter
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate(`/compose?reply=${id}`)}
              className="btn-romantic"
              data-testid="reply-button"
            >
              <Reply className="w-4 h-4 mr-2" />
              Reply
            </Button>
            
            <Button
              onClick={handleDelete}
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              data-testid="delete-button"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-6">
        <Card className="glass-strong rounded-3xl p-8 shadow-2xl">
          {/* Message Header */}
          <div className="border-b border-rose-200/30 pb-6 mb-8">
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {isFromMe ? (
                    <>
                      <Mail className="w-6 h-6 text-blue-500" />
                      <div>
                        <p className="text-lg font-semibold text-gray-700">
                          To: {message.recipient}
                        </p>
                        <p className="text-sm text-gray-500">Sent by you</p>
                      </div>
                    </>
                  ) : (
                    <>
                      {message.read_at ? (
                        <MailOpen className="w-6 h-6 text-emerald-500" />
                      ) : (
                        <Mail className="w-6 h-6 text-rose-500" />
                      )}
                      <div>
                        <p className="text-lg font-semibold text-gray-700">
                          From: {message.sender}
                        </p>
                        <p className="text-sm text-gray-500">
                          {message.read_at ? 'Read' : 'Unread'} message
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-rose-600">
                  <Calendar className="w-4 h-4" />
                  {formatDate(message.created_at)}
                </div>

                <div className="flex items-center gap-2">
                  {message.secret_code && (
                    <Badge className="status-secret text-white">
                      <Lock className="w-3 h-3 mr-1" />
                      Secret Message
                    </Badge>
                  )}
                  
                  {message.is_draft && (
                    <Badge variant="outline" className="border-amber-300 text-amber-700">
                      Draft
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Message Content */}
          {needsUnlock ? (
            <div className="text-center py-12" data-testid="secret-lock-screen">
              <div className="secret-lock max-w-md mx-auto">
                <Lock className="w-16 h-16 mx-auto mb-6 text-white" />
                <h2 className="text-2xl font-bold mb-4 text-white">
                  Secret Love Letter 💜
                </h2>
                <p className="text-purple-100 mb-8">
                  This message is protected with a secret code. 
                  Enter the code to reveal the loving words inside.
                </p>
                
                <div className="space-y-4">
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-300 w-5 h-5" />
                    <Input
                      type={showSecretCode ? "text" : "password"}
                      placeholder="Enter secret code..."
                      value={secretCode}
                      onChange={(e) => setSecretCode(e.target.value)}
                      className="pl-12 pr-12 h-12 bg-white/20 border-white/30 text-white placeholder-purple-200"
                      onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
                      data-testid="secret-code-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecretCode(!showSecretCode)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-300"
                      data-testid="toggle-secret-visibility"
                    >
                      {showSecretCode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  
                  <Button
                    onClick={handleUnlock}
                    disabled={unlocking}
                    className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30"
                    data-testid="unlock-button"
                  >
                    {unlocking ? (
                      <div className="loading-hearts">
                        <span>💜</span>
                        <span>💜</span>
                        <span>💜</span>
                      </div>
                    ) : (
                      <>
                        <Unlock className="w-5 h-5 mr-2" />
                        Unlock Message
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6" data-testid="message-content">
              {/* Unlocked indicator for secret messages */}
              {message.secret_code && isUnlocked && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-emerald-700">
                    <Unlock className="w-5 h-5" />
                    <span className="font-medium">Secret message unlocked! 💚</span>
                  </div>
                </div>
              )}

              {/* Message body */}
              <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-3xl p-8 border border-rose-100">
                <div className="prose prose-lg max-w-none">
                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed font-medium text-lg">
                    {message.content}
                  </div>
                </div>
              </div>

              {/* Message footer */}
              <div className="text-center pt-6 border-t border-rose-200/30">
                <div className="inline-flex items-center gap-2 text-rose-400 opacity-70">
                  <Heart className="w-4 h-4 heart-float" fill="currentColor" />
                  <span className="text-sm font-medium">
                    {isFromMe ? 'Sent with love' : 'Received with love'}
                  </span>
                  <Heart className="w-4 h-4 heart-float" fill="currentColor" style={{animationDelay: '1s'}} />
                </div>
              </div>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
};

export default MessageView;