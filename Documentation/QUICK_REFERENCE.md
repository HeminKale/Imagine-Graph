# Quick Reference: Local vs Supabase Migration

## What's Currently Local (localStorage)

### Authentication System
- **File:** `contexts/AuthContext.tsx`
- **Storage:** Browser `localStorage`
- **Keys Used:**
  - `forensic_user` - Current logged-in user
  - `forensic_users` - All registered users array
- **Security:** ⚠️ Passwords stored in plain text (NOT PRODUCTION READY)

---

## What's Using Gemini 3 Pro API

### AI Services
- **File:** `services/geminiService.ts`
- **Functions:**
  - `processEvidenceFiles()` - Analyzes evidence files
  - `createEvidenceChat()` - Creates AI chat session
- **Model:** `gemini-3-pro-preview`
- **Environment Variable:** `GEMINI_API_KEY`

---

## Alternative APIs to Gemini 3

| API | Best For | Cost | Setup Difficulty |
|-----|----------|------|------------------|
| **OpenAI GPT-4** | Text analysis | $$$ | Easy |
| **Claude 3 (Anthropic)** | Deep reasoning | $$ | Easy |
| **GPT-4 Vision** | Image + text | $$$ | Easy |
| **Azure OpenAI** | Enterprise | $$$ | Medium |
| **Hugging Face** | Custom models | $ | Hard |

---

## Quick Migration Steps

### 1. Install Supabase
```bash
npm install @supabase/supabase-js
```

### 2. Create `lib/supabase.ts`
```typescript
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

### 3. Replace `contexts/AuthContext.tsx`
- Copy Supabase version from `Documentation/LocalVsSupabase.md`
- Remove all `localStorage` code
- Use `supabase.auth` methods instead

### 4. Set Environment Variables
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Create Database Schema
- Run SQL from `Documentation/LocalVsSupabase.md` Step 6
- Creates `profiles` table
- Sets up Row Level Security

### 6. Update Dashboard
- Change `user` to `profile` for username display
- Update user menu to use `profile?.username`

---

## Files to Modify

1. ✅ `contexts/AuthContext.tsx` - Replace entire file
2. ✅ `lib/supabase.ts` - Create new file
3. ✅ `pages/Dashboard.tsx` - Update user display
4. ✅ `.env.local` - Add Supabase credentials
5. ✅ `package.json` - Add `@supabase/supabase-js`

---

## Testing After Migration

1. Sign up new user → Should create in Supabase
2. Sign in → Should authenticate via Supabase
3. Check Supabase dashboard → User should appear
4. Sign out → Should clear Supabase session
5. Refresh page → Should maintain session

---

## Keep or Replace Gemini?

### Keep Gemini If:
- ✅ You have API key
- ✅ Happy with performance
- ✅ Need image analysis

### Switch to OpenAI If:
- ✅ Need better text analysis
- ✅ Want more model options
- ✅ Need enterprise support

### Switch to Claude If:
- ✅ Need better reasoning
- ✅ Want competitive pricing
- ✅ Need long context windows

---

## Need Help?

See full documentation: `Documentation/LocalVsSupabase.md`
