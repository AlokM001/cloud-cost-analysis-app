import { connectToDatabase } from '@/lib/db';
import { UserModel } from '@/models/User';

// One-time seed endpoint to populate MongoDB with existing users
// Call this once after deploying: GET /api/auth/seed
export async function GET() {
  try {
    const { connected } = await connectToDatabase();

    if (!connected) {
      return Response.json(
        { error: 'MongoDB is not connected. Cannot seed users without a database.' },
        { status: 503 }
      );
    }

    const seedUsers = [
      {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      },
      {
        email: 'pranaypatil89043@gmail.com',
        name: 'pranay',
        password: 'pranay890',
      },
    ];

    const results = [];

    for (const user of seedUsers) {
      const existing = await UserModel.findOne({ email: user.email });
      if (existing) {
        results.push({ email: user.email, status: 'already exists' });
      } else {
        await UserModel.create(user);
        results.push({ email: user.email, status: 'created' });
      }
    }

    return Response.json(
      { message: 'Seed completed', results },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ [SEED] Error:', error.message);
    return Response.json(
      { error: error.message || 'Seed failed' },
      { status: 500 }
    );
  }
}
