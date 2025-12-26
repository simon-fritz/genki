import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

function RegisterPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [password2, setPassword2] = useState<string>('');
  const [agreeTerms, setAgreeTerms] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!username || !email || !password || !password2) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== password2) {
      setFieldErrors({ password2: 'Passwords do not match' });
      return;
    }

    if (!agreeTerms) {
      setError('You must agree to the terms and conditions');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/accounts/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, password2 }),
      });

      if (!res.ok) {
        const errData = await res.json();
        setFieldErrors(errData);
        setError('Registration failed. Please check the errors below.');
        setLoading(false);
        return;
      }

      // Success - redirect to login
      navigate('/login');
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Registration failed');
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
            <div>
              <label className="block text-sm font-medium mb-1">Username</label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                autoComplete="username"
              />
              {fieldErrors.username && <p className="text-xs text-red-600 mt-1">{fieldErrors.username}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                autoComplete="email"
              />
              {fieldErrors.email && <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password"
                autoComplete="new-password"
              />
              {fieldErrors.password && <p className="text-xs text-red-600 mt-1">{fieldErrors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Confirm Password</label>
              <Input
                type="password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                placeholder="confirm password"
                autoComplete="new-password"
              />
              {fieldErrors.password2 && <p className="text-xs text-red-600 mt-1">{fieldErrors.password2}</p>}
            </div>

            <Separator />

            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={agreeTerms}
                onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
              />
              <label htmlFor="terms" className="text-sm cursor-pointer">
                I agree to the terms and conditions
              </label>
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}

            <div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Creating account...' : 'Register'}
              </button>
            </div>
          </form>
        </CardContent>

        <CardFooter>
          <p className="text-sm text-muted-foreground">
            Already have an account? <a href="/login" className="text-blue-600">Log in</a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default RegisterPage;
