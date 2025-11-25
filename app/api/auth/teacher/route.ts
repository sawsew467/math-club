import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    const teacherEmail = process.env.TEACHER_EMAIL;
    const teacherPassword = process.env.TEACHER_PASSWORD;

    if (!teacherEmail || !teacherPassword) {
      return NextResponse.json(
        { error: 'Teacher account not configured' },
        { status: 500 }
      );
    }

    if (email === teacherEmail && password === teacherPassword) {
      // Return teacher info (no real auth, just verification)
      return NextResponse.json({
        success: true,
        teacher: {
          email: teacherEmail,
          name: 'Giáo viên',
          role: 'teacher',
        },
      });
    }

    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}
