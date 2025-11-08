I’m building a full-stack AI-powered game development platform using the following stack:

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS v4, shadcn/ui
- **Database:** Supabase
- **Auth & Deployment:** GitHub OAuth (login + repo push) + GitHub Pages
- **State:** Minimal — use server actions and component state.

---

🧩 SYSTEM PURPOSE

Users will create games by entering structured prompts across 3 categories:

1. **Gameplay mechanics**
2. **Visual style**
3. **Sound effects/music**

These prompts are versioned as **commits**, and users can fork, explore history, and continue from previous states.

Games are exported and deployed to GitHub Pages using the user's GitHub account and our game template.

---

🔐 AUTH

- User logs in using GitHub OAuth.
- We request access to:
  - Their profile
  - Public repo write access (to create & push game projects)
  - Actions/workflows (for GitHub Pages deployment)
- Store minimal data: GitHub ID, email, and access token (or token-less if using GitHub Pages redirect pattern).

---

---

📦 PROJECT CREATION & DEVELOPMENT FLOW

2. After login and API key setup, the user creates a **new game project** by entering a name.
   - This initializes a `GameProject` document in the database.
   - Also creates an empty GitHub repo using the user’s token (public by default).
   - The repo will be used to commit and deploy the game to GitHub Pages.

3. The user walks through a **4-step prompt wizard**, one screen at a time:

   🔹 Step 1 — Game Story / World / Theme
   - Prompt input (markdown-friendly)
   - Textarea labeled: _“Describe your game’s setting, characters, and mood.”_
   - Result saved as part of the GameProject (`corePrompt`) and also passed to AI as `system prompt`.

   🔹 Step 2 — Gameplay Mechanics
   - Prompt: _“Describe how your game plays. What are the main actions?”_
   - First `PromptCommit` is created with `type: "gameplay"`

   🔹 Step 3 — Visual Style
   - Prompt: _“Describe your game’s aesthetic. Any references or styles?”_
   - Upload field or image URL input (optional)
   - Creates `PromptCommit` with `type: "visual"`

   🔹 Step 4 — Sound Style
   - Prompt: _“What kind of music, effects, or voice should the game have?”_
   - Creates `PromptCommit` with `type: "sound"`

   Each prompt is sent to the AI (Claude or GPT) and a response is stored in `aiResponse`.

4. After the wizard is completed, the user is redirected to the **Development Page** — the core environment for working on their game.

---

🧱 DEVELOPMENT PAGE UI LAYOUT

This is a 3-panel, **resizable workspace**, like a mini IDE:

🔹 Left Panel: **AI Chat Interface**

- Vertical sidebar with:
  - Conversation history
  - New prompt input (user continues asking questions or giving changes)
  - Prompts are associated with gameplay, visual, or sound context
- System ensures context is preserved per layer and added to history as new PromptCommits

🔹 Right Panel: **Game Preview + File Tree**

- Tabs or split view:
  - Game Preview: Embedded iframe or canvas for live play test
  - File Explorer: Virtual file system or simplified list of game assets (sprites, logic, etc.)
  - Each preview is generated from the latest commits and deployed files

🔹 Bottom Panel: **Log Console**

- Shows:
  - GitHub commit actions (e.g., "Deployed to GitHub Pages")
  - AI response logs
  - Game engine feedback/errors
- Optional toggles: `AI logs`, `Git logs`, `System logs`

💡 All panels are resizable using drag handles (CSS grid with resizing, or a library like `react-resizable-panels`)

---

🛠️ User can now:

- Add new prompts (layer-specific or general)
- View game output live
- Inspect AI-generated changes
- Manually edit files in future versions (optional)
- Export builds or force redeploy to GitHub Pages

---

📁 Summary of Views

- `/onboarding` → API key + create project
- `/project/[id]/wizard` → 4-step setup flow
- `/project/[id]/dev` → Development workspace with AI chat + preview + logs

---

Let me extend this later with AI prompt streaming, prompt rollback, commit forking, and team collaboration.

---

📚 DATA STRUCTURE

```ts
type User = {
  _id: string;
  githubId: string;
  email: string;
  name: string;
  avatarUrl: string;
};

type GameProject = {
  _id: string;
  userId: string;
  title: string;
  createdAt: Date;
  currentGameplayCommitId?: string;
  currentVisualCommitId?: string;
  currentSoundCommitId?: string;
};

type PromptCommit = {
  _id: string;
  projectId: string;
  type: "gameplay" | "visual" | "sound";
  parentId?: string | null;
  prompt: string;
  aiResponse?: string;
  createdAt: Date;
};


PROJECT STRUCTURE

/app
  /dashboard
  /project/[id]
  /auth/callback
  /onboarding

/components
  prompt-form.tsx
  project-card.tsx
  commit-timeline.tsx

/lib
  github.ts
  mongodb.ts
  auth.ts
  ai.ts

/models
  user.ts
  project.ts
  commit.ts
```
