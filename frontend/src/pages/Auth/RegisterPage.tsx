import React, { useState } from "react";
import { useNavigate } from "react-router";
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Field,
    FieldLabel,
    FieldError,
    FieldGroup,
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
            // Axios 400 error: no content, so we show a generic error
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
        <div className="p-10 max-w-[800px] mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Create Account</CardTitle>
                    <CardDescription>Sign up to get started.</CardDescription>
                    <CardAction />
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <FieldGroup>
                            <Field>
                                <FieldLabel>Username</FieldLabel>
                                <Input
                                    value={username}
                                    onChange={(e) =>
                                        setUsername(e.target.value)
                                    }
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
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
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
                                    onChange={(e) =>
                                        setPassword2(e.target.value)
                                    }
                                    placeholder="confirm password"
                                    autoComplete="new-password"
                                />
                                <FieldError>{fieldErrors.password2}</FieldError>
                            </Field>
                        </FieldGroup>
                        <FieldSeparator />
                        <Field>
                            <div className="flex items-center space-x-2">
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
                            </div>
                        </Field>
                        {error && <FieldError>{error}</FieldError>}
                        <div>
                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50"
                                disabled={loading}
                            >
                                {loading ? "Creating account..." : "Register"}
                            </button>
                        </div>
                    </form>
                </CardContent>

                <CardFooter>
                    <p className="text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <a href="/login" className="text-blue-600">
                            Log in
                        </a>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}

export default RegisterPage;
