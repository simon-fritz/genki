import React, { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Field,
    FieldLabel,
    FieldError,
    FieldSeparator,
} from "@/components/ui/field";
import { register } from "@/api/auth";
import { toast } from "sonner";

function RegisterPage() {
    const navigate = useNavigate();

    const [username, setUsername] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [password2, setPassword2] = useState<string>("");
    const [agreeTerms, setAgreeTerms] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setFieldErrors({});

        if (!username || !email || !password || !password2) {
            setError("Please fill in all fields");
            return;
        }

        if (password !== password2) {
            setFieldErrors({ password2: "Passwords do not match" });
            return;
        }

        if (!agreeTerms) {
            setError("You must agree to the terms and conditions");
            return;
        }

        setLoading(true);
        try {
            await register({ username, email, password, password2 });
            toast.success(
                "Account created successfully! Please log in to proceed.",
            );
            navigate("/login", { state: { registered: true } });
        } catch (err: any) {
            if (err?.response?.status === 400) {
                setError("Registration failed. Please check your input.");
            } else {
                setError(err.message || "Registration failed");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-10 max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-2">Create Account</h1>
            <p className="text-muted-foreground mb-6">
                Sign up to get started.
            </p>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field>
                        <FieldLabel>Username</FieldLabel>
                        <Input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="username"
                            autoComplete="username"
                        />
                        <FieldError>{fieldErrors.username}</FieldError>
                    </Field>
                    <Field>
                        <FieldLabel>Email</FieldLabel>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="email@example.com"
                            autoComplete="email"
                        />
                        <FieldError>{fieldErrors.email}</FieldError>
                    </Field>
                    <Field>
                        <FieldLabel>Password</FieldLabel>
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="password"
                            autoComplete="new-password"
                        />
                        <FieldError>{fieldErrors.password}</FieldError>
                    </Field>
                    <Field>
                        <FieldLabel>Confirm Password</FieldLabel>
                        <Input
                            type="password"
                            value={password2}
                            onChange={(e) => setPassword2(e.target.value)}
                            placeholder="confirm password"
                            autoComplete="new-password"
                        />
                        <FieldError>{fieldErrors.password2}</FieldError>
                    </Field>
                </div>

                <FieldSeparator className="my-6" />

                <Field orientation="horizontal">
                    <Checkbox
                        id="terms"
                        checked={agreeTerms}
                        onCheckedChange={(checked) =>
                            setAgreeTerms(checked as boolean)
                        }
                    />
                    <FieldLabel htmlFor="terms">
                        I agree to the terms and conditions
                    </FieldLabel>
                </Field>

                {error && <FieldError className="mt-4">{error}</FieldError>}

                <Button
                    type="submit"
                    className="w-full mt-6"
                    disabled={loading}
                >
                    {loading ? "Creating account..." : "Register"}
                </Button>
            </form>

            <p className="text-sm text-muted-foreground mt-6">
                Already have an account?{" "}
                <Link to="/login" className="text-primary hover:underline">
                    Log in
                </Link>
            </p>
        </div>
    );
}

export default RegisterPage;
