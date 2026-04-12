// Email utilities for weekly reports
// This is a placeholder - integrate with your preferred email service
// (SendGrid, Resend, Postmark, AWS SES, etc.)

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

interface WeeklyReportData {
  userName?: string
  weekStartDate: string
  weekEndDate: string
  stats: {
    actionsCompleted: number
    co2SavedKg: number
    dollarsSaved: number
    currentStreak: number
  }
  report: {
    whatWentWell: string
    patternObserved: string
    focusThisWeek: string
  }
}

// Generate HTML email for weekly report
export function generateWeeklyReportEmail(data: WeeklyReportData): string {
  const { stats, report, weekStartDate, weekEndDate, userName } = data

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Weekly Shift Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #0f1a0f;
      color: #e5e7eb;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #1a2e1a;
      border-radius: 16px;
      overflow: hidden;
    }
    .header {
      background-color: #16a34a;
      padding: 24px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      color: white;
    }
    .content {
      padding: 24px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 16px;
      color: #f0fdf4;
    }
    .date-range {
      color: #86efac;
      font-size: 14px;
      margin-bottom: 24px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    .stat-box {
      background-color: #0f1a0f;
      border-radius: 12px;
      padding: 16px;
      text-align: center;
    }
    .stat-value {
      font-size: 28px;
      font-weight: bold;
      color: #f0fdf4;
    }
    .stat-label {
      font-size: 12px;
      color: #86efac;
      margin-top: 4px;
    }
    .section {
      margin-bottom: 20px;
    }
    .section-title {
      font-size: 14px;
      color: #86efac;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .section-content {
      color: #e5e7eb;
      line-height: 1.6;
    }
    .cta {
      text-align: center;
      padding: 24px 0;
    }
    .cta-button {
      display: inline-block;
      background-color: #16a34a;
      color: white;
      padding: 14px 28px;
      border-radius: 12px;
      text-decoration: none;
      font-weight: 600;
    }
    .footer {
      text-align: center;
      padding: 24px;
      color: #6b7280;
      font-size: 12px;
      border-top: 1px solid #374151;
    }
    .unsubscribe {
      color: #86efac;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Your Weekly Shift Report</h1>
    </div>

    <div class="content">
      <div class="greeting">
        Hey${userName ? ` ${userName}` : ''}! Here's your sustainability impact this week.
      </div>

      <div class="date-range">
        ${weekStartDate} - ${weekEndDate}
      </div>

      <div class="stats-grid">
        <div class="stat-box">
          <div class="stat-value">${stats.actionsCompleted}</div>
          <div class="stat-label">Actions Completed</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">${stats.co2SavedKg.toFixed(1)}kg</div>
          <div class="stat-label">CO₂ Saved</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">$${stats.dollarsSaved.toFixed(0)}</div>
          <div class="stat-label">Money Saved</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">${stats.currentStreak}</div>
          <div class="stat-label">Day Streak</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">What Went Well</div>
        <div class="section-content">${report.whatWentWell}</div>
      </div>

      <div class="section">
        <div class="section-title">Patterns We Noticed</div>
        <div class="section-content">${report.patternObserved}</div>
      </div>

      <div class="section">
        <div class="section-title">Focus This Week</div>
        <div class="section-content">${report.focusThisWeek}</div>
      </div>

      <div class="cta">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://shift.app'}/dashboard" class="cta-button">
          View Your Dashboard
        </a>
      </div>
    </div>

    <div class="footer">
      <p>Keep making a difference, one action at a time!</p>
      <p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://shift.app'}/settings" class="unsubscribe">
          Manage email preferences
        </a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

// Generate plain text version
export function generateWeeklyReportText(data: WeeklyReportData): string {
  const { stats, report, weekStartDate, weekEndDate, userName } = data

  return `
Your Weekly Shift Report
========================

Hey${userName ? ` ${userName}` : ''}! Here's your sustainability impact this week.

${weekStartDate} - ${weekEndDate}

YOUR STATS
----------
Actions Completed: ${stats.actionsCompleted}
CO₂ Saved: ${stats.co2SavedKg.toFixed(1)}kg
Money Saved: $${stats.dollarsSaved.toFixed(0)}
Day Streak: ${stats.currentStreak}

WHAT WENT WELL
--------------
${report.whatWentWell}

PATTERNS WE NOTICED
-------------------
${report.patternObserved}

FOCUS THIS WEEK
---------------
${report.focusThisWeek}

---

View your dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'https://shift.app'}/dashboard

Keep making a difference, one action at a time!

Manage email preferences: ${process.env.NEXT_PUBLIC_APP_URL || 'https://shift.app'}/settings
  `.trim()
}

// Placeholder send function - implement with your email provider
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  // Example implementation with Resend:
  // const resend = new Resend(process.env.RESEND_API_KEY)
  // await resend.emails.send({
  //   from: 'Shift <noreply@shift.app>',
  //   to: options.to,
  //   subject: options.subject,
  //   html: options.html,
  //   text: options.text,
  // })

  console.log('[email] Would send email:', {
    to: options.to,
    subject: options.subject,
  })

  // Return true for now (no-op)
  return true
}

// Send weekly report email
export async function sendWeeklyReportEmail(
  email: string,
  data: WeeklyReportData
): Promise<boolean> {
  const html = generateWeeklyReportEmail(data)
  const text = generateWeeklyReportText(data)

  return sendEmail({
    to: email,
    subject: `Your Weekly Shift Report - ${data.stats.co2SavedKg.toFixed(1)}kg CO₂ saved!`,
    html,
    text,
  })
}
