/**
 * match-masters — Supabase Edge Function
 *
 * Finds and ranks top-5 masters for a project stage using Match Score algorithm.
 *
 * Score = 0.30×Specialization + 0.25×Availability + 0.15×Rating +
 *         0.10×Workload + 0.10×Price + 0.05×Experience + 0.05×Geography
 *
 * POST /match-masters
 * Body: {
 *   stageIndex: number,          // 0-13 stage template index
 *   projectId: string,           // Project ID for context
 *   startDate?: string,          // Preferred start date (YYYY-MM-DD)
 *   hoursNeeded?: number,        // Estimated hours for this stage
 *   maxBudget?: number,          // Max price per sqm/hour
 *   city?: string,               // Client city for geography match
 *   limit?: number,              // Max results (default 5)
 * }
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Specialization → stage index mapping (mirrors client-side specializations.ts)
const SPECIALIZATION_STAGES: Record<string, number[]> = {
  demolition: [0],
  electrician: [1, 6],
  plumber: [2, 7],
  screed: [3],
  plasterer: [4, 8],
  tiler: [5],
  flooring: [9],
  carpenter: [10],
  ceiling: [11],
  designer: [],
  furniture: [],
  hvac: [],
  windows: [],
  general: [0, 12],
  waste: [],
  cleaning: [13],
};

// Experience weight mapping
const EXPERIENCE_WEIGHT: Record<string, number> = {
  less_1: 0.2,
  '1_3': 0.4,
  '3_5': 0.6,
  '5_10': 0.8,
  more_10: 1.0,
};

interface MatchRequest {
  stageIndex: number;
  projectId: string;
  startDate?: string;
  hoursNeeded?: number;
  maxBudget?: number;
  city?: string;
  limit?: number;
}

interface MasterCandidate {
  id: string;
  name: string;
  avatar_url: string | null;
  specializations: string[];
  rating: number;
  reviews_count: number;
  experience: string;
  skill_level: string;
  is_verified: boolean;
  city: string | null;
  pricing: any[];
  match_score: number;
  score_breakdown: Record<string, number>;
  available_slots: number;
  workload_percent: number;
}

function getSpecializationsForStage(stageIndex: number): string[] {
  return Object.entries(SPECIALIZATION_STAGES)
    .filter(([, stages]) => stages.includes(stageIndex))
    .map(([id]) => id);
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: MatchRequest = await req.json();
    const { stageIndex, projectId, startDate, hoursNeeded = 8, maxBudget, city, limit = 5 } = body;

    if (stageIndex === undefined || stageIndex === null) {
      return new Response(
        JSON.stringify({ error: 'stageIndex is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get valid specializations for this stage
    const validSpecs = getSpecializationsForStage(stageIndex);
    if (validSpecs.length === 0) {
      return new Response(
        JSON.stringify({ masters: [], message: 'No specializations mapped to this stage' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Fetch all active masters with their profiles
    const { data: masters, error: mastersError } = await supabase
      .from('profiles')
      .select('id, name, avatar_url, city, role')
      .eq('role', 'master')
      .eq('is_active', true);

    if (mastersError) throw mastersError;
    if (!masters?.length) {
      return new Response(
        JSON.stringify({ masters: [], message: 'No active masters found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const masterIds = masters.map((m) => m.id);

    // Fetch master profiles (extended data)
    const { data: profiles } = await supabase
      .from('master_profiles')
      .select('*')
      .in('id', masterIds);

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

    // Fetch schedule availability for next 2 weeks
    const today = startDate || new Date().toISOString().split('T')[0];
    const twoWeeksOut = new Date(new Date(today).getTime() + 14 * 86400000)
      .toISOString()
      .split('T')[0];

    const { data: scheduleSlots } = await supabase
      .from('master_schedule')
      .select('master_id, status')
      .in('master_id', masterIds)
      .gte('date', today)
      .lte('date', twoWeeksOut);

    // Count available vs working slots per master
    const availabilityMap = new Map<string, { available: number; working: number; booked: number }>();
    for (const slot of scheduleSlots || []) {
      const entry = availabilityMap.get(slot.master_id) || { available: 0, working: 0, booked: 0 };
      if (slot.status === 'working') entry.working++;
      else if (slot.status === 'booked') entry.booked++;
      else entry.available++;
      availabilityMap.set(slot.master_id, entry);
    }

    // Fetch vacations to exclude unavailable masters
    const { data: vacations } = await supabase
      .from('master_vacations')
      .select('master_id, date_from, date_to')
      .in('master_id', masterIds)
      .lte('date_from', twoWeeksOut)
      .gte('date_to', today);

    const onVacation = new Set((vacations || []).map((v: any) => v.id));

    // Score each master
    const candidates: MasterCandidate[] = [];

    for (const master of masters) {
      if (onVacation.has(master.id)) continue;

      const profile = profileMap.get(master.id) as any;
      if (!profile) continue;

      const specs: string[] = profile.specializations || [];
      const rating: number = profile.rating || 0;
      const reviewsCount: number = profile.reviews_count || 0;
      const experience: string = profile.experience || 'less_1';
      const skillLevel: string = profile.skill_level || 'beginner';
      const pricing: any[] = profile.pricing ? (typeof profile.pricing === 'string' ? JSON.parse(profile.pricing) : profile.pricing) : [];

      // 1. Specialization score (0.30)
      const matchingSpecs = specs.filter((s: string) => validSpecs.includes(s));
      const specScore = matchingSpecs.length > 0 ? 1.0 : 0;

      // Skip masters with no matching specialization
      if (specScore === 0) continue;

      // 2. Availability score (0.25)
      const avail = availabilityMap.get(master.id) || { available: 0, working: 0, booked: 0 };
      const totalScheduled = avail.working + avail.booked;
      const freeSlots = avail.working > 0
        ? Math.max(0, avail.working - avail.booked)
        : 16 * 14 * 0.3; // Default: assume 30% availability if no schedule set
      const availScore = Math.min(1.0, freeSlots / Math.max(hoursNeeded, 1));

      // 3. Rating score (0.15)
      const ratingScore = rating > 0 ? rating / 5.0 : 0.5; // Default 0.5 if no rating

      // 4. Workload score (0.10) — lower workload = higher score
      const maxSlots = 16 * 14; // 2 weeks × 16 hours
      const workloadPercent = totalScheduled > 0 ? (avail.booked / totalScheduled) : 0;
      const workloadScore = 1.0 - workloadPercent;

      // 5. Price score (0.10) — lower price = higher score
      let priceScore = 0.5;
      if (maxBudget && pricing.length > 0) {
        const relevantPricing = pricing.filter((p: any) =>
          matchingSpecs.includes(p.specialization)
        );
        if (relevantPricing.length > 0) {
          const avgPrice = relevantPricing.reduce((sum: number, p: any) => sum + (p.price || 0), 0) / relevantPricing.length;
          priceScore = avgPrice <= maxBudget ? Math.max(0.3, 1.0 - (avgPrice / maxBudget) * 0.5) : 0.1;
        }
      }

      // 6. Experience score (0.05)
      const expScore = EXPERIENCE_WEIGHT[experience] || 0.5;

      // 7. Geography score (0.05)
      const geoScore = city && master.city
        ? (master.city.toLowerCase() === city.toLowerCase() ? 1.0 : 0.3)
        : 0.5;

      // Calculate final score
      const matchScore =
        0.30 * specScore +
        0.25 * availScore +
        0.15 * ratingScore +
        0.10 * workloadScore +
        0.10 * priceScore +
        0.05 * expScore +
        0.05 * geoScore;

      candidates.push({
        id: master.id,
        name: master.name,
        avatar_url: master.avatar_url,
        specializations: specs,
        rating,
        reviews_count: reviewsCount,
        experience,
        skill_level: skillLevel,
        is_verified: profile.is_verified || false,
        city: master.city,
        pricing,
        match_score: Math.round(matchScore * 100),
        score_breakdown: {
          specialization: Math.round(specScore * 100),
          availability: Math.round(availScore * 100),
          rating: Math.round(ratingScore * 100),
          workload: Math.round(workloadScore * 100),
          price: Math.round(priceScore * 100),
          experience: Math.round(expScore * 100),
          geography: Math.round(geoScore * 100),
        },
        available_slots: freeSlots,
        workload_percent: Math.round(workloadPercent * 100),
      });
    }

    // Sort by score descending, take top N
    candidates.sort((a, b) => b.match_score - a.match_score);
    const topCandidates = candidates.slice(0, limit);

    return new Response(
      JSON.stringify({
        masters: topCandidates,
        total_candidates: candidates.length,
        stage_index: stageIndex,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('match-masters error:', err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
