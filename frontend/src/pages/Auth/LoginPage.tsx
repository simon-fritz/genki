import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router";
import { login as loginApi } from "@/api/auth";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Field,
    FieldLabel,
    FieldError,
    FieldGroup,
} from "@/components/ui/field";

function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [usernameOrEmail, setUsernameOrEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [formError, setFormError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const sessionExpiredToastShown = useRef(false);

    useEffect(() => {
        if (
            location.state?.sessionExpired &&
            !sessionExpiredToastShown.current
        ) {
            sessionExpiredToastShown.current = true;
            toast.error("The session expired. Please log in again.");
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, navigate, location.pathname]);

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
        <div className="p-10 max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-2">Sign in</h1>
            <p className="text-muted-foreground mb-6">
                Enter your credentials to continue.
            </p>

            <form onSubmit={handleSubmit}>
                <FieldGroup>
                    <Field>
                        <FieldLabel>Username or Email</FieldLabel>
                        <Input
                            value={usernameOrEmail}
                            onChange={(e) => setUsernameOrEmail(e.target.value)}
                            placeholder="username or email"
                            autoComplete="username"
                        />
                    </Field>
                    <Field>
                        <FieldLabel>Password</FieldLabel>
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="password"
                            autoComplete="current-password"
                        />
                    </Field>
                </FieldGroup>

                {formError && (
                    <FieldError className="mt-4">{formError}</FieldError>
                )}

                <Button
                    type="submit"
                    className="w-full mt-6"
                    disabled={loading}
                >
                    {loading ? "Logging in..." : "Log in"}
                </Button>
            </form>

            <p className="text-sm text-muted-foreground mt-6">
                Need an account?{" "}
                <Link to="/register" className="text-primary hover:underline">
                    Register
                </Link>
            </p>
        </div>
    );
}

export default LoginPage;
