import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { 
  Heart, 
  Send, 
  Save, 
  ArrowLeft, 
  Lock,
  User,
  MessageCircle,
  Key,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../App';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { useToast } from '../hooks/use-toast';

const ComposePage = () => {
  const [recipient, setRecipient] = useState('');
  const [content, setContent] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [hasSecretCode, setHasSecretCode] = useState(false);
  const [showSecretCode, setShowSecretCode] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  
  const { user, token, api } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
    
    // Check if editing a draft
    const draftId = searchParams.get('draft');
    if (draftId) {
      fetchDraft(draftId);
    }
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${api}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchDraft = async (draftId) => {
    try {
      const response = await axios.get(`${api}/messages/${draftId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const draft = response.data;
      setRecipient(draft.recipient);
      setContent(draft.content);
      if (draft.secret_code) {
        setSecretCode(draft.secret_code);
        setHasSecretCode(true);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load draft",
        variant: "destructive",
      });
    }
  };

  const handleSend = async () => {
    if (!recipient || !content.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a recipient and write a message",
        variant: "destructive",
      });
      return;
    }

    if (hasSecretCode && !secretCode.trim()) {
      toast({
        title: "Missing Secret Code",
        description: "Please enter a secret code or disable the secret message feature",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      await axios.post(`${api}/messages`, {
        recipient,
        content: content.trim(),
        secret_code: hasSecretCode ? secretCode.trim() : null,
        is_draft: false
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast({
        title: "Love Letter Sent! 💕",
        description: `Your message has been sent to ${recipient}`,
      });

      navigate('/');
    } catch (error) {
      toast({
        title: "Failed to Send",
        description: error.response?.data?.detail || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!recipient || !content.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a recipient and write a message",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      await axios.post(`${api}/messages`, {
        recipient,
        content: content.trim(),
        secret_code: hasSecretCode ? secretCode.trim() : null,
        is_draft: true
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast({
        title: "Draft Saved 📝",
        description: "Your love letter has been saved as a draft",
      });

      navigate('/');
    } catch (error) {
      toast({
        title: "Failed to Save Draft",
        description: error.response?.data?.detail || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
              Write a Love Letter
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-6">
        <Card className="glass-strong rounded-3xl p-8 shadow-2xl">
          <div className="space-y-8">
            {/* Recipient Selection */}
            <div className="space-y-3">
              <Label htmlFor="recipient" className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <User className="w-5 h-5 text-rose-500" />
                Send to:
              </Label>
              <select
                id="recipient"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full input-romantic h-12 rounded-2xl border-0 text-gray-700"
                data-testid="recipient-select"
              >
                <option value="">Choose your special someone...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.username}>
                    {u.username}
                  </option>
                ))}
              </select>
            </div>

            {/* Secret Code Toggle */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Switch
                  id="secret-mode"
                  checked={hasSecretCode}
                  onCheckedChange={setHasSecretCode}
                  data-testid="secret-toggle"
                />
                <Label htmlFor="secret-mode" className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-purple-500" />
                  Secret Message
                </Label>
              </div>
              
              {hasSecretCode && (
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5" />
                  <Input
                    type={showSecretCode ? "text" : "password"}
                    placeholder="Enter secret code..."
                    value={secretCode}
                    onChange={(e) => setSecretCode(e.target.value)}
                    className="input-romantic pl-12 pr-12 h-12 rounded-2xl border-0"
                    data-testid="secret-code-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecretCode(!showSecretCode)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-400"
                    data-testid="toggle-secret-visibility"
                  >
                    {showSecretCode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              )}
              
              {hasSecretCode && (
                <p className="text-sm text-purple-600 bg-purple-50 p-3 rounded-xl">
                  💜 Your recipient will need to enter this secret code to read your message
                </p>
              )}
            </div>

            {/* Message Content */}
            <div className="space-y-3">
              <Label htmlFor="content" className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-rose-500" />
                Your Message:
              </Label>
              <Textarea
                id="content"
                placeholder="Write your heart out... 💕"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={12}
                className="input-romantic rounded-2xl border-0 text-gray-700 resize-none"
                data-testid="message-content"
              />
              <div className="text-right text-sm text-gray-500">
                {content.length} characters
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-end pt-4 border-t border-rose-200/30">
              <Button
                onClick={handleSaveDraft}
                disabled={loading}
                variant="outline"
                className="btn-soft px-8 py-3 rounded-2xl"
                data-testid="save-draft-button"
              >
                <Save className="w-5 h-5 mr-2" />
                Save Draft
              </Button>
              
              <Button
                onClick={handleSend}
                disabled={loading}
                className="btn-romantic px-8 py-3 rounded-2xl text-lg"
                data-testid="send-message-button"
              >
                {loading ? (
                  <div className="loading-hearts">
                    <span>💕</span>
                    <span>💕</span>
                    <span>💕</span>
                  </div>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Send Love Letter
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Decorative Elements */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 text-rose-400 opacity-70">
            <Heart className="w-4 h-4 heart-float" fill="currentColor" />
            <span className="text-sm font-medium">Made with love for your special moments</span>
            <Heart className="w-4 h-4 heart-float" fill="currentColor" style={{animationDelay: '1s'}} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default ComposePage;