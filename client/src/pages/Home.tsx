import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { ArrowRight, Heart, Trophy, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [activeSubscribers, setActiveSubscribers] = useState(0);

  useEffect(() => {
    // Fetch active subscriber count
    // This would be called via tRPC in the actual implementation
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            GolfGive
          </div>
          <div className="flex gap-4">
            {isAuthenticated ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setLocation("/dashboard")}
                  className="border-slate-700 hover:bg-slate-800"
                >
                  Dashboard
                </Button>
                {user?.role === "admin" && (
                  <Button
                    variant="outline"
                    onClick={() => setLocation("/admin")}
                    className="border-slate-700 hover:bg-slate-800"
                  >
                    Admin
                  </Button>
                )}
              </>
            ) : (
              <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                <a href={getLoginUrl()}>Sign In</a>
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                Golf for{" "}
                <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  Good
                </span>
              </h1>
              <p className="text-xl text-slate-300 leading-relaxed">
                Track your golf scores, compete in monthly draws, and support charities you care about. Every swing counts.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              {!isAuthenticated ? (
                <>
                  <Button
                    asChild
                    size="lg"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <a href={getLoginUrl()} className="flex items-center gap-2">
                      Start Playing <ArrowRight className="w-4 h-4" />
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-slate-700 hover:bg-slate-800"
                  >
                    Learn More
                  </Button>
                </>
              ) : (
                <Button
                  size="lg"
                  onClick={() => setLocation("/dashboard")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Go to Dashboard
                </Button>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-6 pt-8">
              <div className="space-y-2">
                <div className="text-3xl font-bold text-emerald-400">
                  {activeSubscribers}+
                </div>
                <div className="text-sm text-slate-400">Active Players</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-cyan-400">Monthly</div>
                <div className="text-sm text-slate-400">Prize Draws</div>
              </div>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="relative h-96 md:h-full min-h-96">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-3xl blur-3xl" />
            <div className="relative bg-slate-800/50 backdrop-blur-sm rounded-3xl border border-slate-700 p-8 h-full flex flex-col justify-center items-center space-y-6">
              <Trophy className="w-24 h-24 text-emerald-400" />
              <div className="text-center space-y-2">
                <div className="text-sm text-slate-400">This Month's Prize Pool</div>
                <div className="text-4xl font-bold text-emerald-400">$5,000</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/50 border-t border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-slate-400 text-lg">
              Simple, transparent, and designed for golfers who care
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-8 hover:border-emerald-500/50 transition-colors">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Track Scores</h3>
              <p className="text-slate-400">
                Log your latest golf scores in Stableford format. We keep your last 5 scores to calculate your draw entries.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-8 hover:border-cyan-500/50 transition-colors">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-6">
                <Trophy className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Win Prizes</h3>
              <p className="text-slate-400">
                Enter monthly draws with your scores. Match 3, 4, or 5 numbers to win. Jackpots roll over if unclaimed.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-8 hover:border-emerald-500/50 transition-colors">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-6">
                <Heart className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Support Causes</h3>
              <p className="text-slate-400">
                Choose a charity to support. At least 10% of your subscription goes directly to your chosen cause.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Charity Impact Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 rounded-3xl border border-emerald-500/30 p-12 text-center space-y-6">
          <h2 className="text-4xl font-bold">Making a Real Difference</h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Every subscription directly supports charities. Last month, our community contributed over $50,000 to causes around the world.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <a href={getLoginUrl()}>Join the Movement</a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12 px-4 sm:px-6 lg:px-8 bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-lg font-bold text-emerald-400 mb-4">GolfGive</div>
              <p className="text-sm text-slate-400">
                Golf with purpose. Every score matters.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-emerald-400 transition">Features</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition">Pricing</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition">How It Works</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-emerald-400 transition">About</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition">Blog</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-emerald-400 transition">Privacy</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-sm text-slate-400">
            <p>&copy; 2026 GolfGive. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
