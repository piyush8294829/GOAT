import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  Brain, 
  Settings, 
  User, 
  Play, 
  Clock, 
  HourglassIcon, 
  Lock, 
  Flame, 
  Trophy, 
  Plus,
  Target,
  Zap
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const sessionTypes = [
  { 
    id: "pomodoro", 
    label: "Pomodoro", 
    description: "25 min session",
    icon: Clock,
    duration: 25
  },
  { 
    id: "long", 
    label: "Long Session", 
    description: "Deep work",
    icon: HourglassIcon,
    duration: 120
  },
  { 
    id: "strict", 
    label: "Strict Mode", 
    description: "Maximum focus",
    icon: Lock,
    duration: 60
  },
];

const blockedApps = [
  { name: "YouTube", icon: "🎥", color: "text-red-300" },
  { name: "Instagram", icon: "📷", color: "text-pink-300" },
  { name: "Twitter", icon: "🐦", color: "text-blue-300" },
  { name: "Reddit", icon: "📱", color: "text-orange-300" },
];

export default function Dashboard() {
  const [selectedSessionType, setSelectedSessionType] = useState<string>("");
  const [blockingEnabled, setBlockingEnabled] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's onboarding data for personalization
  const { data: onboardingData } = useQuery({
    queryKey: ["/api/onboarding"],
    retry: false,
  });

  // Fetch today's stats
  const { data: todayStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/stats/today"],
    retry: false,
  });

  // Fetch recent achievements
  const { data: achievements, isLoading: isLoadingAchievements } = useQuery({
    queryKey: ["/api/achievements"],
    retry: false,
  });

  // Fetch recent focus sessions
  const { data: recentSessions } = useQuery({
    queryKey: ["/api/focus-sessions"],
    retry: false,
  });

  const startSessionMutation = useMutation({
    mutationFn: async (sessionData: any) => {
      return apiRequest("POST", "/api/focus-sessions", sessionData);
    },
    onSuccess: () => {
      toast({
        title: "Focus Session Started",
        description: "Your focus session has begun. Stay focused!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/focus-sessions"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to start focus session. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleStartSession = () => {
    if (!selectedSessionType) {
      toast({
        title: "Select Session Type",
        description: "Please select a focus session type first.",
        variant: "destructive",
      });
      return;
    }

    const sessionType = sessionTypes.find(s => s.id === selectedSessionType);
    if (!sessionType) return;

    startSessionMutation.mutate({
      sessionType: sessionType.id,
      plannedDuration: sessionType.duration,
      startedAt: new Date(),
    });
  };

  const userName = user?.firstName || user?.email?.split('@')[0] || "User";
  const focusGoal = onboardingData?.focusGoal || "productivity";
  const streakDays = todayStats?.streakDays || 0;
  const totalSessions = todayStats?.totalSessions || 0;
  const totalFocusTime = todayStats?.totalFocusTime || 0;
  const distractionsBlocked = todayStats?.distractionsBlocked || 0;

  // Calculate daily goal progress (assuming 4 hours = 240 minutes as daily goal)
  const dailyGoalMinutes = 240;
  const progressPercentage = Math.min((totalFocusTime / dailyGoalMinutes) * 100, 100);

  const recentAchievements = achievements?.slice(0, 3) || [];

  return (
    <div className="min-h-screen dark-bg p-6">
      {/* Dashboard Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <motion.div 
              className="w-12 h-12 gradient-purple rounded-full flex items-center justify-center mr-4"
              whileHover={{ scale: 1.05 }}
            >
              <Brain className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold text-gradient">Flox AI</h1>
              <p className="text-white/60 text-sm">Your focus companion</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon"
              className="glass-morphism hover:bg-white/20 transition-all duration-300"
            >
              <Settings className="w-5 h-5 text-white" />
            </Button>
            <div className="glass-morphism p-3 rounded-full">
              <User className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-6xl mx-auto">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="glass-morphism p-8 rounded-3xl mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Welcome back, {userName}!</h2>
              <p className="text-white/60">
                Ready to achieve your {focusGoal} goals?
              </p>
            </div>
            <div className="text-center">
              <motion.div 
                className="text-3xl font-bold stats-number"
                whileHover={{ scale: 1.1 }}
              >
                {streakDays}
              </motion.div>
              <p className="text-white/60">Day Streak</p>
              <Flame className="w-6 h-6 text-orange-400 mx-auto mt-2 animate-pulse" />
            </div>
            <div className="text-center">
              <motion.div 
                className="text-3xl font-bold stats-number"
                whileHover={{ scale: 1.1 }}
              >
                {recentAchievements.length}
              </motion.div>
              <p className="text-white/60">Achievements</p>
              <Trophy className="w-6 h-6 text-yellow-400 mx-auto mt-2" />
            </div>
          </div>
        </motion.div>

        {/* Quick Session Start */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="glass-morphism p-8 rounded-3xl mb-8"
        >
          <h3 className="text-xl font-bold mb-6 text-center">Start Focus Session</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {sessionTypes.map((sessionType, index) => {
              const Icon = sessionType.icon;
              const isSelected = selectedSessionType === sessionType.id;

              return (
                <motion.button
                  key={sessionType.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                  onClick={() => setSelectedSessionType(sessionType.id)}
                  className={`glass-morphism p-6 rounded-2xl text-center transition-all duration-300 transform hover:scale-105 group ${
                    isSelected 
                      ? "bg-purple-500/30 ring-2 ring-purple-400 scale-105" 
                      : "hover:bg-white/20"
                  }`}
                >
                  <Icon 
                    className={`w-8 h-8 mx-auto mb-3 transition-colors duration-300 ${
                      sessionType.id === 'strict' ? 'animate-pulse' : ''
                    } ${
                      isSelected 
                        ? "text-purple-300" 
                        : "text-purple-400 group-hover:text-purple-300"
                    }`} 
                  />
                  <h4 className="font-semibold">{sessionType.label}</h4>
                  <p className="text-white/60 text-sm">{sessionType.description}</p>
                </motion.button>
              );
            })}
          </div>
          <div className="text-center">
            <Button
              onClick={handleStartSession}
              disabled={!selectedSessionType || startSessionMutation.isPending}
              className="button-primary text-white px-12 py-4 rounded-full text-xl font-semibold floating-animation group"
            >
              {startSessionMutation.isPending ? (
                <>
                  <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full mr-3" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="w-6 h-6 mr-3" />
                  Start Session
                </>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Stats and Progress */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Today's Stats */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="glass-morphism p-6 rounded-3xl"
          >
            <h3 className="text-xl font-bold mb-4">Today's Progress</h3>
            {isLoadingStats ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-6 bg-white/10 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white/80">Focus Time</span>
                  <span className="font-bold stats-number">
                    {Math.floor(totalFocusTime / 60)}h {totalFocusTime % 60}m
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/80">Sessions</span>
                  <span className="font-bold stats-number">{totalSessions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/80">Distractions Blocked</span>
                  <span className="font-bold stats-number">{distractionsBlocked}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <motion.div
                    className="progress-bar h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
                <p className="text-white/60 text-sm text-center">
                  {Math.round(progressPercentage)}% of daily goal achieved
                </p>
              </div>
            )}
          </motion.div>

          {/* Achievements */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="glass-morphism p-6 rounded-3xl"
          >
            <h3 className="text-xl font-bold mb-4">Recent Achievements</h3>
            {isLoadingAchievements ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center p-3 bg-white/10 rounded-xl animate-pulse">
                    <div className="w-8 h-8 bg-white/20 rounded mr-3" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-white/20 rounded w-3/4" />
                      <div className="h-3 bg-white/20 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentAchievements.length === 0 ? (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-white/40 mx-auto mb-4" />
                <p className="text-white/60">No achievements yet</p>
                <p className="text-white/40 text-sm">Complete focus sessions to unlock achievements</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentAchievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="flex items-center p-3 bg-white/10 rounded-xl hover:bg-white/15 transition-all duration-300"
                  >
                    <div className="w-8 h-8 gradient-purple rounded-full flex items-center justify-center mr-3">
                      {achievement.achievementType === 'streak' && <Flame className="w-4 h-4 text-white" />}
                      {achievement.achievementType === 'session_count' && <Clock className="w-4 h-4 text-white" />}
                      {achievement.achievementType === 'focus_time' && <Zap className="w-4 h-4 text-white" />}
                    </div>
                    <div>
                      <h4 className="font-semibold">{achievement.achievementName}</h4>
                      <p className="text-white/60 text-sm">{achievement.description}</p>
                    </div>
                  </motion.div>
                ))}
                
                {/* Placeholder for next achievement */}
                <div className="flex items-center p-3 bg-white/5 rounded-xl opacity-50">
                  <Trophy className="w-8 h-8 text-yellow-400 mr-3" />
                  <div>
                    <h4 className="font-semibold">Zen Master</h4>
                    <p className="text-white/60 text-sm">Complete 10 strict sessions</p>
                    <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                      <div 
                        className="h-2 bg-yellow-400 rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min((totalSessions / 10) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* App Blocker Controls */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="glass-morphism p-6 rounded-3xl"
        >
          <h3 className="text-xl font-bold mb-4">Distraction Blocker</h3>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="font-semibold">Block Distractions</h4>
              <p className="text-white/60 text-sm">
                Currently blocking {blockedApps.length} apps and websites
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`text-sm ${blockingEnabled ? 'text-green-400' : 'text-white/60'}`}>
                {blockingEnabled ? 'Enabled' : 'Disabled'}
              </span>
              <Switch
                checked={blockingEnabled}
                onCheckedChange={setBlockingEnabled}
                className="data-[state=checked]:bg-purple-600"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {blockedApps.map((app, index) => (
              <motion.span
                key={app.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`px-3 py-1 bg-red-500/20 ${app.color} rounded-full text-sm flex items-center`}
              >
                <span className="mr-2">{app.icon}</span>
                {app.name}
              </motion.span>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm hover:bg-purple-500/30 transition-all duration-300"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add More
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
