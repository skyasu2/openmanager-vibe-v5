// Test file for AI review demonstration
import { NextRequest, NextResponse } from 'next/server';

interface User {
  id: string;
  email: string;
  password: string; // Security issue: storing password in plain text
  role: 'admin' | 'user';
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password } = body;
  
  // Performance issue: no input validation
  const user: User = {
    id: Math.random().toString(), // Bad practice: weak ID generation
    email: email,
    password: password, // Security issue: no hashing
    role: 'user'
  };
  
  // Logic issue: no error handling
  const result = saveUser(user);
  
  return NextResponse.json({ success: true, user });
}

function saveUser(user: User) {
  // Database operation without error handling
  console.log('Saving user:', user);
  // Missing: actual database save
  return true;
}

// Missing: input validation
// Missing: authentication check
// Missing: rate limiting
// Missing: logging