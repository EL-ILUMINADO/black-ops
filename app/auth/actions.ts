'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // We now encode the actual Supabase error message into the URL
    redirect(`/auth?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/', 'layout');
  redirect('/chat');
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const isLengthValid = password.length >= 10;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  if (!isLengthValid || !hasUppercase || !hasLowercase || !hasSymbol) {
    redirect('/auth?error=Passphrase does not meet strict security protocols');
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    // Log it to your VS Code terminal so we have a permanent record
    console.error("SUPABASE SIGNUP ERROR:", error);
    // Send the exact error to the frontend UI
    redirect(`/auth?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/', 'layout');
  redirect('/chat');
}

export async function verifyAndSignOut(password: string) {
  const supabase = await createClient();

  // 1. Re-authenticate the user to verify the password
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) throw new Error("No active session found");

  const { error } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: password,
  });

  if (error) {
    throw new Error("Credentials verification failed. Termination aborted.");
  }

  // 2. Passwords match. Perform a global sign-out (wipes all sessions)
  await supabase.auth.signOut({ scope: 'global' });
  
  revalidatePath('/', 'layout');
  redirect('/');
}

export async function verifyAndInitiateHandshake(password: string, recipientId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Re-authenticate to verify the password is correct
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password,
  });

  if (authError) throw new Error("Invalid passphrase. Identity verification failed.");

  // Create the connection request in the public.connections table
  const { error: dbError } = await supabase
    .from("connections")
    .insert({
      sender_id: user.id,
      recipient_id: recipientId,
      status: 'pending'
    });

  if (dbError) {
    if (dbError.code === '23505') throw new Error("A handshake is already active or pending with this agent.");
    throw new Error("Failed to initialize secure frequency.");
  }

  return { success: true };
}


export async function verifyReceiverIdentity(password: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password,
  });

  if (error) throw new Error("Invalid passphrase. Intercept aborted.");
  return { success: true };
}

export async function completeAcceptance(
  connectionId: string, 
  sharedPassword: string, 
  decryptPassword: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  
  const { error: connError } = await supabase
    .from("connections")
    .update({ 
      status: 'accepted',
      chat_password_hash: btoa(sharedPassword) 
    })
    .eq('id', connectionId)
    .eq('recipient_id', user.id);

  if (connError) throw new Error("Failed to secure the connection channel.");

  // Create Person B's 24-hour local decryption key
  const { error: keyError } = await supabase
    .from("personal_vault_keys")
    .insert({
      user_id: user.id,
      connection_id: connectionId,
      decryption_key_hash: btoa(decryptPassword)
    });

  if (keyError) throw new Error("Failed to generate local decryption authority.");

  return { success: true };
}


export async function fetchSharedKey(connectionId: string, password: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Re-verify Person A's identity
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password,
  });

  if (authError) throw new Error("Invalid passphrase. Authority denied.");

  // Fetch the encoded shared password from the connection
  const { data: conn, error: connError } = await supabase
    .from("connections")
    .select("chat_password_hash")
    .eq("id", connectionId)
    .eq("sender_id", user.id)
    .single();

  if (connError || !conn?.chat_password_hash) throw new Error("Failed to retrieve shared cipher.");

  // Decode it 
  return { sharedPassword: atob(conn.chat_password_hash) };
}

export async function finalizeSenderKey(connectionId: string, decryptPassword: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Create Person A's 24-hour local decryption key
  const { error } = await supabase
    .from("personal_vault_keys")
    .insert({
      user_id: user.id,
      connection_id: connectionId,
      decryption_key_hash: btoa(decryptPassword)
    });

  if (error) throw new Error("Failed to generate local decryption authority.");

  return { success: true };
}