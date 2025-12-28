import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { login as loginApi } from "@/api/auth";
import { toast } from "sonner";

function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const [usernameOrEmail, setUsernameOrEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [formError, setFormError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFormError(null);
        if (!usernameOrEmail || !password) {
            setFormError("Please enter username/email and password");
            return;
        }
        setLoading(true);
        try {
            await loginApi({ username_or_email: usernameOrEmail, password });
            toast.success("Logged in successfully");
            navigate("/");
        } catch (err: any) {
            const errorMessage = err?.message || "Login failed";
            setFormError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-10 max-w-[800px] mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Sign in</CardTitle>
                    <CardDescription>
                        Enter your credentials to continue.
                    </CardDescription>
                    <CardAction />
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Username or Email
                            </label>
                            <input
                                value={usernameOrEmail}
                                onChange={(e) =>
                                    setUsernameOrEmail(e.target.value)
                                }
                                className="w-full border rounded px-3 py-2"
                                placeholder="username or email"
                                autoComplete="username"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full border rounded px-3 py-2"
                                placeholder="password"
                                autoComplete="current-password"
                            />
                        </div>

                        {formError && (
                            <div className="text-sm text-red-600">
                                {formError}
                            </div>
                        )}
                        {/* error from useAuth removed */}

                        <div>
                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white rounded px-4 py-2"
                                disabled={loading}
                            >
                                {loading ? "Logging in..." : "Log in"}
                            </button>
                        </div>
                    </form>
                </CardContent>
                <CardFooter>
                    <p className="text-sm text-muted-foreground">
                        Need an account?{" "}
                        <a href="/register" className="text-blue-600">
                            Register
                        </a>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}

export default LoginPage;
