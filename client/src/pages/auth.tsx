import { useState } from "react";
import { useLocation } from "wouter";
import { useLogin, useRegister } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Cloud, Loader2 } from "lucide-react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [, setLocation] = useLocation();
  const { mutate: login, isPending: isLoginPending } = useLogin();
  const { mutate: register, isPending: isRegisterPending } = useRegister();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    displayName: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      login({ username: formData.username, password: formData.password }, {
        onSuccess: () => setLocation("/drive")
      });
    } else {
      register({ 
        username: formData.username, 
        password: formData.password,
        displayName: formData.displayName 
      }, {
        onSuccess: () => {
          // Auto-login or ask to login
          login({ username: formData.username, password: formData.password }, {
            onSuccess: () => setLocation("/drive")
          });
        }
      });
    }
  };

  const isPending = isLoginPending || isRegisterPending;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-8 animate-in fade-in duration-500">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-primary shadow-lg shadow-primary/30 mb-4">
            <Cloud className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold">CloudVault</h1>
          <p className="text-muted-foreground">Secure, fast, and beautiful cloud storage.</p>
        </div>

        <Card className="border-border/50 shadow-xl">
          <CardHeader>
            <CardTitle>{isLogin ? "Welcome back" : "Create an account"}</CardTitle>
            <CardDescription>
              {isLogin ? "Enter your credentials to access your files." : "Get started with 10GB of free storage."}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="johndoe"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>
              
              {!isLogin && (
                <div className="space-y-2 animate-in slide-in-from-top-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    placeholder="John Doe"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button className="w-full h-11 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30" disabled={isPending}>
                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isLogin ? "Sign In" : "Create Account"}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full" 
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
