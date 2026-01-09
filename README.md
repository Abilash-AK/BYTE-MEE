# BYTE-MEE (CoLearn)

A comprehensive collaborative learning platform that connects developers, learners, and creators through smart learning pods, daily coding challenges, and AI-powered collaboration tools.
WORKING LINK: https://colearn-app.abilashkumar290.workers.dev/
## 🚀 Features

### Core Features
- **Smart Learning Pods**: Create and join project pods, hackathon teams, and study groups
- **Daily Coding Challenges**: Time-limited coding sessions with automatic partner matching
- **Collaborative Workspace**: Built-in VS Code-like editor with real-time pair programming
- **Skill Verification**: Multiple verification paths including GitHub activity, practical demonstrations, and peer validation
- **Growth Portfolio**: Automatic portfolio generation tracking all your collaborations and skills
- **AI-Powered Assistant**: Integrated AI code suggestions, documentation generation, and learning recommendations
- **Communities (Skill Circles)**: Join topic-specific communities for learning, practice, and expert discussions
- **Authentication**: Google OAuth and GitHub integration for seamless signup

### Key Highlights
- ✅ Real-time collaboration tools
- ✅ AI transparency and usage logging
- ✅ Comprehensive skill tracking and verification
- ✅ Cloudflare Workers backend with D1 database

## 🛠️ Tech Stack

### Frontend
- **React 19** with TypeScript
- **React Router 7** for navigation
- **Tailwind CSS** for styling
- **Monaco Editor** for code editing
- **Lucide React** for icons
- **Vite** for build tooling

### Backend
- **Hono** framework
- **Cloudflare Workers** for serverless functions
- **Cloudflare D1** for database
- **Zod** for schema validation

### Services
- **Google OAuth** for authentication
- **GitHub API** integration
- **Firebase** for real-time features
- **AI Services** (Gemini API) for code assistance

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- Cloudflare account (for deployment)
- Google Cloud Console OAuth credentials
- GitHub account (optional, for integration)

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/Abilash-AK/BYTE-MEE.git
   cd BYTE-MEE
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.dev.vars` file in the root directory:
   ```env
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:5173/auth/callback
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   DATABASE_URL=your_database_url
   AI_API_KEY=your_ai_api_key
   ```

4. **Set up Google OAuth**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create OAuth 2.0 credentials
   - Add redirect URI: `http://localhost:5173/auth/callback`
   - Copy Client ID and Client Secret to `.dev.vars`

5. **Run database migrations**
   ```bash
   # Migrations are located in the migrations/ directory
   # Apply them using wrangler or your database tool
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

## 🏗️ Project Structure

```
BYTE-MEE/
├── src/
│   ├── react-app/          # Main React application (TypeScript)
│   │   ├── components/      # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   └── auth.tsx        # Authentication logic
│   ├── worker/              # Cloudflare Workers backend
│   ├── shared/             # Shared types and utilities
│   ├── components/         # Legacy components
│   ├── pages/              # Legacy pages
│   └── services/           # Service integrations
├── migrations/             # Database migrations
├── seeds/                  # Database seed data
├── public/                 # Static assets
├── dist/                   # Build output
└── wrangler.json          # Cloudflare Workers configuration
```

## 🚀 Deployment

### Deploy to Cloudflare Workers

1. **Login to Cloudflare**
   ```bash
   npx wrangler login
   ```

2. **Configure production environment**
   - Update `wrangler.json` with production settings
   - Set environment variables in Cloudflare dashboard

3. **Build and deploy**
   ```bash
   npm run build
   npx wrangler deploy
   ```

### Environment Variables for Production

Set these in Cloudflare Workers dashboard:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI` (production URL)
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `AI_API_KEY`

## 📚 Usage

### Getting Started

1. **Sign Up**: Use Google OAuth for one-click signup
2. **Onboarding**: Complete your profile and select your skills
3. **Explore**: Browse available pods, communities, and challenges
4. **Create**: Start your own learning pod or join existing ones
5. **Collaborate**: Use the integrated workspace for real-time coding
6. **Track**: Monitor your skill growth and portfolio

### Daily Pods

- Released daily at 9 AM
- Automatic partner matching
- 1-2 hour time-limited sessions
- Built-in code editor and collaboration tools
- Daily streak tracking

### Learning Pods

- **Hackathon Teams**: 48-hour project collaborations
- **Project Pods**: 2-6 week learning projects
- **Study Pods**: Learning-focused groups
- Filter by skills, duration, and team size

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Links

- **Repository**: [https://github.com/Abilash-AK/BYTE-MEE](https://github.com/Abilash-AK/BYTE-MEE)
- **Issues**: [https://github.com/Abilash-AK/BYTE-MEE/issues](https://github.com/Abilash-AK/BYTE-MEE/issues)

## 🙏 Acknowledgments

- Built with React, Cloudflare Workers, and modern web technologies
- Inspired by collaborative learning and peer programming communities

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Note**: This is an active development project. Some features may be in progress or experimental. Check the [FEATURES_CHECKLIST.md](./FEATURES_CHECKLIST.md) for detailed feature status.
