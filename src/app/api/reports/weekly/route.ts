import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

interface MealRow {
  total_cal: number | null;
  protein_g: number | null;
  carb_g: number | null;
  fat_g: number | null;
  eaten_at: string;
}

interface ExerciseRow {
  minutes: number | null;
  kcal_burned: number | null;
}

interface MetricRow {
  metric_type: "weight" | "blood_pressure" | "blood_glucose";
  measured_at: string;
  weight_kg: number | null;
  systolic: number | null;
  diastolic: number | null;
  glucose_mg_dl: number | null;
}

export async function GET() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const since = new Date();
  since.setDate(since.getDate() - 6);
  since.setHours(0, 0, 0, 0);

  const [mealsRes, exercisesRes, metricsRes] = await Promise.all([
    supabase
      .from("meals")
      .select("total_cal, protein_g, carb_g, fat_g, eaten_at")
      .eq("user_id", user.id)
      .gte("eaten_at", since.toISOString()),
    supabase
      .from("exercises")
      .select("minutes, kcal_burned")
      .eq("user_id", user.id)
      .gte("performed_at", since.toISOString()),
    supabase
      .from("health_metrics")
      .select("metric_type, measured_at, weight_kg, systolic, diastolic, glucose_mg_dl")
      .eq("user_id", user.id)
      .gte("measured_at", since.toISOString())
      .order("measured_at", { ascending: false }),
  ]);

  if (mealsRes.error) return NextResponse.json({ error: mealsRes.error.message }, { status: 500 });
  if (exercisesRes.error) return NextResponse.json({ error: exercisesRes.error.message }, { status: 500 });
  if (metricsRes.error) return NextResponse.json({ error: metricsRes.error.message }, { status: 500 });

  const meals = (mealsRes.data ?? []) as MealRow[];
  const exercises = (exercisesRes.data ?? []) as ExerciseRow[];
  const metrics = (metricsRes.data ?? []) as MetricRow[];
  const days = new Set(meals.map((m) => m.eaten_at.substring(0, 10)));

  const totalCalories = sum(meals, (m) => m.total_cal);
  const totalProtein = sum(meals, (m) => m.protein_g);
  const totalCarb = sum(meals, (m) => m.carb_g);
  const totalFat = sum(meals, (m) => m.fat_g);
  const exerciseMinutes = sum(exercises, (e) => e.minutes);
  const exerciseCalories = sum(exercises, (e) => e.kcal_burned);

  const latestWeight = latest(metrics, "weight");
  const previousWeight = previous(metrics, "weight");
  const latestBloodPressure = latest(metrics, "blood_pressure");
  const latestBloodGlucose = latest(metrics, "blood_glucose");

  const tips = buildTips({
    mealDays: days.size,
    avgCalories: days.size ? Math.round(totalCalories / days.size) : 0,
    exerciseMinutes,
    latestBloodPressure,
    latestBloodGlucose,
  });
  const familySummary = buildFamilySummary({
    mealDays: days.size,
    mealsCount: meals.length,
    exerciseMinutes,
    latestBloodPressure,
    latestBloodGlucose,
  });

  return NextResponse.json({
    report: {
      range: {
        from: since.toISOString(),
        to: new Date().toISOString(),
      },
      meals: {
        days_logged: days.size,
        meals_count: meals.length,
        total_calories: totalCalories,
        avg_calories: days.size ? Math.round(totalCalories / days.size) : 0,
        protein_g: Math.round(totalProtein),
        carb_g: Math.round(totalCarb),
        fat_g: Math.round(totalFat),
      },
      exercise: {
        minutes: exerciseMinutes,
        kcal_burned: exerciseCalories,
      },
      health: {
        weight: latestWeight ? {
          latest: latestWeight.weight_kg,
          change: previousWeight?.weight_kg && latestWeight.weight_kg
            ? Number((latestWeight.weight_kg - previousWeight.weight_kg).toFixed(1))
            : null,
        } : null,
        blood_pressure: latestBloodPressure ? {
          systolic: latestBloodPressure.systolic,
          diastolic: latestBloodPressure.diastolic,
          status: getBloodPressureStatus(latestBloodPressure),
        } : null,
        blood_glucose: latestBloodGlucose ? {
          value: latestBloodGlucose.glucose_mg_dl,
          status: getGlucoseStatus(latestBloodGlucose),
        } : null,
      },
      tips,
      family_summary: familySummary,
    },
  });
}

function sum<T>(rows: T[], pick: (row: T) => number | null) {
  return rows.reduce((total, row) => total + Number(pick(row) || 0), 0);
}

function latest(rows: MetricRow[], type: MetricRow["metric_type"]) {
  return rows.find((m) => m.metric_type === type) ?? null;
}

function previous(rows: MetricRow[], type: MetricRow["metric_type"]) {
  return rows.filter((m) => m.metric_type === type)[1] ?? null;
}

function getBloodPressureStatus(metric: MetricRow) {
  if (!metric.systolic || !metric.diastolic) return "尚無足夠資料";
  if (metric.systolic >= 140 || metric.diastolic >= 90) return "偏高";
  if (metric.systolic < 90 || metric.diastolic < 60) return "偏低";
  return "穩定";
}

function getGlucoseStatus(metric: MetricRow) {
  if (!metric.glucose_mg_dl) return "尚無足夠資料";
  if (metric.glucose_mg_dl >= 180) return "偏高";
  if (metric.glucose_mg_dl < 70) return "偏低";
  return "穩定";
}

function buildTips(input: {
  mealDays: number;
  avgCalories: number;
  exerciseMinutes: number;
  latestBloodPressure: MetricRow | null;
  latestBloodGlucose: MetricRow | null;
}) {
  const tips: string[] = [];
  if (input.mealDays < 4) tips.push("這週記錄天數還不多，下週可以先從每天記早餐開始。");
  else tips.push("這週有穩定記錄飲食，暖暖會更懂您的習慣。");

  if (input.exerciseMinutes < 90) tips.push("下週可以把散步目標放在每次 10 分鐘，慢慢累積。");
  else tips.push("這週活動量不錯，記得運動後補水。");

  if (input.latestBloodPressure && getBloodPressureStatus(input.latestBloodPressure) === "偏高") {
    tips.push("最近血壓偏高，晚餐建議清淡一點，也記得按時量血壓。");
  }
  if (input.latestBloodGlucose && getGlucoseStatus(input.latestBloodGlucose) === "偏高") {
    tips.push("最近血糖偏高，點心可以先避開含糖飲料和甜食。");
  }
  if (tips.length < 3 && input.avgCalories > 0) tips.push(`這週平均每天約 ${input.avgCalories} 大卡，可以對照您的每日目標調整。`);
  return tips.slice(0, 3);
}

function buildFamilySummary(input: {
  mealDays: number;
  mealsCount: number;
  exerciseMinutes: number;
  latestBloodPressure: MetricRow | null;
  latestBloodGlucose: MetricRow | null;
}) {
  const summary: string[] = [];
  summary.push(input.mealDays >= 5
    ? `這週有 ${input.mealDays} 天有飲食記錄，習慣維持得不錯，家人可以給一點鼓勵。`
    : `這週只有 ${input.mealDays} 天有飲食記錄，家人可以先提醒「拍一張照片就好」，不用一次要求太多。`);

  summary.push(input.exerciseMinutes >= 90
    ? `本週運動累積 ${input.exerciseMinutes} 分鐘，活動量有維持，請提醒運動後補水與休息。`
    : `本週運動累積 ${input.exerciseMinutes} 分鐘，建議家人陪走 10 分鐘，比單純提醒更容易做到。`);

  const bpStatus = input.latestBloodPressure ? getBloodPressureStatus(input.latestBloodPressure) : "尚無足夠資料";
  const glucoseStatus = input.latestBloodGlucose ? getGlucoseStatus(input.latestBloodGlucose) : "尚無足夠資料";
  if (bpStatus === "偏高" || glucoseStatus === "偏高") {
    summary.push(`最近血壓狀態：${bpStatus}；血糖狀態：${glucoseStatus}。請協助留意是否有按時量測、按時用藥，若持續異常建議諮詢醫師。`);
  } else {
    summary.push(`最近血壓狀態：${bpStatus}；血糖狀態：${glucoseStatus}。目前沒有明顯警訊，持續記錄會讓判斷更準。`);
  }

  if (input.mealsCount === 0) {
    summary.push("這週還沒有餐點記錄，建議先協助設定常吃餐點，降低記錄門檻。");
  } else if (input.mealDays < 4) {
    summary.push("下週可先設定一個小目標：每天至少記一餐，讓長輩比較沒有壓力。");
  } else {
    summary.push("下週可以延續目前節奏，重點放在規律記錄與少鹽、少糖的小調整。");
  }
  return summary;
}
