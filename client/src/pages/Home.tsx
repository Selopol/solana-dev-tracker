import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Server, Chrome, Database } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full bg-slate-800/50 border-slate-700 backdrop-blur">
        <CardHeader className="text-center pb-8">
          <div className="flex justify-center mb-4">
            <Shield className="h-16 w-16 text-purple-400" />
          </div>
          <CardTitle className="text-4xl font-bold text-white mb-2">
            Solana Developer Tracker
          </CardTitle>
          <p className="text-slate-400">Backend API Service</p>
          <Badge className="mt-4 bg-green-500/20 text-green-300 border-green-500/50">
            ● Service Running
          </Badge>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-700">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Server className="h-5 w-5 text-purple-400" />
              API Endpoints
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-300">
                <span>tRPC API:</span>
                <code className="text-purple-300">/api/trpc/*</code>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Health Check:</span>
                <code className="text-purple-300">/api/health</code>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-700">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-400" />
              Data Collection
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-400">Solana RPC</p>
                <p className="text-white font-medium">Helius</p>
              </div>
              <div>
                <p className="text-slate-400">Social Data</p>
                <p className="text-white font-medium">Twitter API</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-700">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Chrome className="h-5 w-5 text-yellow-400" />
              Chrome Extension
            </h3>
            <p className="text-slate-300 text-sm mb-3">
              This backend powers the Solana Developer Tracker Chrome extension that integrates with Padre trading terminal.
            </p>
            <p className="text-slate-400 text-xs">
              Install the extension to view developer reputation data directly in your trading interface.
            </p>
          </div>

          <div className="text-center pt-4">
            <p className="text-slate-500 text-sm">
              API Documentation: <a href="/api/docs" className="text-purple-400 hover:text-purple-300">View Docs</a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
