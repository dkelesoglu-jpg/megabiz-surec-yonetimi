import { getDb } from "../../../db";
import { accessError, getCompanyId, requireAccess, requireModuleAccess, writeAudit, type Access } from "../../../db/authorization";
import { availableOverallScore, goalResult, goalRisk, metricScore, monthsBetween, performanceClass, validateWeights, weightedAverage, smartAssessment } from "../../../db/performance-calculations";
import { camelizeKeys } from "../../../db/case";

const adminRoles = ["super_admin", "company_admin", "hr"];

export async function GET(request: Request) {
  try {
    const companyId = getCompanyId(request), access = await requireAccess(request, companyId);
    await requireModuleAccess(access, "Performans");
    const db = getDb();
    const [cycleRes, assignRes, metricRes, compRes, feedRes, actionRes, peopleRes, settingsRes] = await Promise.all([
      db.from("performance_cycles").select("*").eq("company_id", companyId).order("start_date", { ascending: true }),
      db.from("performance_assignments").select("*").eq("company_id", companyId),
      db.from("performance_metrics").select("*").eq("company_id", companyId),
      db.from("performance_competencies").select("*").eq("company_id", companyId),
      db.from("performance_feedback").select("*").eq("company_id", companyId),
      db.from("performance_actions").select("*").eq("company_id", companyId),
      db.from("employees").select("*").eq("company_id", companyId),
      db.from("performance_settings").select("*").eq("company_id", companyId),
    ]);
    const cycles = camelizeKeys(cycleRes.data ?? []);
    let loadedAssignments = camelizeKeys(assignRes.data ?? []);
    const metrics = camelizeKeys(metricRes.data ?? []),
      competencies = camelizeKeys(compRes.data ?? []),
      feedback = camelizeKeys(feedRes.data ?? []),
      actions = camelizeKeys(actionRes.data ?? []),
      people = camelizeKeys(peopleRes.data ?? []),
      settingsRows = camelizeKeys(settingsRes.data ?? []);

    const incorrect = loadedAssignments.filter((a) => a.overallScore <= 10 && Math.max(a.goalScore, a.kpiScore, a.competencyScore, a.managerScore, a.selfScore, a.feedback360Score) > 10);
    for (const a of incorrect) await recalculate(companyId, a.id);
    let allAssignments = loadedAssignments;
    if (incorrect.length) {
      const { data } = await db.from("performance_assignments").select("*").eq("company_id", companyId);
      allAssignments = camelizeKeys(data ?? []);
    }
    const email = access.email.toLocaleLowerCase("tr"), name = (access.fullName || "").toLocaleLowerCase("tr"),
      allowed = new Set(
        people
          .filter((p) => !["employee", "manager"].includes(access.role) || p.email?.toLocaleLowerCase("tr") === email || (access.role === "manager" && [email, name].includes((p.manager || "").toLocaleLowerCase("tr"))))
          .map((p) => p.id),
      ),
      assignments = allAssignments.filter((a) => allowed.has(a.employeeId)),
      ids = new Set(assignments.map((a) => a.id));
    return Response.json({
      cycles,
      assignments,
      metrics: metrics.filter((x) => !x.assignmentId || ids.has(x.assignmentId)),
      competencies: competencies.filter((x) => !x.assignmentId || ids.has(x.assignmentId)),
      feedback: feedback.filter((x) => ids.has(x.assignmentId)).map((x) => (access.role === "employee" && x.anonymous ? { ...x, reviewerEmail: "Anonim" } : x)),
      actions: actions.filter((x) => ids.has(x.assignmentId)),
      employees: people.filter((x) => allowed.has(x.id) && isActiveEmployee(x.status)),
      settings: settingsRows[0] || null,
      role: access.role,
    });
  } catch (e) { return accessError(e); }
}

export async function POST(request: Request) {
  try {
    const companyId = getCompanyId(request), access = await requireAccess(request, companyId, true);
    await requireModuleAccess(access, "Performans", true);
    const p = await request.json() as Record<string, unknown>, action = String(p.action || "cycle"), db = getDb(), now = new Date().toISOString();

    if (action === "settings") {
      assertAdmin(access.role);
      const weights = weightsOf(p);
      if (!validateWeights(weights)) return Response.json({ error: "Varsayılan ağırlık toplamı %100 olmalıdır" }, { status: 400 });
      const scale = Array.isArray(p.performanceScale) ? p.performanceScale : [];
      if (scale.length !== 5 || scale.some((x: unknown) => typeof x !== "object" || x === null)) return Response.json({ error: "A–E performans skalası eksiksiz olmalıdır" }, { status: 400 });
      const values = {
        company_id: companyId,
        goal_weight: weights.goalWeight, kpi_weight: weights.kpiWeight, competency_weight: weights.competencyWeight,
        manager_weight: weights.managerWeight, self_weight: weights.selfWeight, feedback_360_weight: weights.feedback360Weight,
        reminder_days: String(p.reminderDays || "30,15,7,0"),
        goal_score_cap: Math.max(100, Math.min(200, Number(p.goalScoreCap || 120))),
        goal_approval_enabled: Boolean(p.goalApprovalEnabled),
        performance_scale: JSON.stringify(scale),
        updated_by: access.email, updated_at: now,
      };
      const { data: inserted, error: insertError } = await db.from("performance_settings").insert(values).select().single();
      let row = inserted;
      if (insertError) {
        const { company_id, ...updateFields } = values;
        const { data: updated, error: updateError } = await db.from("performance_settings").update(updateFields).eq("company_id", companyId).select().single();
        if (updateError) throw new Error(updateError.message);
        row = updated;
      }
      await writeAudit(access, "UPDATE", "performance_settings", null, null, row);
      return Response.json({ settings: camelizeKeys(row) });
    }

    if (action === "cycle") {
      assertAdmin(access.role);
      const weights = weightsOf(p);
      if (!validateWeights(weights)) return Response.json({ error: "Değerlendirme ağırlıkları toplamı %100 olmalıdır" }, { status: 400 });
      const [cname, startDate, endDate, reviewStartDate, reviewEndDate] = [p.name, p.startDate, p.endDate, p.reviewStartDate, p.reviewEndDate].map((x) => String(x || ""));
      if (!cname || !startDate || !endDate || !reviewStartDate || !reviewEndDate) return Response.json({ error: "Dönem adı ve tarihler zorunludur" }, { status: 400 });
      const { data: row, error } = await db
        .from("performance_cycles")
        .insert({
          company_id: companyId, name: cname, cycle_type: String(p.cycleType || "Yıllık"), start_date: startDate, end_date: endDate,
          review_start_date: reviewStartDate, review_end_date: reviewEndDate, departments: JSON.stringify(p.departments || []),
          min_tenure_months: Number(p.minTenureMonths || 0),
          goal_weight: weights.goalWeight, kpi_weight: weights.kpiWeight, competency_weight: weights.competencyWeight,
          manager_weight: weights.managerWeight, self_weight: weights.selfWeight, feedback_360_weight: weights.feedback360Weight,
          reminder_days: String(p.reminderDays || "10,5,3,0"), status: String(p.status || "Aktif"), created_by: access.email, created_at: now, updated_at: now,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      const departments = Array.isArray(p.departments) ? p.departments.map(String) : [];
      const { data: peopleData } = await db.from("employees").select("*").eq("company_id", companyId);
      const eligiblePeople = camelizeKeys(peopleData ?? []);
      const eligible = eligiblePeople.filter((e) => e.status === "Aktif" && monthsBetween(e.startDate, startDate) >= Number(p.minTenureMonths || 0) && (!departments.length || departments.includes(e.department)));
      for (const e of eligible) {
        const { data: a, error: assignError } = await db
          .from("performance_assignments")
          .insert({
            company_id: companyId, cycle_id: row.id, employee_id: e.id, employee_name: `${e.firstName} ${e.lastName}`,
            department_snapshot: e.department, position_snapshot: e.position, manager_snapshot: e.manager || "", created_at: now, updated_at: now,
          })
          .select()
          .single();
        if (!assignError && a && Boolean(p.seedTemplates ?? true)) await seedTemplates(companyId, row.id, a.id, e.department, e.position, now);
      }
      await writeAudit(access, "CREATE", "performance_cycle", row.id, null, { ...row, assigned: eligible.length });
      return Response.json({ cycle: camelizeKeys(row), assigned: eligible.length }, { status: 201 });
    }

    if (action === "assignEmployee") {
      assertAdmin(access.role);
      const cycleId = Number(p.cycleId), employeeId = Number(p.employeeId);
      const { data: cycle } = await db.from("performance_cycles").select("*").eq("id", cycleId).eq("company_id", companyId).maybeSingle();
      const { data: employeeRaw } = await db.from("employees").select("*").eq("id", employeeId).eq("company_id", companyId).maybeSingle();
      if (!cycle || !employeeRaw) return Response.json({ error: "Dönem veya çalışan bulunamadı" }, { status: 404 });
      const employee = camelizeKeys(employeeRaw);
      const { data: existing } = await db.from("performance_assignments").select("*").eq("cycle_id", cycleId).eq("employee_id", employeeId).maybeSingle();
      if (existing) {
        const { data: row, error } = await db.from("performance_assignments").update({ status: "Başlamadı", locked: false, updated_at: now }).eq("id", existing.id).select().single();
        if (error) throw new Error(error.message);
        await writeAudit(access, "PERFORMANCE_INCLUDE", "performance_assignment", row.id, existing, row);
        return Response.json({ assignment: camelizeKeys(row) });
      }
      const { data: row, error } = await db
        .from("performance_assignments")
        .insert({
          company_id: companyId, cycle_id: cycleId, employee_id: employeeId, employee_name: `${employee.firstName} ${employee.lastName}`,
          department_snapshot: employee.department, position_snapshot: employee.position, manager_snapshot: employee.manager || "", created_at: now, updated_at: now,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      await seedTemplates(companyId, cycleId, row.id, employee.department, employee.position, now);
      await writeAudit(access, "PERFORMANCE_INCLUDE", "performance_assignment", row.id, null, row);
      return Response.json({ assignment: camelizeKeys(row) }, { status: 201 });
    }

    if (action === "excludeEmployee") {
      assertAdmin(access.role);
      const assignmentId = Number(p.assignmentId);
      const { data: old } = await db.from("performance_assignments").select("*").eq("id", assignmentId).eq("company_id", companyId).maybeSingle();
      if (!old) return Response.json({ error: "Değerlendirme kaydı bulunamadı" }, { status: 404 });
      if (old.locked) return Response.json({ error: "Tamamlanmış değerlendirme kapsam dışına çıkarılamaz" }, { status: 409 });
      const { data: row, error } = await db.from("performance_assignments").update({ status: "Kapsam Dışı", updated_at: now }).eq("id", assignmentId).select().single();
      if (error) throw new Error(error.message);
      await writeAudit(access, "PERFORMANCE_EXCLUDE", "performance_assignment", assignmentId, old, row);
      return Response.json({ assignment: camelizeKeys(row) });
    }

    if (action === "metric") {
      assertManager(access.role);
      let assignmentId = Number(p.assignmentId);
      if (!assignmentId && p.employeeId) {
        const employeeId = Number(p.employeeId);
        const { data: employeeRaw } = await db.from("employees").select("*").eq("id", employeeId).eq("company_id", companyId).maybeSingle();
        const { data: cycleRaw } = await db.from("performance_cycles").select("*").eq("id", Number(p.cycleId)).eq("company_id", companyId).eq("status", "Aktif").maybeSingle();
        const employee = camelizeKeys(employeeRaw);
        if (!employeeRaw || !isActiveEmployee(employee.status)) return Response.json({ error: "Aktif şirket sicil kartlarında çalışan bulunamadı" }, { status: 404 });
        if (!cycleRaw) return Response.json({ error: "Hedef atamak için aktif performans dönemi bulunamadı" }, { status: 409 });
        const { data: existing } = await db.from("performance_assignments").select("*").eq("company_id", companyId).eq("cycle_id", cycleRaw.id).eq("employee_id", employee.id).maybeSingle();
        if (existing) assignmentId = existing.id;
        else {
          const { data: created, error: createError } = await db
            .from("performance_assignments")
            .insert({
              company_id: companyId, cycle_id: cycleRaw.id, employee_id: employee.id, employee_name: `${employee.firstName} ${employee.lastName}`,
              department_snapshot: employee.department, position_snapshot: employee.position, manager_snapshot: employee.manager || "", status: "Başlamadı", created_at: now, updated_at: now,
            })
            .select()
            .single();
          if (createError) throw new Error(createError.message);
          assignmentId = created.id;
        }
      }
      const smart = smartAssessment({ name: String(p.name || ""), description: String(p.description || ""), targetValue: Number(p.targetValue || 0), unit: String(p.unit || "%"), startDate: String(p.startDate || ""), endDate: String(p.endDate || "") });
      if (String(p.metricType || "Hedef") === "Hedef" && !smart.valid) return Response.json({ error: smart.message, smart }, { status: 400 });
      const target = Number(p.targetValue || 0), actual = Number(p.actualValue || 0), direction = String(p.direction || "Yüksek değer iyi"), weight = Number(p.weight || 0), metricType = String(p.metricType || "Hedef");
      const { data: settingsRaw } = await db.from("performance_settings").select("*").eq("company_id", companyId).maybeSingle();
      const settings = camelizeKeys(settingsRaw);
      const goal = goalResult(direction, target, actual, weight, settings?.goalScoreCap || 120),
        risk = goalRisk(String(p.startDate || ""), String(p.endDate || ""), goal.rawProgress),
        score = metricType === "Hedef" ? goal.score : metricScore(direction, target, actual, Number(p.minimumValue || 0), Number(p.maximumValue || 0));
      if (metricType === "Hedef") {
        const { data: existingRaw } = await db.from("performance_metrics").select("*").eq("company_id", companyId).eq("assignment_id", assignmentId).eq("metric_type", "Hedef");
        const existing = camelizeKeys(existingRaw ?? []);
        const total = existing.reduce((sum, x) => sum + x.weight, 0) + weight;
        if (total > 100) return Response.json({ error: `Çalışanın dönem hedef ağırlığı %${total}; toplam %100ü aşamaz.` }, { status: 400 });
      }
      const { data: row, error } = await db
        .from("performance_metrics")
        .insert({
          company_id: companyId, cycle_id: p.cycleId ? Number(p.cycleId) : null, assignment_id: assignmentId || null,
          metric_type: metricType, goal_type: String(p.goalType || "Bireysel Hedef"), source_type: String(p.sourceType || "Bireysel"),
          name: String(p.name), code: String(p.code || ""), description: String(p.description || ""), department: String(p.department || ""), position: String(p.position || ""),
          unit: String(p.unit || "%"), direction, start_value: Number(p.startValue || 0), target_value: target, actual_value: actual,
          minimum_value: p.minimumValue ? Number(p.minimumValue) : null, maximum_value: p.maximumValue ? Number(p.maximumValue) : null, weight,
          raw_progress: metricType === "Hedef" ? goal.rawProgress : score,
          weighted_contribution: metricType === "Hedef" ? goal.weightedContribution : Math.round((score * weight) / 100),
          risk_level: metricType === "Hedef" ? risk.riskLevel : "Normal", checkpoint_data: "[]", priority: String(p.priority || "Orta"),
          data_source: String(p.dataSource || "Manuel"), frequency: String(p.frequency || ""), approver: String(p.approver || ""),
          start_date: String(p.startDate || ""), end_date: String(p.endDate || ""), score, status: String(p.status || (metricType === "Hedef" ? risk.status : "Aktif")),
          created_at: now, updated_at: now,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      if (assignmentId) await recalculate(companyId, assignmentId);
      await writeAudit(access, "CREATE", "performance_metric", row.id, null, row);
      return Response.json({ metric: camelizeKeys(row) }, { status: 201 });
    }

    if (action === "goalCopy" || action === "goalCarry") {
      assertManager(access.role);
      const { data: sourceRaw } = await db.from("performance_metrics").select("*").eq("id", Number(p.sourceMetricId)).eq("company_id", companyId).eq("metric_type", "Hedef").maybeSingle();
      const source = camelizeKeys(sourceRaw);
      if (!source?.assignmentId) return Response.json({ error: "Kaynak hedef bulunamadı" }, { status: 404 });
      await assertAssignmentScope(companyId, source.assignmentId, access);
      const { data: targetCycle } = await db.from("performance_cycles").select("*").eq("id", Number(p.targetCycleId)).eq("company_id", companyId).maybeSingle();
      if (!targetCycle) return Response.json({ error: "Hedef dönem bulunamadı" }, { status: 404 });
      const { data: sourceAssignmentRaw } = await db.from("performance_assignments").select("*").eq("id", source.assignmentId).eq("company_id", companyId).maybeSingle();
      const sourceAssignment = camelizeKeys(sourceAssignmentRaw);
      const employeeIds = action === "goalCarry" ? [sourceAssignment.employeeId] : Array.isArray(p.employeeIds) ? p.employeeIds.map(Number) : [];
      if (!employeeIds.length) return Response.json({ error: "En az bir çalışan seçmelisiniz" }, { status: 400 });
      let created = 0;
      for (const employeeId of employeeIds) {
        const { data: employeeRaw } = await db.from("employees").select("*").eq("id", employeeId).eq("company_id", companyId).eq("status", "Aktif").maybeSingle();
        if (!employeeRaw) continue;
        const employee = camelizeKeys(employeeRaw);
        let { data: assignmentRaw } = await db.from("performance_assignments").select("*").eq("company_id", companyId).eq("cycle_id", targetCycle.id).eq("employee_id", employee.id).maybeSingle();
        if (!assignmentRaw) {
          const { data: createdAssignment, error: createAssignError } = await db
            .from("performance_assignments")
            .insert({
              company_id: companyId, cycle_id: targetCycle.id, employee_id: employee.id, employee_name: `${employee.firstName} ${employee.lastName}`,
              department_snapshot: employee.department, position_snapshot: employee.position, manager_snapshot: employee.manager || "", status: "Başlamadı", created_at: now, updated_at: now,
            })
            .select()
            .single();
          if (createAssignError) throw new Error(createAssignError.message);
          assignmentRaw = createdAssignment;
        }
        const assignment = camelizeKeys(assignmentRaw);
        const { data: existingGoalsRaw } = await db.from("performance_metrics").select("*").eq("company_id", companyId).eq("assignment_id", assignment.id).eq("metric_type", "Hedef");
        const existingGoals = camelizeKeys(existingGoalsRaw ?? []);
        if (existingGoals.reduce((sum, x) => sum + x.weight, 0) + source.weight > 100) return Response.json({ error: `${employee.firstName} ${employee.lastName} için hedef ağırlığı %100ü aşıyor` }, { status: 409 });
        const { data: row, error } = await db
          .from("performance_metrics")
          .insert({
            company_id: companyId, cycle_id: targetCycle.id, assignment_id: assignment.id, metric_type: "Hedef", goal_type: source.goalType, source_type: source.sourceType,
            name: source.name, code: source.code, description: source.description, department: employee.department, position: employee.position, unit: source.unit,
            direction: source.direction, start_value: source.startValue, target_value: source.targetValue, actual_value: 0, minimum_value: source.minimumValue, maximum_value: source.maximumValue,
            weight: source.weight, raw_progress: 0, weighted_contribution: 0, risk_level: "Normal", checkpoint_data: "[]",
            parent_metric_id: action === "goalCopy" ? source.id : null, carried_from_metric_id: action === "goalCarry" ? source.id : null,
            priority: source.priority, data_source: source.dataSource, frequency: source.frequency, approver: source.approver,
            start_date: targetCycle.start_date, end_date: targetCycle.end_date, score: 0, status: "Taslak", created_at: now, updated_at: now,
          })
          .select()
          .single();
        if (error) throw new Error(error.message);
        await recalculate(companyId, assignment.id);
        await writeAudit(access, action === "goalCopy" ? "GOAL_COPY" : "GOAL_CARRY", "performance_metric", row.id, sourceRaw, row);
        created++;
      }
      return Response.json({ created }, { status: 201 });
    }

    if (action === "competency") {
      assertManager(access.role);
      const { data: row, error } = await db
        .from("performance_competencies")
        .insert({
          company_id: companyId, assignment_id: p.assignmentId ? Number(p.assignmentId) : null, name: String(p.name), category: String(p.category || "Temel Yetkinlik"),
          position: String(p.position || ""), description: String(p.description || ""), weight: Number(p.weight || 0), self_score: Number(p.selfScore || 0),
          manager_score: Number(p.managerScore || 0), final_score: Math.round((Number(p.selfScore || 0) + Number(p.managerScore || 0)) / 2), created_at: now, updated_at: now,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      if (row.assignment_id) await recalculate(companyId, row.assignment_id);
      await writeAudit(access, "CREATE", "performance_competency", row.id, null, row);
      return Response.json({ competency: camelizeKeys(row) }, { status: 201 });
    }

    if (action === "feedback") {
      const assignmentId = Number(p.assignmentId);
      await assertAssignmentScope(companyId, assignmentId, access);
      const reviewerType = String(p.reviewerType || "Öz Değerlendirme");
      if (access.role === "employee" && reviewerType !== "Öz Değerlendirme") throw new Error("PERFORMANCE_ACCESS_DENIED");
      const { data: row, error } = await db
        .from("performance_feedback")
        .insert({
          company_id: companyId, assignment_id: assignmentId, reviewer_email: access.email, reviewer_type: reviewerType, score: Number(p.score || 0),
          strengths: String(p.strengths || ""), development_areas: String(p.developmentAreas || ""), comment: String(p.comment || ""),
          anonymous: Boolean(p.anonymous), status: String(p.status || "Taslak"), created_at: now, updated_at: now,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      await recalculate(companyId, assignmentId);
      await writeAudit(access, "CREATE", "performance_feedback", row.id, null, row);
      return Response.json({ feedback: camelizeKeys(row) }, { status: 201 });
    }

    if (action === "performanceAction") {
      assertManager(access.role);
      const { data: row, error } = await db
        .from("performance_actions")
        .insert({
          company_id: companyId, assignment_id: Number(p.assignmentId), action_type: String(p.actionType), title: String(p.title),
          description: String(p.description || ""), owner: String(p.owner || ""), start_date: String(p.startDate || ""), target_date: String(p.targetDate || ""),
          check_dates: String(p.checkDates || ""), employee_comment: String(p.employeeComment || ""), manager_comment: String(p.managerComment || ""),
          reason: String(p.reason || ""), status: String(p.status || "Taslak"), created_by: access.email, created_at: now, updated_at: now,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      await writeAudit(access, "CREATE", "performance_action", row.id, null, row);
      return Response.json({ performanceAction: camelizeKeys(row) }, { status: 201 });
    }
    return Response.json({ error: "Geçersiz işlem" }, { status: 400 });
  } catch (e) { return accessError(e); }
}

export async function PUT(request: Request) {
  try {
    const companyId = getCompanyId(request), access = await requireAccess(request, companyId, true);
    await requireModuleAccess(access, "Performans", true);
    const p = await request.json() as Record<string, unknown>, action = String(p.action), assignmentId = Number(p.assignmentId), db = getDb(), now = new Date().toISOString();

    if (action === "updateMetric") {
      assertManager(access.role);
      const { data: oldRaw } = await db.from("performance_metrics").select("*").eq("id", Number(p.id)).eq("company_id", companyId).maybeSingle();
      const oldMetric = camelizeKeys(oldRaw);
      if (!oldMetric?.assignmentId) return Response.json({ error: "Hedef/KPI bulunamadı" }, { status: 404 });
      await assertAssignmentScope(companyId, oldMetric.assignmentId, access);
      const target = Number(p.targetValue ?? oldMetric.targetValue), actual = Number(p.actualValue ?? oldMetric.actualValue), direction = String(p.direction || oldMetric.direction);
      const { data: settingsRaw } = await db.from("performance_settings").select("*").eq("company_id", companyId).maybeSingle();
      const settings = camelizeKeys(settingsRaw);
      const goal = goalResult(direction, target, actual, oldMetric.weight, settings?.goalScoreCap || 120),
        risk = goalRisk(oldMetric.startDate || "", oldMetric.endDate || "", goal.rawProgress),
        checkpoints = (() => { try { return JSON.parse(oldMetric.checkpointData || "[]") as unknown[]; } catch { return []; } })(),
        checkpoint = p.checkpoint && typeof p.checkpoint === "object" ? { ...(p.checkpoint as Record<string, unknown>), actualValue: actual, createdBy: access.email, createdAt: now } : null;
      const { data: row, error } = await db
        .from("performance_metrics")
        .update({
          target_value: target, actual_value: actual, direction,
          score: oldMetric.metricType === "Hedef" ? goal.score : metricScore(direction, target, actual, Number(oldMetric.minimumValue || 0), Number(oldMetric.maximumValue || 0)),
          raw_progress: oldMetric.metricType === "Hedef" ? goal.rawProgress : goal.score,
          weighted_contribution: oldMetric.metricType === "Hedef" ? goal.weightedContribution : Math.round((goal.score * oldMetric.weight) / 100),
          risk_level: oldMetric.metricType === "Hedef" ? (checkpoint ? String((checkpoint as Record<string, unknown>).riskStatus || risk.riskLevel) : risk.riskLevel) : "Normal",
          checkpoint_data: checkpoint ? JSON.stringify([...checkpoints, checkpoint]) : oldMetric.checkpointData,
          status: oldMetric.metricType === "Hedef" ? risk.status : oldMetric.status, updated_at: now,
        })
        .eq("id", oldMetric.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      await recalculate(companyId, oldMetric.assignmentId);
      await writeAudit(access, "UPDATE", "performance_metric", row.id, oldRaw, row);
      return Response.json({ metric: camelizeKeys(row) });
    }

    if (action === "goalStatus") {
      assertManager(access.role);
      const { data: oldRaw } = await db.from("performance_metrics").select("*").eq("id", Number(p.id)).eq("company_id", companyId).eq("metric_type", "Hedef").maybeSingle();
      const oldMetric = camelizeKeys(oldRaw);
      if (!oldMetric?.assignmentId) return Response.json({ error: "Hedef bulunamadı" }, { status: 404 });
      await assertAssignmentScope(companyId, oldMetric.assignmentId, access);
      const status = String(p.status), allowed = ["Aktif", "Reddedildi", "Revizyon"];
      if (!allowed.includes(status)) return Response.json({ error: "Geçersiz hedef durumu" }, { status: 400 });
      const { data: row, error } = await db.from("performance_metrics").update({ status, updated_at: now }).eq("id", oldMetric.id).select().single();
      if (error) throw new Error(error.message);
      await writeAudit(access, "GOAL_STATUS", "performance_metric", row.id, oldRaw, row);
      return Response.json({ metric: camelizeKeys(row) });
    }

    if (action === "updateCompetency") {
      const { data: oldRaw } = await db.from("performance_competencies").select("*").eq("id", Number(p.id)).eq("company_id", companyId).maybeSingle();
      const oldCompetency = camelizeKeys(oldRaw);
      if (!oldCompetency?.assignmentId) return Response.json({ error: "Yetkinlik bulunamadı" }, { status: 404 });
      await assertAssignmentScope(companyId, oldCompetency.assignmentId, access);
      const selfScore = Number(p.selfScore ?? oldCompetency.selfScore), managerScore = Number(p.managerScore ?? oldCompetency.managerScore);
      if (access.role === "employee" && p.managerScore !== undefined) throw new Error("PERFORMANCE_ACCESS_DENIED");
      const { data: row, error } = await db
        .from("performance_competencies")
        .update({ self_score: selfScore, manager_score: managerScore, final_score: managerScore || selfScore, updated_at: now })
        .eq("id", oldCompetency.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      await recalculate(companyId, oldCompetency.assignmentId);
      await writeAudit(access, "UPDATE", "performance_competency", row.id, oldRaw, row);
      return Response.json({ competency: camelizeKeys(row) });
    }

    await assertAssignmentScope(companyId, assignmentId, access);
    const { data: oldRaw } = await db.from("performance_assignments").select("*").eq("id", assignmentId).eq("company_id", companyId).maybeSingle();
    if (!oldRaw) return Response.json({ error: "Değerlendirme bulunamadı" }, { status: 404 });
    const old = camelizeKeys(oldRaw);
    let patch: Record<string, unknown> = { updated_at: now };

    if (action === "complete") {
      const { data: goalsRaw } = await db.from("performance_metrics").select("*").eq("assignment_id", assignmentId).eq("company_id", companyId).eq("metric_type", "Hedef");
      const goals = camelizeKeys(goalsRaw ?? []);
      const goalWeight = goals.reduce((sum, x) => sum + x.weight, 0);
      if (goals.length && goalWeight !== 100) return Response.json({ error: `Değerlendirme kapatılamaz: hedef ağırlıkları toplamı %${goalWeight}, %100 olmalıdır.` }, { status: 409 });
      if (old.locked) return Response.json({ error: "Değerlendirme zaten tamamlanmış ve kilitlidir" }, { status: 409 });
      await recalculate(companyId, assignmentId);
      patch = { ...patch, status: "Tamamlandı", locked: true };
    } else if (action === "reopen") {
      assertAdmin(access.role);
      if (!String(p.reason || "").trim()) return Response.json({ error: "Yeniden açma gerekçesi zorunludur" }, { status: 400 });
      patch = { ...patch, status: "Devam Ediyor", locked: false };
      await db.from("performance_actions").insert({ company_id: companyId, assignment_id: assignmentId, action_type: "Revizyon", title: "Değerlendirme yeniden açıldı", reason: String(p.reason), status: "Aktif", created_by: access.email, created_at: now, updated_at: now });
    } else if (action === "potential") {
      assertAdmin(access.role);
      const score = Math.max(0, Math.min(100, Number(p.score)));
      if (!String(p.reason || "").trim()) return Response.json({ error: "Potansiyel değerlendirme gerekçesi zorunludur" }, { status: 400 });
      patch = { ...patch, potential_score: score };
      await db.from("performance_actions").insert({ company_id: companyId, assignment_id: assignmentId, action_type: "Potansiyel Değerlendirme", title: "Potansiyel puanı güncellendi", old_score: old.potentialScore, new_score: score, reason: String(p.reason), status: "Tamamlandı", created_by: access.email, created_at: now, updated_at: now });
    } else if (action === "calibrate") {
      assertAdmin(access.role);
      const score = Math.max(0, Math.min(100, Number(p.score)));
      patch = { ...patch, calibrated_score: score, performance_class: performanceClass(score), status: "Kalibrasyon" };
      await db.from("performance_actions").insert({ company_id: companyId, assignment_id: assignmentId, action_type: "Kalibrasyon", title: "Puan kalibre edildi", old_score: old.calibratedScore ?? old.overallScore, new_score: score, reason: String(p.reason || ""), status: "Tamamlandı", created_by: access.email, created_at: now, updated_at: now });
    } else if (action === "acknowledge") {
      const { data: actionRow } = await db.from("performance_actions").select("*").eq("id", Number(p.actionId)).eq("company_id", companyId).maybeSingle();
      if (!actionRow || actionRow.assignment_id !== assignmentId) return Response.json({ error: "Görüşme kaydı bulunamadı" }, { status: 404 });
      await db.from("performance_actions").update({ acknowledged: true, employee_comment: String(p.comment || ""), updated_at: now }).eq("id", actionRow.id);
      return Response.json({ ok: true });
    } else return Response.json({ error: "Geçersiz işlem" }, { status: 400 });

    const { data: row, error } = await db.from("performance_assignments").update(patch).eq("id", assignmentId).eq("company_id", companyId).select().single();
    if (error) throw new Error(error.message);
    await writeAudit(access, "PERFORMANCE_" + action.toUpperCase(), "performance_assignment", assignmentId, oldRaw, row);
    return Response.json({ assignment: camelizeKeys(row) });
  } catch (e) { return accessError(e); }
}

async function recalculate(companyId: string, assignmentId: number) {
  const db = getDb();
  const { data: assignmentRaw } = await db.from("performance_assignments").select("*").eq("id", assignmentId).eq("company_id", companyId).maybeSingle();
  if (!assignmentRaw) return;
  const assignment = camelizeKeys(assignmentRaw);
  const [cycleRes, metricRes, compRes, settingsRes, feedRes] = await Promise.all([
    db.from("performance_cycles").select("*").eq("id", assignment.cycleId).eq("company_id", companyId).maybeSingle(),
    db.from("performance_metrics").select("*").eq("assignment_id", assignmentId).eq("company_id", companyId),
    db.from("performance_competencies").select("*").eq("assignment_id", assignmentId).eq("company_id", companyId),
    db.from("performance_settings").select("*").eq("company_id", companyId),
    db.from("performance_feedback").select("*").eq("assignment_id", assignmentId).eq("company_id", companyId),
  ]);
  const cycle = camelizeKeys(cycleRes.data), metrics = camelizeKeys(metricRes.data ?? []), competencies = camelizeKeys(compRes.data ?? []),
    settingsRows = camelizeKeys(settingsRes.data ?? []), feedback = camelizeKeys(feedRes.data ?? []);
  const goals = metrics.filter((x) => x.metricType === "Hedef"), kpis = metrics.filter((x) => x.metricType === "KPI"),
    managerRows = feedback.filter((x) => x.reviewerType === "Yönetici Değerlendirmesi"),
    selfRows = feedback.filter((x) => x.reviewerType === "Öz Değerlendirme"),
    feedback360Rows = feedback.filter((x) => x.reviewerType === "360°"),
    goal = weightedAverage(goals), kpi = weightedAverage(kpis),
    competency = weightedAverage(competencies.map((x) => ({ score: x.finalScore * 20, weight: x.weight }))),
    manager = average(managerRows.map((x) => x.score)), self = average(selfRows.map((x) => x.score)), feedback360 = average(feedback360Rows.map((x) => x.score)),
    scores = { goal, kpi, competency, manager, self, feedback360 },
    available = {
      goal: goals.some((x) => x.actualValue !== 0 || x.score !== 0),
      kpi: kpis.some((x) => x.actualValue !== 0 || x.score !== 0),
      competency: competencies.some((x) => x.finalScore !== 0),
      manager: managerRows.length > 0, self: selfRows.length > 0, feedback360: feedback360Rows.length > 0,
    },
    overall = cycle ? availableOverallScore(scores, cycle, available) : 0;
  await db
    .from("performance_assignments")
    .update({
      goal_score: goal, kpi_score: kpi, competency_score: competency, manager_score: manager, self_score: self, feedback_360_score: feedback360,
      overall_score: overall, performance_class: classFromSettings(overall, settingsRows[0]?.performanceScale), updated_at: new Date().toISOString(),
    })
    .eq("id", assignmentId);
}

async function seedTemplates(companyId: string, cycleId: number, assignmentId: number, department: string, position: string, now: string) {
  const goals = ["Dönem ana hedefi", "Kalite ve verimlilik hedefi", "Gelişim hedefi"],
    kpis =
      department === "Satış" ? ["Ciro", "Brüt kâr", "Yeni müşteri sayısı", "Teklif dönüşüm oranı"] :
      department === "İnsan Kaynakları" ? ["İşe alım süresi", "Personel devir oranı", "Eğitim tamamlama oranı", "Çalışan memnuniyeti"] :
      ["Zamanında tamamlama", "Kalite oranı", "Verimlilik", "Bütçe uyumu"];
  await getDb()
    .from("performance_metrics")
    .insert([
      ...goals.map((name, i) => ({
        company_id: companyId, cycle_id: cycleId, assignment_id: assignmentId, metric_type: "Hedef", source_type: "Pozisyon", name, department, position,
        unit: "%", direction: "Yüksek değer iyi", target_value: 100, actual_value: 0, weight: i === 2 ? 34 : 33, priority: "Yüksek", data_source: "Manuel",
        score: 0, status: "Aktif", created_at: now, updated_at: now,
      })),
      ...kpis.map((name) => ({
        company_id: companyId, cycle_id: cycleId, assignment_id: assignmentId, metric_type: "KPI", source_type: "Departman", name, department, position,
        unit: "%", direction: "Yüksek değer iyi", target_value: 100, actual_value: 0, weight: 25, priority: "Yüksek", data_source: "Manuel",
        score: 0, status: "Aktif", created_at: now, updated_at: now,
      })),
    ]);
  await getDb()
    .from("performance_competencies")
    .insert(
      ["İletişim", "Takım çalışması", "Sorumluluk", "Problem çözme", "Sonuç odaklılık"].map((name) => ({
        company_id: companyId, assignment_id: assignmentId, name, category: "Temel Yetkinlik", position, weight: 20, created_at: now, updated_at: now,
      })),
    );
}

async function assertAssignmentScope(companyId: string, id: number, access: Access) {
  if (adminRoles.includes(access.role) || access.role === "payroll") return;
  const db = getDb();
  const { data: aRaw } = await db.from("performance_assignments").select("*").eq("id", id).eq("company_id", companyId).maybeSingle();
  const a = camelizeKeys(aRaw);
  const { data: eRaw } = a ? await db.from("employees").select("*").eq("id", a.employeeId).eq("company_id", companyId).maybeSingle() : { data: null };
  const e = camelizeKeys(eRaw);
  if (!e) throw new Error("PERFORMANCE_ACCESS_DENIED");
  const email = access.email.toLocaleLowerCase("tr"), name = (access.fullName || "").toLocaleLowerCase("tr");
  if (e.email?.toLocaleLowerCase("tr") !== email && !(access.role === "manager" && [email, name].includes((e.manager || "").toLocaleLowerCase("tr")))) throw new Error("PERFORMANCE_ACCESS_DENIED");
}

function isActiveEmployee(status: unknown) { return String(status || "").trim().toLocaleLowerCase("tr") === "aktif"; }
function assertAdmin(role: string) { if (!adminRoles.includes(role)) throw new Error("PERFORMANCE_ACCESS_DENIED"); }
function assertManager(role: string) { if (![...adminRoles, "manager"].includes(role)) throw new Error("PERFORMANCE_ACCESS_DENIED"); }
function weightsOf(p: Record<string, unknown>) {
  return { goalWeight: Number(p.goalWeight || 0), kpiWeight: Number(p.kpiWeight || 0), competencyWeight: Number(p.competencyWeight || 0), managerWeight: Number(p.managerWeight || 0), selfWeight: Number(p.selfWeight || 0), feedback360Weight: Number(p.feedback360Weight || 0) };
}
function average(xs: number[]) { return xs.length ? Math.round(xs.reduce((s, x) => s + x, 0) / xs.length) : 0; }
function classFromSettings(score: number, json?: string) {
  if (!json) return performanceClass(score);
  try {
    const rows = JSON.parse(json) as { min: number; code: string; label: string }[], x = rows.sort((a, b) => b.min - a.min).find((r) => score >= r.min);
    return x ? `${x.code} Grubu – ${x.label}` : performanceClass(score);
  } catch { return performanceClass(score); }
}
