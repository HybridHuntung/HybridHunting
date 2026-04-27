import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const BREVO_API_KEY = process.env.BREVO_API_KEY
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'

async function sendEmail(email, type) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hybrid-hunting.vercel.app'
  
  let subject = ''
  let htmlContent = ''
  
  if (type === 'welcome') {
    subject = 'Welcome to HybridHunting Deal Alerts!'
    htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2A2A2A;">Welcome to HybridHunting!</h1>
        <p>You've successfully subscribed to Las Vegas cannabis deal alerts.</p>
        
        <h2 style="color: #2A2A2A; margin-top: 24px;">What to expect:</h2>
        <ul>
          <li>Weekly top 5 deals from Vegas dispensaries</li>
          <li>Flash sale notifications</li>
          <li>New dispensary alerts</li>
          <li>Exclusive coupon codes (when available)</li>
        </ul>
        
        <p style="margin-top: 24px;">We respect your inbox. Expect 2-4 emails per month maximum.</p>
        
        <hr style="margin: 24px 0; border-color: #e5e5e5;" />
        
        <p style="font-size: 12px; color: #666;">
          <a href="${baseUrl}/api/unsubscribe?email=${encodeURIComponent(email)}" style="color: #666;">Unsubscribe</a> at any time.
        </p>
      </div>
    `
  } else if (type === 'reactivation') {
    subject = 'You re-subscribed to HybridHunting Deal Alerts!'
    htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2A2A2A;">Welcome back!</h1>
        <p>You've re-subscribed to Las Vegas cannabis deal alerts.</p>
        
        <p>You'll now receive:</p>
        <ul>
          <li>Weekly top 5 deals from Vegas dispensaries</li>
          <li>Flash sale notifications</li>
          <li>New dispensary alerts</li>
        </ul>
        
        <hr style="margin: 24px 0; border-color: #e5e5e5;" />
        
        <p style="font-size: 12px; color: #666;">
          <a href="${baseUrl}/api/unsubscribe?email=${encodeURIComponent(email)}" style="color: #666;">Unsubscribe</a> at any time.
        </p>
      </div>
    `
  }
  
  const emailBody = {
    sender: { name: 'HybridHunting', email: 'angelpersonal3@gmail.com' },
    to: [{ email: email }],
    subject: subject,
    htmlContent: htmlContent
  }

  console.log('SUBSCRIBE - Sending email to:', email)
  
  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      'api-key': BREVO_API_KEY
    },
    body: JSON.stringify(emailBody)
  })

  const responseData = await response.json()
  console.log('SUBSCRIBE - Response status:', response.status)
  console.log('SUBSCRIBE - Response data:', responseData)
  
  if (!response.ok) {
    throw new Error(`Failed to send email: ${response.status} - ${JSON.stringify(responseData)}`)
  }
  
  return responseData
}

export async function POST(request) {
  try {
    const { email } = await request.json()
    console.log('SUBSCRIBE POST - Received email:', email)

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      )
    }

    // Check if already exists (including inactive)
    const { data: existing, error: checkError } = await supabase
      .from('email_subscribers')
      .select('email, active')
      .eq('email', email)
      .maybeSingle()

    if (existing && existing.active === true) {
      return NextResponse.json(
        { message: 'Already subscribed', subscribed: true },
        { status: 409 }
      )
    }

    if (existing && existing.active === false) {
      // Reactivate existing inactive subscriber
      const { error: updateError } = await supabase
        .from('email_subscribers')
        .update({ 
          active: true, 
          unsubscribed_at: null,
          subscribed_at: new Date().toISOString()
        })
        .eq('email', email)

      if (updateError) throw updateError

      console.log('REACTIVATION - About to send email to:', email)

      // Send reactivation email
      try {
        await sendEmail(email, 'reactivation')
      } catch (emailError) {
        console.error('Email send failed:', emailError)
      }

      return NextResponse.json(
        { message: 'Re-subscribed successfully', subscribed: true },
        { status: 200 }
      )
    }

    // New subscriber
    const { error: insertError } = await supabase
      .from('email_subscribers')
      .insert({
        email: email,
        subscribed_at: new Date().toISOString(),
        active: true,
      })

    if (insertError) throw insertError

    // Send confirmation email
    try {
      await sendEmail(email, 'welcome')
    } catch (emailError) {
      console.error('Email send failed:', emailError)
    }

    return NextResponse.json(
      { message: 'Subscribed successfully', subscribed: true },
      { status: 200 }
    )
  } catch (error) {
    console.error('Subscribe error:', error)
    return NextResponse.json(
      { error: 'Failed to subscribe' },
      { status: 500 }
    )
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('email_subscribers')
      .select('email, active')
      .eq('email', email)
      .eq('active', true)
      .maybeSingle()

    if (error || !data) {
      return NextResponse.json({ subscribed: false })
    }

    return NextResponse.json({ subscribed: true })
  } catch (error) {
    console.error('Check error:', error)
    return NextResponse.json({ subscribed: false })
  }
}