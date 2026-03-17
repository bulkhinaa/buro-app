/**
 * send-email — Supabase Edge Function
 *
 * Sends transactional emails via Resend API.
 * Used for notifications, invitations, and system alerts.
 *
 * POST /send-email
 * Body: {
 *   to: string,                    // Recipient email
 *   type: EmailType,               // Template type
 *   data?: Record<string, string>, // Template variables
 * }
 *
 * Alternative: send to user by ID (looks up email from profiles):
 * Body: {
 *   userId: string,
 *   type: EmailType,
 *   data?: Record<string, string>,
 * }
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const RESEND_API_URL = 'https://api.resend.com/emails';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type EmailType =
  | 'stage_status_changed'
  | 'new_message'
  | 'master_assigned'
  | 'project_created'
  | 'master_offer'
  | 'invite';

interface EmailRequest {
  to?: string;
  userId?: string;
  type: EmailType;
  data?: Record<string, string>;
}

// Brand colors
const PRIMARY = '#7B2D3E';
const BG = '#F3EDE8';
const TEXT_COLOR = '#333333';
const TEXT_LIGHT = '#888888';

function baseLayout(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="ru">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:${BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
<tr><td align="center">
<table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(123,45,62,0.08);">
  <tr><td style="background:${PRIMARY};padding:24px 32px;">
    <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">Бюро ремонтов</h1>
  </td></tr>
  <tr><td style="padding:32px;">
    <h2 style="margin:0 0 16px;color:${PRIMARY};font-size:18px;font-weight:700;">${title}</h2>
    ${content}
  </td></tr>
  <tr><td style="padding:16px 32px;background:#f9f7f4;border-top:1px solid #eee;">
    <p style="margin:0;font-size:12px;color:${TEXT_LIGHT};text-align:center;">
      Вы получили это письмо, потому что зарегистрированы на платформе «Бюро ремонтов».
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

function getEmailContent(type: EmailType, data: Record<string, string> = {}): { subject: string; html: string } {
  switch (type) {
    case 'stage_status_changed':
      return {
        subject: `Этап «${data.stage_name || 'этап'}» — ${data.new_status || 'обновление'}`,
        html: baseLayout('Статус этапа изменён', `
          <p style="color:${TEXT_COLOR};font-size:15px;line-height:1.6;">
            Этап <strong>«${data.stage_name || '—'}»</strong> в проекте
            <strong>«${data.project_name || '—'}»</strong> изменил статус:
          </p>
          <div style="background:${BG};border-radius:12px;padding:16px;margin:16px 0;text-align:center;">
            <span style="font-size:14px;color:${TEXT_LIGHT};">${data.old_status || ''} →</span>
            <span style="font-size:16px;font-weight:700;color:${PRIMARY};"> ${data.new_status || ''}</span>
          </div>
          <p style="color:${TEXT_LIGHT};font-size:13px;">Откройте приложение для подробностей.</p>
        `),
      };

    case 'new_message':
      return {
        subject: `Новое сообщение от ${data.sender_name || 'участника'}`,
        html: baseLayout('Новое сообщение', `
          <p style="color:${TEXT_COLOR};font-size:15px;line-height:1.6;">
            <strong>${data.sender_name || 'Участник'}</strong> написал в чате проекта
            <strong>«${data.project_name || '—'}»</strong>:
          </p>
          <div style="background:${BG};border-radius:12px;padding:16px;margin:16px 0;">
            <p style="margin:0;color:${TEXT_COLOR};font-size:14px;font-style:italic;">
              «${(data.message_preview || '').substring(0, 200)}»
            </p>
          </div>
          <p style="color:${TEXT_LIGHT};font-size:13px;">Откройте приложение, чтобы ответить.</p>
        `),
      };

    case 'master_assigned':
      return {
        subject: `Вам назначен мастер на этап «${data.stage_name || ''}»`,
        html: baseLayout('Мастер назначен', `
          <p style="color:${TEXT_COLOR};font-size:15px;line-height:1.6;">
            На этап <strong>«${data.stage_name || '—'}»</strong> проекта
            <strong>«${data.project_name || '—'}»</strong> назначен мастер:
          </p>
          <div style="background:${BG};border-radius:12px;padding:16px;margin:16px 0;text-align:center;">
            <p style="margin:0;font-size:16px;font-weight:700;color:${PRIMARY};">${data.master_name || '—'}</p>
            <p style="margin:4px 0 0;font-size:13px;color:${TEXT_LIGHT};">${data.specialization || ''}</p>
          </div>
        `),
      };

    case 'project_created':
      return {
        subject: `Проект «${data.project_name || ''}» создан`,
        html: baseLayout('Новый проект', `
          <p style="color:${TEXT_COLOR};font-size:15px;line-height:1.6;">
            Ваш проект <strong>«${data.project_name || '—'}»</strong> успешно создан.
          </p>
          <p style="color:${TEXT_COLOR};font-size:14px;">
            Адрес: ${data.address || '—'}<br/>
            Тип ремонта: ${data.repair_type || '—'}
          </p>
          <p style="color:${TEXT_LIGHT};font-size:13px;">Супервайзер будет назначен в ближайшее время.</p>
        `),
      };

    case 'master_offer':
      return {
        subject: `Новое предложение работы — ${data.stage_name || 'этап'}`,
        html: baseLayout('Предложение работы', `
          <p style="color:${TEXT_COLOR};font-size:15px;line-height:1.6;">
            Вам предложена работа на этапе <strong>«${data.stage_name || '—'}»</strong>
            проекта <strong>«${data.project_name || '—'}»</strong>.
          </p>
          <div style="background:${BG};border-radius:12px;padding:16px;margin:16px 0;">
            <p style="margin:0;font-size:14px;color:${TEXT_COLOR};">
              📍 ${data.address || '—'}<br/>
              📅 Срок: ${data.deadline || '—'}
            </p>
          </div>
          <p style="color:${PRIMARY};font-size:14px;font-weight:600;">
            Откройте приложение, чтобы принять или отклонить предложение.
          </p>
        `),
      };

    case 'invite':
      return {
        subject: 'Приглашение на платформу «Бюро ремонтов»',
        html: baseLayout('Вас пригласили!', `
          <p style="color:${TEXT_COLOR};font-size:15px;line-height:1.6;">
            <strong>${data.supervisor_name || 'Супервайзер'}</strong> приглашает вас
            присоединиться к платформе «Бюро ремонтов» в качестве мастера.
          </p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${data.invite_url || '#'}"
               style="display:inline-block;background:${PRIMARY};color:#ffffff;
                      padding:14px 32px;border-radius:24px;text-decoration:none;
                      font-size:15px;font-weight:600;">
              Присоединиться
            </a>
          </div>
          <p style="color:${TEXT_LIGHT};font-size:12px;text-align:center;">
            Ссылка действительна 30 дней.
          </p>
        `),
      };

    default:
      return {
        subject: 'Уведомление от «Бюро ремонтов»',
        html: baseLayout('Уведомление', `
          <p style="color:${TEXT_COLOR};font-size:15px;">У вас новое уведомление. Откройте приложение для подробностей.</p>
        `),
      };
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { to, userId, type, data }: EmailRequest = await req.json();

    if (!type) {
      return new Response(
        JSON.stringify({ error: 'type is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    let recipientEmail = to;

    // If userId provided, look up email from profiles
    if (!recipientEmail && userId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();

      recipientEmail = profile?.email;
    }

    if (!recipientEmail) {
      return new Response(
        JSON.stringify({ sent: false, reason: 'No email address found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { subject, html } = getEmailContent(type, data || {});

    // Send via Resend API
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'Бюро ремонтов <onboarding@resend.dev>',
        to: recipientEmail,
        subject,
        html,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Resend API error:', result);
      return new Response(
        JSON.stringify({ sent: false, error: result }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ sent: true, id: result.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );

  } catch (err) {
    console.error('send-email error:', err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
