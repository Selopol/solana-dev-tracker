import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Shield, Search, TrendingUp, TrendingDown } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function Developers() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: developers, isLoading } = trpc.developers.list.useQuery({ limit: 50, offset: 0 });

  const filteredDevelopers = developers?.filter(dev =>
    dev.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dev.primaryWallet.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-black/20 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <Shield className="h-8 w-8 text-purple-400" />
                <h1 className="text-2xl font-bold text-white">Solana Dev Tracker</h1>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/developers">
                <Button variant="ghost" className="text-purple-300">
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
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Developer Directory</h1>
          <p className="text-gray-300 text-lg">
            Browse and search Solana token developers ranked by reputation score
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by developer name or wallet address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 bg-white/10 border-white/20 text-white placeholder:text-gray-400 h-14 text-lg"
            />
          </div>
        </div>

        {/* Developers List */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
            <p className="text-white mt-4">Loading developers...</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredDevelopers && filteredDevelopers.length > 0 ? (
              filteredDevelopers.map((dev) => (
                <Link key={dev.id} href={`/developer/${dev.id}`}>
                  <Card className="bg-white/5 border-white/10 backdrop-blur-lg hover:bg-white/10 transition-all cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-white">
                              {dev.displayName || "Unknown Developer"}
                            </h3>
                            <Badge
                              className={`${
                                dev.reputationScore >= 70
                                  ? "bg-green-500/20 text-green-300 border-green-500/50"
                                  : dev.reputationScore >= 40
                                  ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/50"
                                  : "bg-red-500/20 text-red-300 border-red-500/50"
                              }`}
                            >
                              Score: {dev.reputationScore}
                            </Badge>
                          </div>
                          <p className="text-gray-400 text-sm font-mono mb-3">
                            {dev.primaryWallet.slice(0, 8)}...{dev.primaryWallet.slice(-8)}
                          </p>
                          <div className="flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400">Tokens:</span>
                              <span className="text-white font-semibold">{dev.totalTokensLaunched}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-green-400" />
                              <span className="text-gray-400">Migrated:</span>
                              <span className="text-green-300 font-semibold">{dev.migratedTokens}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <TrendingDown className="h-4 w-4 text-red-400" />
                              <span className="text-gray-400">Failed:</span>
                              <span className="text-red-300 font-semibold">{dev.failedTokens}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400">Success Rate:</span>
                              <span className="text-purple-300 font-semibold">{dev.migrationSuccessRate}%</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-4xl font-bold text-purple-400">{dev.reputationScore}</div>
                          <div className="text-gray-400 text-sm">Reputation</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
                <CardContent className="p-12 text-center">
                  <p className="text-gray-400 text-lg">No developers found</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
