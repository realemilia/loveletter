import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Heart, 
  PenTool, 
  Inbox, 
  Send, 
  FileText, 
  LogOut, 
  Mail,
  MailOpen,
  Lock,
  Trash2,
  Eye
} from 'lucide-react';
import { useAuth } from '../App';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useToast } from '../hooks/use-toast';

const Dashboard = () => {
  const [messages, setMessages] = useState({
    inbox: [],
    sent: [],
    drafts: []
  });
  const [loading, setLoading] = useState(true);
  const { user, logout, token, api } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchMessages = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      const [inboxRes, sentRes, draftsRes] = await Promise.all([
        axios.get(`${api}/messages/inbox`, { headers }),
        axios.get(`${api}/messages/sent`, { headers }),
        axios.get(`${api}/messages/drafts`, { headers })
      ]);

      setMessages({
        inbox: inboxRes.data,
        sent: sentRes.data,
        drafts: draftsRes.data
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleDeleteMessage = async (messageId) => {
    try {
      await axios.delete(`${api}/messages/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast({
        title: "Success",
        description: "Message deleted successfully",
      });
      
      fetchMessages();
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
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  const MessageCard = ({ message, type }) => (
    <Card 
      className="card-romantic p-4 mb-3 cursor-pointer message-slide-in"
      onClick={() => navigate(`/message/${message.id}`)}
      data-testid={`message-card-${message.id}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {type === 'inbox' && (
              <>
                {message.read_at ? (
                  <MailOpen className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Mail className="w-5 h-5 text-rose-500" />
                )}
                <span className="font-semibold text-gray-700">
                  From: {message.sender}
                </span>
              </>
            )}
            {type === 'sent' && (
              <>
                <Send className="w-5 h-5 text-blue-500" />
                <span className="font-semibold text-gray-700">
                  To: {message.recipient}
                </span>
              </>
            )}
            {type === 'drafts' && (
              <>
                <FileText className="w-5 h-5 text-amber-500" />
                <span className="font-semibold text-gray-700">
                  Draft to: {message.recipient}
                </span>
              </>
            )}
            
            {message.secret_code && (
              <Badge className="status-secret text-white">
                <Lock className="w-3 h-3 mr-1" />
                Secret
              </Badge>
            )}
          </div>
          
          <p className="text-gray-600 text-sm truncate mb-2">
            {message.content.substring(0, 100)}
            {message.content.length > 100 && '...'}
          </p>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-rose-500 font-medium">
              {formatDate(message.created_at)}
            </span>
            
            {!message.read_at && type === 'inbox' && (
              <Badge className="status-unread text-white text-xs">
                New
              </Badge>
            )}
          </div>
        </div>
        
        <div className="ml-4 flex flex-col gap-2">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/message/${message.id}`);
            }}
            variant="outline"
            size="sm"
            className="btn-soft"
            data-testid={`view-message-${message.id}`}
          >
            <Eye className="w-4 h-4" />
          </Button>
          
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteMessage(message.id);
            }}
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            data-testid={`delete-message-${message.id}`}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen gradient-love flex items-center justify-center">
        <div className="text-center">
          <div className="loading-hearts text-4xl mb-4">
            <span>💕</span>
            <span>💕</span>
            <span>💕</span>
          </div>
          <p className="text-rose-600 font-medium">Loading your love letters...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-love">
      {/* Header */}
      <header className="glass border-b border-rose-200/30 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Heart className="w-8 h-8 text-rose-500 heart-pulse" fill="currentColor" />
            <div>
              <h1 className="text-2xl font-bold font-romantic text-gray-800">
                LoveLetters
              </h1>
              <p className="text-sm text-rose-600">Welcome back, {user.username} 💕</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate('/compose')}
              className="btn-romantic"
              data-testid="compose-button"
            >
              <PenTool className="w-4 h-4 mr-2" />
              Write Letter
            </Button>
            
            <Button
              onClick={logout}
              variant="outline"
              className="btn-soft"
              data-testid="logout-button"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6">
        <Tabs defaultValue="inbox" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 glass-strong rounded-2xl p-1">
            <TabsTrigger 
              value="inbox" 
              className="rounded-xl data-[state=active]:nav-active"
              data-testid="inbox-tab"
            >
              <Inbox className="w-4 h-4 mr-2" />
              Inbox ({messages.inbox.length})
            </TabsTrigger>
            <TabsTrigger 
              value="sent" 
              className="rounded-xl data-[state=active]:nav-active"
              data-testid="sent-tab"
            >
              <Send className="w-4 h-4 mr-2" />
              Sent ({messages.sent.length})
            </TabsTrigger>
            <TabsTrigger 
              value="drafts" 
              className="rounded-xl data-[state=active]:nav-active"
              data-testid="drafts-tab"
            >
              <FileText className="w-4 h-4 mr-2" />
              Drafts ({messages.drafts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inbox" data-testid="inbox-content">
            <div className="space-y-4">
              {messages.inbox.length === 0 ? (
                <Card className="card-romantic p-8 text-center">
                  <Mail className="w-16 h-16 text-rose-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    No love letters yet
                  </h3>
                  <p className="text-gray-500">
                    Waiting for someone special to send you a message 💕
                  </p>
                </Card>
              ) : (
                messages.inbox.map((message) => (
                  <MessageCard 
                    key={message.id} 
                    message={message} 
                    type="inbox" 
                  />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="sent" data-testid="sent-content">
            <div className="space-y-4">
              {messages.sent.length === 0 ? (
                <Card className="card-romantic p-8 text-center">
                  <Send className="w-16 h-16 text-blue-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    No sent messages
                  </h3>
                  <p className="text-gray-500">
                    Start writing beautiful love letters to share your heart
                  </p>
                </Card>
              ) : (
                messages.sent.map((message) => (
                  <MessageCard 
                    key={message.id} 
                    message={message} 
                    type="sent" 
                  />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="drafts" data-testid="drafts-content">
            <div className="space-y-4">
              {messages.drafts.length === 0 ? (
                <Card className="card-romantic p-8 text-center">
                  <FileText className="w-16 h-16 text-amber-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    No drafts saved
                  </h3>
                  <p className="text-gray-500">
                    Your draft love letters will appear here
                  </p>
                </Card>
              ) : (
                messages.drafts.map((message) => (
                  <MessageCard 
                    key={message.id} 
                    message={message} 
                    type="drafts" 
                  />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;