import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-white via-white to-secondary/5 dark:from-primary-dark dark:via-primary-dark dark:to-primary-light p-4">
      <SignUp />
    </div>
  );
}
