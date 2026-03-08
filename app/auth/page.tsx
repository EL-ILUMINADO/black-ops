import AuthForm from "@/components/authForm";

export default async function AuthPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ error?: string }> 
}) {
  
  const resolvedParams = await searchParams;
  const error = resolvedParams.error;

  return (
    <div className="min-h-[85vh] bg-obsidian flex flex-col items-center justify-center p-6">
       <AuthForm errorMessage={error} />
    </div>
  );
}