'use client';
import { useState } from 'react';
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
import { FaFacebook } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';

interface LoginFormProps {
  userType: 'Artisan' | 'Customer';
}

export function LoginForm({ userType }: LoginFormProps) {
  const [isSignUp, setIsSignUp] = useState(false);

  const toggleForm = () => setIsSignUp(!isSignUp);

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-sm border-2 shadow-lg">
        <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
                <ViraasatLogo />
            </div>
          <CardTitle className="text-2xl">{isSignUp ? 'Create an Account' : `${userType} Login`}</CardTitle>
          <CardDescription>
            {isSignUp ? 'Enter your details to get started.' : 'Enter your email below to login to your account'}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {isSignUp && (
             <div className="grid gap-2">
              <Label htmlFor="fullname">Full Name</Label>
              <Input id="fullname" placeholder="e.g. Priya Patel" required />
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="m@example.com" required />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center">
              <Label htmlFor="password">Password</Label>
              {!isSignUp && (
                <Link href="#" className="ml-auto inline-block text-sm underline">
                  Forgot your password?
                </Link>
              )}
            </div>
            <Input id="password" type="password" required />
          </div>
          <Button type="submit" className="w-full">
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </Button>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <Button variant="outline">
                <FcGoogle className="mr-2 h-5 w-5" />
                Google
            </Button>
            <Button variant="outline">
                <FaFacebook className="mr-2 h-5 w-5 text-[#1877F2]" />
                Facebook
            </Button>
          </div>

        </CardContent>
        <CardFooter className="flex-col gap-4 text-sm">
           <p>
            {isSignUp ? (
              <span>Already have an account? <button onClick={toggleForm} className="underline">Sign In</button></span>
            ) : (
               <span>Don't have an account? <button onClick={toggleForm} className="underline">Sign Up</button></span>
            )}
          </p>
           <Link href="/login" className="underline text-muted-foreground hover:text-primary">Back to main login</Link>
        </CardFooter>
      </Card>
    </div>
  );
}
