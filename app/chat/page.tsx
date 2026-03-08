import ChatDashboard from "@/components/chatDashboard";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function ChatPage() {
  const supabase = await createClient();
  
  // Cryptographically verify the cookie and get the user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  return (
    <div className="min-h-screen bg-obsidian">
      <ChatDashboard userEmail={user.email} />
    </div>
  );
}