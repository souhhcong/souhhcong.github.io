// Standard queue only: one paid submission, then resumable GETs of the saved task.
const taskIdValid = id => typeof id==="string" && /^[a-f\d-]{16,64}$/i.test(id);
const cost = value => typeof value==="number" && Number.isFinite(value) && value>=0 ? value : null;
const failure = status => ({status,estimatedPages:null});

export function parseDataForSeoCount(data,item,taskId) {
  if(data?.status_code!==20000 || !Array.isArray(data.tasks) || data.tasks.length!==1) return failure("api_error");
  const task=data.tasks[0];
  if(taskId && task.id!==taskId) return failure("task_mismatch");
  if([20100,40601,40602].includes(task.status_code)) return failure("queued");
  if(task.status_code!==20000) return failure(Number.isInteger(task.status_code)?`api_${task.status_code}`:"api_error");
  const result=task.result?.[0];
  if(!result) return failure("count_unavailable");
  let suggestionOnly=false;
  try {
    const url=new URL(result.check_url);
    suggestionOnly=result.spell?.type==="did_you_mean" && url.hostname==="www.google.com" &&
      url.searchParams.get("q")===item.query && url.searchParams.get("nfpr")==="1";
  } catch { /* A spelling suggestion without a verifiable query URL is unknown. */ }
  if(result.keyword!==item.query || result.language_code!==item.settings.language_code || result.location_code!==item.settings.location_code || (result.spell&&!suggestionOnly) ||
    result.se_domain!==item.settings.se_domain) return failure("query_changed");
  const count=result.se_results_count;
  const diagnostics={totalCountFieldPresent:count!==undefined,returnedOrganicResults:Array.isArray(result.items)?result.items.filter(i=>i.type==="organic").length:null};
  if(!Number.isSafeInteger(count)||count<0) return {...failure("count_unavailable"),...diagnostics};
  if(count===0 && diagnostics.returnedOrganicResults>0) return {...failure("count_inconsistent"),...diagnostics};
  return {status:"ok",estimatedPages:count,...diagnostics,...(suggestionOnly?{spellingSuggestion:result.spell.keyword}:{} )};
}

export async function fetchDataForSeo(item,credentials,previous,fetcher=fetch) {
  const resume=Boolean(previous?.taskId);
  if(resume && !taskIdValid(previous.taskId)) return failure("invalid_task_id");
  const path=resume?`task_get/regular/${previous.taskId}`:"task_post";
  const retained=resume?{taskId:previous.taskId,submissionCostUsd:previous.submissionCostUsd??null}:{};
  try {
    const auth=btoa(String.fromCharCode(...new TextEncoder().encode(`${credentials.login}:${credentials.password}`)));
    const response=await fetcher(`https://api.dataforseo.com/v3/serp/google/organic/${path}`,{
      method:resume?"GET":"POST",redirect:"error",signal:AbortSignal.timeout(30000),
      headers:{Authorization:`Basic ${auth}`,"Content-Type":"application/json"},
      ...(!resume?{body:JSON.stringify([item.settings])}:{})
    });
    // A server-side failure could happen after a billed POST was accepted.
    if(!response.ok) {
      let rejected;
      try { rejected=await response.json(); } catch { /* Non-JSON errors stay sanitized. */ }
      if(rejected?.status_code===40104) return {...failure("account_verification_required"),...retained};
      return {...failure(!resume&&response.status>=500?"submission_unknown":`http_${response.status}`),...retained};
    }
    const data=await response.json();
    if(data?.status_code===40104) return {...failure("account_verification_required"),...retained};
    if(resume) return {...parseDataForSeoCount(data,item,previous.taskId),...retained};
    const task=data?.tasks?.[0];
    if(data?.status_code!==20000) return failure(Number.isInteger(data?.status_code)&&data.status_code>=40000&&data.status_code<50000?`api_${data.status_code}`:"submission_unknown");
    if(data?.tasks?.length!==1) return failure("submission_unknown");
    if(task?.status_code!==20100) return failure(Number.isInteger(task?.status_code)?`api_${task.status_code}`:"submission_unknown");
    if(!taskIdValid(task.id)) return failure("submission_unknown");
    return {...failure("queued"),taskId:task.id,submissionCostUsd:cost(task.cost)};
  } catch(error) {
    // DNS/refused connections cannot have submitted a billed search. Other POST
    // failures require checking the dashboard before an explicit --refresh.
    const notConnected=/dns error|failed to lookup|connection refused|network is unreachable/i.test(String(error?.message)) || ["NotCapable","PermissionDenied"].includes(error?.name);
    return {...failure(resume||notConnected?"request_failed":"submission_unknown"),...retained};
  }
}
