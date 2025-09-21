'use client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { ViraasatLogo } from './viraasat-logo';

interface LoginFormProps {
  userType: 'Artisan' | 'Customer';
}

export function LoginForm({ userType }: LoginFormProps) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
                <ViraasatLogo />
            </div>
          <CardTitle className="text-2xl">{userType} Login</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="m@example.com" required />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center">
              <Label htmlFor="password">Password</Label>
              <Link href="#" className="ml-auto inline-block text-sm underline">
                Forgot your password?
              </Link>
            </div>
            <Input id="password" type="password" required />
          </div>
          <Button type="submit" className="w-full">
            Sign in
          </Button>
          <Button variant="outline" className="w-full">
            Sign in with Google
          </Button>
        </CardContent>
        <CardFooter className="flex-col gap-2 text-sm">
          <p>
            {userType === 'Customer' ? (
                <span>Don't have an account? <Link href="#" className="underline">Sign up</Link></span>
            ) : (
                <span>Not an artisan yet? <Link href="#" className="underline">Apply here</Link></span>
            )}
          </p>
           <Link href="/login" className="underline">Back to main login</Link>
        </CardFooter>
      </Card>
    </div>
  );
}
