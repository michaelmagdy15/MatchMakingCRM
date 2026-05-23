import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { event, ladyEmail, gentlemanEmail, ladyCode, gentlemanCode, adminEmail, notes } = await req.json()

    // Compile email details based on the matchmaking event
    let subject = ""
    let htmlContent = ""
    let toEmails: string[] = []

    switch (event) {
      case 'match_proposed':
        subject = "We found a potential match for you! ❤️"
        toEmails = [ladyEmail, gentlemanEmail].filter(Boolean)
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #db2777; font-size: 24px; font-weight: bold; margin-bottom: 5px;">PureMatch</h1>
              <p style="color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; margin-top: 0;">Match proposed</p>
            </div>
            <p style="font-size: 16px; color: #333;">Great news!</p>
            <p style="font-size: 15px; color: #555; line-height: 1.6;">
              Our expert matchmakers have found a potential compatible profile for you! 
            </p>
            <div style="background-color: #f9f9f9; border-left: 4px solid #db2777; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; font-size: 14px; color: #555;">
                A proposed match between <strong>Gentleman ${gentlemanCode}</strong> and <strong>Lady ${ladyCode}</strong> has been locked in.
              </p>
            </div>
            <p style="font-size: 15px; color: #555; line-height: 1.6;">
              Log in to your Candidate Portal now to review their anonymous profile description, preferences, and details.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://purematch.app/portal" style="background-color: #db2777; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Open Candidate Portal</a>
            </div>
            <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
            <p style="font-size: 12px; color: #999; text-align: center;">
              This is an automated security-shielded notification from PureMatch CRM. Your details remain completely private until both sides approve.
            </p>
          </div>
        `
        break;

      case 'mutual_text_approved':
        subject = "Great news! Descriptions Approved - Swap Photos now 📸"
        toEmails = [ladyEmail, gentlemanEmail].filter(Boolean)
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #ec4899; font-size: 24px; font-weight: bold; margin-bottom: 5px;">PureMatch</h1>
              <p style="color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; margin-top: 0;">Description approved</p>
            </div>
            <p style="font-size: 16px; color: #333;">Excellent progress!</p>
            <p style="font-size: 15px; color: #555; line-height: 1.6;">
              Both you and your proposed match (<strong>Lady ${ladyCode}</strong> & <strong>Gentleman ${gentlemanCode}</strong>) have approved each other's anonymous text profiles!
            </p>
            <p style="font-size: 15px; color: #555; line-height: 1.6;">
              The next step is to upload/opt-in to swap photos. Photos remain hidden until both candidates approve swapping.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://purematch.app/portal" style="background-color: #ec4899; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Approve Photo Swap</a>
            </div>
            <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
            <p style="font-size: 12px; color: #999; text-align: center;">
              Thank you for using PureMatch CRM. Security and privacy is our number one priority.
            </p>
          </div>
        `
        break;

      case 'match_success':
        subject = "It's a Match! Contact details are now shared! 🎉"
        toEmails = [ladyEmail, gentlemanEmail].filter(Boolean)
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #10b981; font-size: 24px; font-weight: bold; margin-bottom: 5px;">PureMatch</h1>
              <p style="color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; margin-top: 0;">Mutual match success</p>
            </div>
            <p style="font-size: 16px; color: #333;">Congratulations! 🎉</p>
            <p style="font-size: 15px; color: #555; line-height: 1.6;">
              Gentleman <strong>${gentlemanCode}</strong> and Lady <strong>${ladyCode}</strong> have both approved exchanging photos and sharing contacts!
            </p>
            <p style="font-size: 15px; color: #555; line-height: 1.6;">
              Phone numbers, email addresses, and social links are now fully unlocked on your candidate portal.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://purematch.app/portal" style="background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Open Portal to View Contacts</a>
            </div>
            <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
            <p style="font-size: 12px; color: #999; text-align: center;">
              Wishing you a beautiful connection and long-lasting compatibility!
            </p>
          </div>
        `
        break;

      case 'admin_inactivity_warning':
        subject = `⚠️ Stalled Match Alert: ${gentlemanCode} & ${ladyCode}`
        toEmails = [adminEmail || 'admin@datingcrm.com']
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 12px;">
            <h2 style="color: #f59e0b; margin-top: 0;">CRM Stalled Match Warning</h2>
            <p style="font-size: 15px; color: #333;">Hello Moderator / Matchmaker,</p>
            <p style="font-size: 14px; color: #555; line-height: 1.6;">
              The proposed match between <strong>Gentleman ${gentlemanCode}</strong> and <strong>Lady ${ladyCode}</strong> has been stalled for over 48 hours with no progression.
            </p>
            <p style="font-size: 14px; color: #555;">
              <strong>Current Status:</strong> ${notes || 'Pending Approval'}
            </p>
            <p style="font-size: 14px; color: #555;">
              Please check in with the candidates to see if they need assistance or follow up.
            </p>
            <div style="text-align: center; margin: 20px 0;">
              <a href="https://purematch.app/dashboard" style="background-color: #f59e0b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Open Match Control Center</a>
            </div>
          </div>
        `
        break;

      default:
        return new Response(JSON.stringify({ error: 'Unknown event type' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

    if (!RESEND_API_KEY) {
      console.warn("Deno: RESEND_API_KEY environment variable is not defined. Simulating email send locally.");
      return new Response(JSON.stringify({ success: true, message: 'Email dispatch simulated successfully (sandbox mode).' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const sendResults = [];

    // 1. Send separate emails to each candidate (to protect candidate anonymity)
    for (const recipientEmail of toEmails) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'PureMatch <notifications@purematch.app>',
            to: [recipientEmail],
            subject: subject,
            html: htmlContent,
          }),
        });
        const resData = await res.json();
        sendResults.push({ email: recipientEmail, success: res.ok, id: resData?.id, error: res.ok ? null : resData?.message });
      } catch (err: any) {
        sendResults.push({ email: recipientEmail, success: false, error: err.message || String(err) });
      }
    }

    // 2. If it's a progress event, send a dedicated progress alert to the Admin
    if (adminEmail && event !== 'admin_inactivity_warning') {
      try {
        const adminSubject = `[PureMatch Admin Alert] Progress Event: ${event} for ${gentlemanCode} & ${ladyCode}`;
        const adminHtmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 12px; background-color: #fafafa;">
            <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
              <h1 style="color: #3b82f6; font-size: 22px; font-weight: bold; margin: 0;">PureMatch CRM Admin Alert</h1>
              <p style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; margin: 5px 0 0 0;">Moderation Panel Notifications</p>
            </div>
            <p style="font-size: 15px; color: #333;">Hello Moderator / Matchmaker,</p>
            <p style="font-size: 14px; color: #555; line-height: 1.5;">
              A progression event occurred for a proposed matchmaking couple in the system.
            </p>
            <div style="background-color: #ffffff; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #555;"><strong>Event:</strong> <span style="text-transform: uppercase; font-weight: bold; color: #2563eb;">${event}</span></p>
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #555;"><strong>Proposed Match:</strong> Gentleman <strong>${gentlemanCode}</strong> & Lady <strong>${ladyCode}</strong></p>
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #555;"><strong>Lady Email:</strong> ${ladyEmail || 'Not configured'}</p>
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #555;"><strong>Gentleman Email:</strong> ${gentlemanEmail || 'Not configured'}</p>
              <p style="margin: 0; font-size: 14px; color: #555;"><strong>Staff Notes:</strong> ${notes || 'No description notes updated.'}</p>
            </div>
            <p style="font-size: 14px; color: #555; line-height: 1.5;">
              The system automatically dispatched secure candidate-specific email alerts to each portal account separately.
            </p>
            <div style="text-align: center; margin: 25px 0;">
              <a href="https://purematch.app/dashboard" style="background-color: #3b82f6; color: white; padding: 10px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Open Match Control Center</a>
            </div>
            <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
            <p style="font-size: 11px; color: #aaa; text-align: center;">
              This is a security-shielded monitoring notification from PureMatch CRM to ensure high quality moderation.
            </p>
          </div>
        `;

        const resAdmin = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'PureMatch Alerts <alerts@purematch.app>',
            to: [adminEmail],
            subject: adminSubject,
            html: adminHtmlContent,
          }),
        });
        const resAdminData = await resAdmin.json();
        sendResults.push({ email: adminEmail, role: 'admin', success: resAdmin.ok, id: resAdminData?.id, error: resAdmin.ok ? null : resAdminData?.message });
      } catch (err: any) {
        sendResults.push({ email: adminEmail, role: 'admin', success: false, error: err.message || String(err) });
      }
    }

    // Return status summary
    const anyFailed = sendResults.some(r => !r.success);
    if (!anyFailed && sendResults.length > 0) {
      return new Response(JSON.stringify({ success: true, deliveries: sendResults }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } else {
      return new Response(JSON.stringify({ error: 'Some or all email deliveries failed', details: sendResults }), {
        status: anyFailed && sendResults.every(r => !r.success) ? 400 : 207, // Multi-Status / Partial success
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
