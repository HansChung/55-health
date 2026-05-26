-- 語音對談配額調整：先用保守額度控制 OpenAI Realtime 成本
update subscription_plans
set ai_voice_minutes = case id
  when 'free' then 2
  when 'basic' then 10
  when 'pro' then 30
  else ai_voice_minutes
end
where id in ('free', 'basic', 'pro');
