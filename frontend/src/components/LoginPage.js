import React, { useState } from 'react';
import { Heart, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../App';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { useToast } from '../hooks/use-toast';

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const result = isLogin 
      ? await login(username, password)
      : await register(username, password);

    if (!result.success) {
      toast({
        title: isLogin ? "Login Failed" : "Registration Failed",
        description: result.message,
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen gradient-love flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating rose petals */}
      <div className="rose-petals">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="petal" />
        ))}
      </div>
      
      {/* Main login card */}
      <Card className="w-full max-w-md glass-strong rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Heart 
                className="w-16 h-16 text-rose-500 heart-pulse" 
                fill="currentColor" 
                data-testid="logo-heart"
              />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full flex items-center justify-center">
                <Lock className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold font-romantic text-gray-800 mb-2" data-testid="app-title">
            LoveLetters
          </h1>
          <p className="text-rose-600 font-medium">
            Private messages for your heart
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-rose-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-romantic pl-12 h-12 rounded-2xl border-0 text-gray-700 placeholder-rose-300"
                data-testid="username-input"
              />
            </div>
            
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-rose-400 w-5 h-5" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-romantic pl-12 pr-12 h-12 rounded-2xl border-0 text-gray-700 placeholder-rose-300"
                data-testid="password-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-rose-400"
                data-testid="toggle-password"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 btn-romantic rounded-2xl text-white font-semibold text-lg shadow-lg"
            data-testid="submit-button"
          >
            {loading ? (
              <div className="loading-hearts">
                <span>💕</span>
                <span>💕</span>
                <span>💕</span>
              </div>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-rose-600 hover:text-rose-700 font-medium transition-colors"
              data-testid="toggle-auth-mode"
            >
              {isLogin 
                ? "Don't have an account? Sign up" 
                : "Already have an account? Sign in"
              }
            </button>
          </div>
        </form>

        {/* Decorative hearts */}
        <div className="absolute -top-4 -left-4 text-rose-300 opacity-60">
          <Heart className="w-8 h-8 heart-float" fill="currentColor" />
        </div>
        <div className="absolute -bottom-4 -right-4 text-pink-300 opacity-60">
          <Heart className="w-6 h-6 heart-float" fill="currentColor" style={{animationDelay: '1s'}} />
        </div>
        <div className="absolute top-1/2 -right-6 text-rose-200 opacity-40">
          <Heart className="w-4 h-4 heart-float" fill="currentColor" style={{animationDelay: '2s'}} />
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;