# Local Implementation vs Supabase & API Migration Guide

## Current Local Implementations

### 1. **Authentication (localStorage)**
**Location:** `contexts/AuthContext.tsx`

**What's Local:**
- User signup/signin stored in `localStorage`
- User data stored in browser's `localStorage` (keys: `forensic_user`, `forensic_users`)
- Passwords stored in plain text (NOT SECURE - for demo only)
- No backend authentication
- No email verification
- No password reset functionality

**Current Implementation:**
```typescript
// Stores users in localStorage
localStorage.setItem('forensic_users', JSON.stringify(users));
localStorage.setItem('forensic_user', JSON.stringify(newUser));
```

---

### 2. **Gemini 3 Pro API**
**Location:** `services/geminiService.ts`

**What's Using Gemini API:**
- Evidence file processing (`processEvidenceFiles`)
- Knowledge graph generation
- Chat interface (`createEvidenceChat`)
- AI-powered analysis

**Current Implementation:**
```typescript
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
// Uses model: 'gemini-3-pro-preview'
```

**Environment Variable Needed:**
- `GEMINI_API_KEY` in `.env.local`

---

## Alternative APIs to Gemini 3

### Option 1: **OpenAI GPT-4**
- **Pros:** Mature API, excellent for text analysis, good documentation
- **Cons:** More expensive, no native image analysis in some models
- **Best for:** Text-based evidence analysis

### Option 2: **Anthropic Claude (Claude 3 Opus/Sonnet)**
- **Pros:** Excellent reasoning, good for complex analysis, competitive pricing
- **Cons:** Slightly less capable with images than Gemini
- **Best for:** Deep forensic analysis and reasoning

### Option 3: **OpenAI GPT-4 Vision**
- **Pros:** Excellent vision capabilities, good text analysis
- **Cons:** More expensive, separate API calls for vision
- **Best for:** Multi-modal evidence (images + text)

### Option 4: **Azure OpenAI (GPT-4)**
- **Pros:** Enterprise-ready, good compliance options
- **Cons:** More complex setup, requires Azure account
- **Best for:** Enterprise deployments

### Option 5: **Hugging Face Inference API**
- **Pros:** Open source models, flexible, cost-effective
- **Cons:** Requires more setup, less polished API
- **Best for:** Custom models and cost optimization

---

## Migration Steps: LocalStorage → Supabase

### Step 1: Install Supabase Dependencies

```bash
cd /Users/hemin.kale/Downloads/solaris-forensic-dashboard
npm install @supabase/supabase-js
```

### Step 2: Create Supabase Configuration File

Create `lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
```

### Step 3: Create Database Types (Optional but Recommended)

Create `lib/database.types.ts`:

```typescript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          avatar_url?: string | null
          updated_at?: string
        }
      }
    }
  }
}
```

### Step 4: Update AuthContext.tsx

Replace the entire `contexts/AuthContext.tsx` with Supabase implementation:

```typescript
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    try {
      const redirectUrl = `${window.location.origin}${window.location.pathname}#/login`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            username,
          },
        },
      });

      if (error) return { error };

      // Create profile if user was created
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            username,
          });

        if (profileError) {
          console.error('Error creating profile:', profileError);
        }
      }

      return { error: null };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...updates } : null);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### Step 5: Update Dashboard.tsx to Use Profile

Update the user display in `pages/Dashboard.tsx`:

```typescript
// Change from:
const { user, signOut } = useAuth();
// To:
const { user, profile, signOut } = useAuth();

// Update username display:
<span className="text-sm font-medium hidden md:inline">{profile?.username || user?.email}</span>
```

### Step 6: Create Supabase Database Schema

Run this SQL in your Supabase SQL Editor:

```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Create policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Step 7: Update Environment Variables

Create/update `.env.local`:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Gemini API (keep if still using)
GEMINI_API_KEY=your_gemini_api_key_here
```

### Step 8: Update vite.config.ts

Ensure environment variables are loaded:

```typescript
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
  };
});
```

### Step 9: Clean Up localStorage (Optional)

Add a migration script to clear old localStorage data:

```typescript
// In AuthContext.tsx, add on mount:
useEffect(() => {
  // Clear old localStorage data
  localStorage.removeItem('forensic_user');
  localStorage.removeItem('forensic_users');
}, []);
```

---

## Summary of Changes

### Before (Local):
- ✅ Authentication: localStorage
- ✅ User data: Browser storage
- ✅ Passwords: Plain text (insecure)
- ✅ AI: Gemini 3 Pro API

### After (Supabase):
- ✅ Authentication: Supabase Auth
- ✅ User data: PostgreSQL database
- ✅ Passwords: Hashed & secure
- ✅ Email verification: Built-in
- ✅ AI: Gemini 3 Pro API (or alternative)

---

## Testing Checklist

- [ ] Install Supabase dependencies
- [ ] Create Supabase project
- [ ] Set up database schema
- [ ] Configure environment variables
- [ ] Test user signup
- [ ] Test user signin
- [ ] Test email verification
- [ ] Test profile creation
- [ ] Test sign out
- [ ] Verify old localStorage data is cleared

---

## Notes

- **localStorage** is only used for authentication (demo purposes)
- **Gemini API** is used for AI features (evidence processing, chat)
- You can keep Gemini or switch to alternative APIs
- Supabase provides secure, scalable authentication
- Database can be extended for storing cases, evidence, etc.
