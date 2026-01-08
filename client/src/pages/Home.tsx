import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, TrendingUp, Users, Bell, Github, Chrome } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-black/20 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-purple-400" />
              <h1 className="text-2xl font-bold text-white">Solana Dev Tracker</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/developers">
                <Button variant="ghost" className="text-white hover:text-purple-300">
                  Developers
                </Button>
              </Link>
              <Link href="/analytics">
                <Button variant="ghost" className="text-white hover:text-purple-300">
                  Analytics
                </Button>
              </Link>
              <Link href="/documentation">
                <Button variant="ghost" className="text-white hover:text-purple-300">
                  Documentation
                </Button>
              </Link>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="gap-2 border-purple-500 text-purple-300 hover:bg-purple-500/20">
                  <Github className="h-4 w-4" />
                  GitHub
                </Button>
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/50 text-sm px-4 py-1">
            Transparent Developer Reputation Tracking
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
            Track Solana Developer
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"> Reputation</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Monitor on-chain activity and social presence to identify trustworthy token developers. 
            Make informed investment decisions with comprehensive developer analytics.
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Link href="/developers">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8">
                Explore Developers
              </Button>
            </Link>
            <a href="/chrome_extension" download>
              <Button size="lg" variant="outline" className="gap-2 border-purple-500 text-purple-300 hover:bg-purple-500/20">
                <Chrome className="h-5 w-5" />
                Get Extension
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
            <CardHeader>
              <Shield className="h-10 w-10 text-purple-400 mb-2" />
              <CardTitle className="text-white">Reputation Scoring</CardTitle>
              <CardDescription className="text-gray-400">
                Comprehensive scoring based on migration success, token launches, and bonding rates
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
            <CardHeader>
              <TrendingUp className="h-10 w-10 text-green-400 mb-2" />
              <CardTitle className="text-white">Migration Tracking</CardTitle>
              <CardDescription className="text-gray-400">
                Monitor token migrations from Pump.fun and track bonding success rates
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
            <CardHeader>
              <Users className="h-10 w-10 text-blue-400 mb-2" />
              <CardTitle className="text-white">Social Presence</CardTitle>
              <CardDescription className="text-gray-400">
                Link Twitter accounts and communities to developer wallets for credibility
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
            <CardHeader>
              <Bell className="h-10 w-10 text-yellow-400 mb-2" />
              <CardTitle className="text-white">Real-time Alerts</CardTitle>
              <CardDescription className="text-gray-400">
                Get notified about new launches, migrations, and suspicious patterns
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/30 backdrop-blur-lg">
          <CardContent className="p-12">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-5xl font-bold text-white mb-2">24/7</div>
                <div className="text-gray-300">Continuous Monitoring</div>
              </div>
              <div>
                <div className="text-5xl font-bold text-white mb-2">100%</div>
                <div className="text-gray-300">Transparent Data</div>
              </div>
              <div>
                <div className="text-5xl font-bold text-white mb-2">Open</div>
                <div className="text-gray-300">Source on GitHub</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Architecture Overview */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Our system combines on-chain data analysis with social presence tracking to provide comprehensive developer insights
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
            <CardHeader>
              <div className="text-3xl font-bold text-purple-400 mb-2">01</div>
              <CardTitle className="text-white">Data Collection</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">
                Continuously monitor Solana blockchain via Helius RPC for token launches, migrations, and bonding events. 
                Track Twitter API for social presence and community links.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
            <CardHeader>
              <div className="text-3xl font-bold text-purple-400 mb-2">02</div>
              <CardTitle className="text-white">Analysis & Scoring</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">
                Apply wallet clustering algorithms to identify related wallets. Calculate reputation scores based on 
                migration success, bonding rates, and detect suspicious patterns like rug pulls.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
            <CardHeader>
              <div className="text-3xl font-bold text-purple-400 mb-2">03</div>
              <CardTitle className="text-white">Visualization</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">
                Access insights through our web dashboard or Chrome extension. Get real-time notifications for 
                tracked developers and make informed investment decisions.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-to-r from-purple-600 to-pink-600 border-0">
          <CardContent className="p-12 text-center">
            <h2 className="text-4xl font-bold text-white mb-4">
              Start Tracking Developers Today
            </h2>
            <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
              Join the community of informed investors using transparent data to make better decisions
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/developers">
                <Button size="lg" variant="secondary" className="px-8">
                  Browse Developers
                </Button>
              </Link>
              <Link href="/documentation">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/20 px-8">
                  Read Documentation
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/20 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-purple-400" />
              <span className="text-white font-semibold">Solana Dev Tracker</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="https://github.com" className="text-gray-400 hover:text-white transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <span className="text-gray-400 text-sm">Built with transparency</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
