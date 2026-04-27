import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const BREVO_API_KEY = process.env.BREVO_API_KEY
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'

async function sendUnsubscribeEmail(email) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hybrid-hunting.vercel.app'
  
  const emailBody = {
    sender: { name: 'HybridHunting', email: 'angelpersonal3@gmail.com' },
    to: [{ email: email }],
    subject: 'You have been unsubscribed from HybridHunting',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2A2A2A;">Unsubscribed</h1>
        <p>You have been removed from HybridHunting deal alerts.</p>
        <p>If this was a mistake, <a href="${baseUrl}">click here</a> to resubscribe.</p>
        <hr style="margin: 24px 0; border-color: #e5e5e5;" />
        <p style="font-size: 12px; color: #666;">We'll miss you! Come back anytime.</p>
      </div>
    `
  }
  
  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      'api-key': BREVO_API_KEY
    },
    body: JSON.stringify(emailBody)
  })
  
  if (!response.ok) {
    console.error('Failed to send unsubscribe email')
  }
}

export async function POST(request) {
  try {
    const { email } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      )
    }

    const { error: updateError } = await supabase
      .from('email_subscribers')
      .update({ active: false, unsubscribed_at: new Date().toISOString() })
      .eq('email', email)

    if (updateError) throw updateError

    // Send confirmation email
    try {
      await sendUnsubscribeEmail(email)
    } catch (emailError) {
      console.error('Unsubscribe email send failed:', emailError)
    }

    return NextResponse.json(
      { message: 'Unsubscribed successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Unsubscribe error:', error)
    return NextResponse.json(
      { error: 'Failed to unsubscribe' },
      { status: 500 }
    )
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')
  
  if (!email) {
    return new Response('Email parameter required', { status: 400 })
  }
  
  await supabase
    .from('email_subscribers')
    .update({ active: false, unsubscribed_at: new Date().toISOString() })
    .eq('email', email)
  
  // Send confirmation email for GET requests too
  try {
    await sendUnsubscribeEmail(email)
  } catch (emailError) {
    console.error('Unsubscribe email send failed:', emailError)
  }
  
  return new Response(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Unsubscribed - HybridHunting</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 50px 20px;
            background-color: #f9fafb;
            margin: 0;
          }
          .container {
            max-width: 500px;
            margin: 0 auto;
            background: white;
            padding: 40px 30px;
            border-radius: 16px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          }
          h1 { font-size: 24px; color: #2A2A2A; margin-bottom: 16px; }
          p { color: #666; line-height: 1.5; margin-bottom: 24px; }
          a {
            display: inline-block;
            background-color: #C8D8C0;
            color: #2A2A2A;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: bold;
          }
          a:hover { opacity: 0.9; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>✓ Unsubscribed</h1>
          <p>You have been removed from HybridHunting deal alerts.</p>
          <p>A confirmation email has been sent.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://hybrid-hunting.vercel.app'}">Return to HybridHunting</a>
        </div>
      </body>
    </html>
  `, { 
    headers: { 'Content-Type': 'text/html' } 
  })
}