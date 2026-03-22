import { supabase } from '../lib/supabase';
import { Project, Stage, StageTemplate, RepairType, PropertyObject, PhotoReport } from '../types';
import { estimateTimelineDays } from '../utils/calculator';

// ---------- PROFILE ----------

export async function upsertProfile(params: {
  id: string;
  name: string;
  phone?: string;
  city?: string;
  email?: string;
  preferred_language?: string;
  role?: string;
  consent_given_at?: string;
  consent_version?: string;
}): Promise<void> {
  // Build payload — only include optional fields if provided to avoid overwriting existing values
  const payload: Record<string, any> = {
    id: params.id,
    name: params.name,
    role: params.role || 'client',
  };
  if (params.phone) payload.phone = params.phone;
  if (params.city) payload.city = params.city;
  if (params.email) payload.email = params.email;
  if (params.preferred_language) payload.preferred_language = params.preferred_language;
  if (params.consent_given_at) payload.consent_given_at = params.consent_given_at;
  if (params.consent_version) payload.consent_version = params.consent_version;

  const { error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' });

  if (error) throw error;
}

export async function updateProfile(
  userId: string,
  updates: { name?: string; phone?: string; city?: string; email?: string; preferred_language?: string },
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);

  if (error) throw error;
}

export async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

// ---------- OBJECTS ----------

export async function createObject(params: {
  userId: string;
  address: string;
  totalArea: number;
  propertyType: string;
  rooms: number;
  bathrooms: string;
  kitchenType: string;
  renovationGoal: string;
  layoutId: string | null;
  customLayoutUrl: string | null;
}): Promise<PropertyObject> {
  const { data, error } = await supabase
    .from('objects')
    .insert({
      user_id: params.userId,
      address: params.address,
      total_area: params.totalArea,
      property_type: params.propertyType,
      rooms: params.rooms,
      bathrooms: params.bathrooms,
      kitchen_type: params.kitchenType,
      renovation_goal: params.renovationGoal,
      layout_id: params.layoutId,
      custom_layout_url: params.customLayoutUrl,
    })
    .select()
    .single();

  if (error) throw error;
  return data as PropertyObject;
}

export async function fetchUserObjects(userId: string): Promise<PropertyObject[]> {
  const { data, error } = await supabase
    .from('objects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as PropertyObject[]) || [];
}

export async function deleteObject(objectId: string): Promise<void> {
  const { error } = await supabase
    .from('objects')
    .delete()
    .eq('id', objectId);

  if (error) throw error;
}

export async function fetchObjectProjects(objectId: string): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('object_id', objectId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as Project[]) || [];
}

// ---------- PROJECTS ----------

export async function fetchClientProjects(clientId: string): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as Project[]) || [];
}

export async function fetchProject(projectId: string): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error) throw error;
  return data as Project;
}

export async function createProject(params: {
  clientId: string;
  title: string;
  address: string;
  areaSqm: number;
  repairType: RepairType;
  budgetMin: number;
  budgetMax: number;
  objectId?: string;
  scope?: string[];
}): Promise<Project> {
  const insertData: Record<string, any> = {
    client_id: params.clientId,
    title: params.title,
    address: params.address,
    area_sqm: params.areaSqm,
    repair_type: params.repairType,
    budget_min: params.budgetMin,
    budget_max: params.budgetMax,
    object_id: params.objectId || null,
    status: 'new',
  };
  // Only include scope if the column exists in DB
  if (params.scope && params.scope.length > 0) {
    insertData.scope = params.scope;
  }
  const { data, error } = await supabase
    .from('projects')
    .insert(insertData)
    .select()
    .single();

  if (error) throw error;
  return data as Project;
}

// ---------- ADMIN ----------

export async function fetchAllProjects(status?: string): Promise<Project[]> {
  let query = supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as Project[]) || [];
}

export async function updateProjectStatus(
  projectId: string,
  status: string,
): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', projectId);

  if (error) throw error;
}

export async function assignSupervisor(
  projectId: string,
  supervisorId: string,
): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .update({
      supervisor_id: supervisorId,
      status: 'planning',
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId);

  if (error) throw error;
}

export async function fetchUsersByRole(
  role: string,
): Promise<{ id: string; name: string; phone: string }[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, phone')
    .eq('role', role)
    .eq('is_active', true);

  if (error) throw error;
  return data || [];
}

// ---------- MASTER ----------

export async function fetchMasterStages(masterId: string): Promise<Stage[]> {
  const { data, error } = await supabase
    .from('stages')
    .select('*')
    .eq('master_id', masterId)
    .in('status', ['pending', 'in_progress', 'rejected'])
    .order('deadline', { ascending: true });

  if (error) throw error;
  return (data as Stage[]) || [];
}

export async function updateStageStatus(
  stageId: string,
  status: string,
): Promise<void> {
  const updates: Record<string, string> = { status };
  if (status === 'in_progress') updates.started_at = new Date().toISOString();
  if (status === 'done_by_master') updates.completed_at = new Date().toISOString();
  if (status === 'approved') updates.approved_at = new Date().toISOString();

  const { error } = await supabase
    .from('stages')
    .update(updates)
    .eq('id', stageId);

  if (error) throw error;
}

// ---------- SUPERVISOR ----------

export async function fetchSupervisorProjects(
  supervisorId: string,
): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('supervisor_id', supervisorId)
    .in('status', ['planning', 'in_progress'])
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data as Project[]) || [];
}

/** Fetch ALL projects for a supervisor across all statuses */
export async function fetchSupervisorAllProjects(
  supervisorId: string,
): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('supervisor_id', supervisorId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data as Project[]) || [];
}

/** Supervisor accepts an offered project (planning → in_progress) */
export async function supervisorAcceptProject(projectId: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .update({ status: 'in_progress', updated_at: new Date().toISOString() })
    .eq('id', projectId);

  if (error) throw error;
}

/** Supervisor declines an offered project — clears supervisor and reverts to 'new' */
export async function supervisorDeclineProject(projectId: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .update({
      supervisor_id: null,
      status: 'new',
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId);

  if (error) throw error;
}

/** Supervisor approves a stage (done_by_master → approved) */
export async function supervisorApproveStage(
  stageId: string,
  comment?: string,
  checklistJson?: string,
): Promise<void> {
  const updates: Record<string, any> = {
    status: 'approved',
    approved_at: new Date().toISOString(),
  };
  if (comment) updates.supervisor_comment = comment;
  if (checklistJson) updates.checklist_json = checklistJson;

  const { error } = await supabase
    .from('stages')
    .update(updates)
    .eq('id', stageId);

  if (error) throw error;
}

/** Supervisor rejects a stage (done_by_master → rejected) */
export async function supervisorRejectStage(
  stageId: string,
  comment: string,
): Promise<void> {
  const { error } = await supabase
    .from('stages')
    .update({
      status: 'rejected',
      supervisor_comment: comment,
    })
    .eq('id', stageId);

  if (error) throw error;
}

/** Assign master to a stage */
export async function assignMasterToStage(
  stageId: string,
  masterId: string,
  deadline?: string,
): Promise<void> {
  const updates: Record<string, any> = { master_id: masterId };
  if (deadline) updates.deadline = deadline;

  const { error } = await supabase
    .from('stages')
    .update(updates)
    .eq('id', stageId);

  if (error) throw error;
}

// ---------- STAGES ----------

export async function fetchStageTemplates(): Promise<StageTemplate[]> {
  const { data, error } = await supabase
    .from('stage_templates')
    .select('*')
    .order('order_index', { ascending: true });

  if (error) throw error;
  return (data as StageTemplate[]) || [];
}

export async function createStageTemplate(template: Omit<StageTemplate, 'id'>): Promise<StageTemplate> {
  const { data, error } = await supabase
    .from('stage_templates')
    .insert(template)
    .select()
    .single();

  if (error) throw error;
  return data as StageTemplate;
}

export async function updateStageTemplate(
  id: string,
  updates: Partial<Pick<StageTemplate, 'title' | 'description' | 'checklist' | 'order_index'>>,
): Promise<void> {
  const { error } = await supabase
    .from('stage_templates')
    .update(updates)
    .eq('id', id);

  if (error) throw error;
}

export async function deleteStageTemplate(id: string): Promise<void> {
  const { error } = await supabase
    .from('stage_templates')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function fetchProjectStages(projectId: string): Promise<Stage[]> {
  const { data, error } = await supabase
    .from('stages')
    .select('*')
    .eq('project_id', projectId)
    .order('order_index', { ascending: true });

  if (error) throw error;
  return (data as Stage[]) || [];
}

export async function generateStagesForProject(
  projectId: string,
  repairType: RepairType,
  areaSqm: number,
): Promise<Stage[]> {
  const templates = await fetchStageTemplates();
  const totalDays = estimateTimelineDays(repairType, areaSqm);
  const daysPerStage = Math.ceil(totalDays / templates.length);

  const startDate = new Date();
  const stages = templates.map((template, index) => {
    const deadline = new Date(startDate);
    deadline.setDate(deadline.getDate() + daysPerStage * (index + 1));

    return {
      project_id: projectId,
      template_id: template.id,
      title: template.title,
      description: template.description,
      order_index: template.order_index,
      status: 'pending' as const,
      deadline: deadline.toISOString().split('T')[0],
    };
  });

  const { data, error } = await supabase.from('stages').insert(stages).select();

  if (error) throw error;
  return (data as Stage[]) || [];
}

// ---------- PHOTO REPORTS (CLIENT VIEW) ----------

export async function fetchStagePhotos(stageId: string): Promise<PhotoReport[]> {
  const { data, error } = await supabase
    .from('photo_reports')
    .select('*')
    .eq('stage_id', stageId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data as PhotoReport[]) || [];
}

// ---------- ADMIN: LEADS ----------

export async function fetchAllLeads(): Promise<any[]> {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function updateLeadStatus(
  leadId: string,
  status: string,
): Promise<void> {
  const { error } = await supabase
    .from('leads')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', leadId);

  if (error) throw error;
}

export async function convertLeadToProject(leadId: string, projectData: {
  clientId: string;
  title: string;
  address: string;
  areaSqm: number;
  repairType: string;
  budgetMin: number;
  budgetMax: number;
}): Promise<Project> {
  // Create the project
  const project = await createProject({
    clientId: projectData.clientId,
    title: projectData.title,
    address: projectData.address,
    areaSqm: projectData.areaSqm,
    repairType: projectData.repairType as any,
    budgetMin: projectData.budgetMin,
    budgetMax: projectData.budgetMax,
  });

  // Mark lead as converted
  await supabase
    .from('leads')
    .update({
      status: 'converted',
      converted_project_id: project.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', leadId);

  return project;
}

// ---------- ADMIN: USERS ----------

export async function fetchAllUsers(role?: string): Promise<any[]> {
  let query = supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (role && role !== 'all') {
    query = query.eq('role', role);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function toggleUserActive(
  userId: string,
  isActive: boolean,
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', userId);

  if (error) throw error;
}

export async function updateUserRole(
  userId: string,
  role: string,
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId);

  if (error) throw error;
}

export async function updateMasterVerification(
  userId: string,
  isVerified: boolean,
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ is_verified: isVerified })
    .eq('id', userId);

  if (error) throw error;
}

// ---------- ADMIN: STATS ----------

export async function fetchAdminStats(): Promise<{
  totalProjects: number;
  newProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalMasters: number;
  totalSupervisors: number;
  totalClients: number;
  totalLeads: number;
}> {
  // Fetch counts in parallel
  const [projectsRes, mastersRes, supervisorsRes, clientsRes, leadsRes] =
    await Promise.all([
      supabase.from('projects').select('id, status'),
      supabase.from('profiles').select('id').eq('role', 'master'),
      supabase.from('profiles').select('id').eq('role', 'supervisor'),
      supabase.from('profiles').select('id').eq('role', 'client'),
      supabase.from('leads').select('id'),
    ]);

  const projects = projectsRes.data || [];
  return {
    totalProjects: projects.length,
    newProjects: projects.filter((p) => p.status === 'new').length,
    activeProjects: projects.filter(
      (p) => p.status === 'planning' || p.status === 'in_progress',
    ).length,
    completedProjects: projects.filter((p) => p.status === 'completed').length,
    totalMasters: mastersRes.data?.length || 0,
    totalSupervisors: supervisorsRes.data?.length || 0,
    totalClients: clientsRes.data?.length || 0,
    totalLeads: leadsRes.data?.length || 0,
  };
}

// ---------- ADMIN: PAYMENTS ----------

export async function recordPayment(payment: {
  project_id: string;
  stage_id?: string;
  amount: number;
  method: 'cash' | 'transfer' | 'card';
  recorded_by: string;
  note?: string;
}): Promise<void> {
  const { error } = await supabase.from('payments').insert({
    ...payment,
    status: 'confirmed',
    created_at: new Date().toISOString(),
  });

  if (error) throw error;
}

export async function fetchProjectPayments(projectId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// ---------- ADMIN: PROJECT WITH CLIENT ----------

export async function fetchProjectWithClient(
  projectId: string,
): Promise<Project & { client_name?: string; client_phone?: string; supervisor_name?: string }> {
  const { data, error } = await supabase
    .from('projects')
    .select('*, client:profiles!client_id(name, phone), supervisor:profiles!supervisor_id(name)')
    .eq('id', projectId)
    .single();

  if (error) throw error;

  const result = {
    ...(data as any),
    client_name: data.client?.name,
    client_phone: data.client?.phone,
    supervisor_name: data.supervisor?.name,
  };
  delete result.client;
  delete result.supervisor;
  return result;
}

// ---------- REVIEWS ----------

export async function submitReviewApi(review: {
  project_id: string;
  master_id: string;
  client_id: string;
  rating: number;
  text?: string;
}): Promise<void> {
  const { error } = await supabase
    .from('reviews')
    .insert(review);

  if (error) throw error;
}
