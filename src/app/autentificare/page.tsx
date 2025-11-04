'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const formSchema = z.object({
  email: z.string().email('Introduceți un email valid.'),
});

type FormValues = z.infer<typeof formSchema>;

export default function SignInPage() {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: FormValues) => {
    const result = await signIn('email', {
      email: values.email,
      redirect: false,
      callbackUrl: '/dashboard',
    });

    if (result?.error) {
      toast.error('A apărut o problemă. Încercați din nou.');
      return;
    }

    setSubmitted(true);
    toast.success('Link de autentificare trimis. Verificați emailul.');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md border-none bg-white shadow-xl">
        <CardHeader>
          <CardTitle>Autentificare FleetCare</CardTitle>
          <CardDescription>Introduceți adresa de email pentru a primi un link de acces.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nume@companie.ro"
                disabled={isSubmitting || submitted}
                {...register('email')}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting || submitted}>
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Se trimite...
                </span>
              ) : submitted ? (
                'Verificați emailul'
              ) : (
                'Trimite link de acces'
              )}
            </Button>
          </form>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Accesul este permis doar membrilor organizației dumneavoastră.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
