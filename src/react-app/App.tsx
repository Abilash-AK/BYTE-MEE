import { BrowserRouter as Router, Routes, Route } from "react-router";
import { AuthProvider } from "@/react-app/auth";
import HomePage from "@/react-app/pages/Home";
import AuthCallbackPage from "@/react-app/pages/AuthCallback";
import DashboardPage from "@/react-app/pages/Dashboard";
import MyPodsPage from "@/react-app/pages/MyPods";
import BrowsePodsPage from "@/react-app/pages/BrowsePods";
import CreatePodPage from "@/react-app/pages/CreatePod";
import PodDetailPage from "@/react-app/pages/PodDetail";
import CommunitiesPage from "@/react-app/pages/Communities";
import MyCommunitiesPage from "@/react-app/pages/MyCommunities";
import CommunityDetailPage from "@/react-app/pages/CommunityDetail";
import OnboardingPage from "@/react-app/pages/Onboarding";
import ProfilePage from "@/react-app/pages/Profile";
import CodingChallengesPage from "@/react-app/pages/CodingChallenges";
import DirectMessagesPage from "@/react-app/pages/DirectMessages";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile/:userId" element={<ProfilePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/challenges" element={<CodingChallengesPage />} />
          <Route path="/pods/my" element={<MyPodsPage />} />
          <Route path="/pods/browse" element={<BrowsePodsPage />} />
          <Route path="/pods/create" element={<CreatePodPage />} />
          <Route path="/pods/:id" element={<PodDetailPage />} />
          <Route path="/communities" element={<CommunitiesPage />} />
          <Route path="/communities/my" element={<MyCommunitiesPage />} />
          <Route path="/communities/:id" element={<CommunityDetailPage />} />
          <Route path="/messages/:userId?" element={<DirectMessagesPage />} />
          <Route path="/messages" element={<DirectMessagesPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
