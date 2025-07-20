import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    console.log('Test webhook received:', body);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test webhook received',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test webhook error:', error);
    return NextResponse.json({ error: 'Test webhook failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Test webhook endpoint is working',
    timestamp: new Date().toISOString()
  });
} 