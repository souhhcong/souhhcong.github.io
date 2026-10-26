// Offline research utility. Search estimates are a web-visibility proxy, not measured student difficulty.
import {loadApp} from "./app-harness.js";
import {fetchDataForSeo} from "./dataforseo-frequency.js";

const VI = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
const key = term => term.normalize("NFC").toLocaleLowerCase("vi").replace(/\s+/g," ").trim();
const fold = term => key(term).normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d");
const unaccentedVietnamese = term => /^(benh|hoi chung|viem|nhiem|sot|tang|giam|suy|soi|thieu|dai thao|dau|xuat huyet|lac noi|nhoi mau)\b/.test(key(term));
const positiveInteger = value => Number.isSafeInteger(value) && value >= 0;

export function vietnameseTerms(row, override) {
  const primary = row.diagnosis.replace(/\s*\([^)]*\)/g, "").trim();
  const candidates = override ?? [primary, ...[...row.diagnosis.matchAll(/\(([^)]+)\)/g)].map(m=>m[1]).filter(t=>VI.test(t)),
    ...(row.aliases || "").split("|").filter(t=>VI.test(t)||unaccentedVietnamese(t))];
  if (!Array.isArray(candidates) || !candidates.length) throw new Error(`Case ${row.id}: empty search terms`);
  const terms = new Map();
  for (const candidate of candidates) {
    if (typeof candidate !== "string" || !candidate.trim() || /["\r\n\x00-\x1f]/.test(candidate)) throw new Error(`Case ${row.id}: invalid search phrase`);
    let term = candidate.normalize("NFC").replace(/\s+/g," ").trim();
    // Single words such as "tả" can have nonmedical meanings.
    if (!term.includes(" ")) term = `bệnh ${term}`;
    if (!VI.test(term) && [...terms.values()].some(existing=>fold(existing)===fold(term))) continue;
    terms.set(key(term),term);
  }
  return [...terms.values()];
}

export function buildPlan(rows, overrides = {}, provider = "serpapi") {
  if (!["serpapi","serper","dataforseo"].includes(provider)) throw new Error("Unknown provider; use serpapi, serper or dataforseo");
  const known = new Set(rows.map(row=>row.id));
  if (!overrides || typeof overrides!=="object" || Array.isArray(overrides) || Object.keys(overrides).some(id=>!known.has(id))) throw new Error("Unknown case in search-term overrides");
  return rows.map(row=>{
    const terms = vietnameseTerms(row,overrides[row.id]);
    const query = terms.map(term=>`"${term}"`).join(" OR ");
    if (query.length > (provider==="dataforseo"?700:1800)) throw new Error(`Case ${row.id}: query too long`);
    const settings = provider==="dataforseo" ? {keyword:query,language_code:"vi",location_code:2704,se_domain:"google.com",device:"desktop",os:"windows",depth:10,max_crawl_pages:1,priority:1,search_param:"&nfpr=1&filter=1"} : provider==="serper" ? {q:query,hl:"vi",gl:"vn",autocorrect:false,num:10,page:1} :
      {q:query,hl:"vi",gl:"vn",lr:"lang_vi",nfpr:"1",filter:"1",device:"desktop"};
    const google = new URL("https://www.google.com/search");
    for (const [name,value] of Object.entries({q:query,hl:"vi",gl:"vn",...(provider==="serpapi"?{lr:"lang_vi",nfpr:"1",filter:"1"}:{nfpr:"1"})})) google.searchParams.set(name,value);
    return {caseId:Number(row.id),diagnosis:row.diagnosis,terms,query,provider,settings,googleUrl:google.href,
      languageRestriction:provider==="serpapi"?"Vietnamese pages":"Vietnamese query and interface; page language not restricted",
      termsSource:overrides[row.id]?"explicit override":"canonical diagnosis and Vietnamese aliases",termsNeedReview:!overrides[row.id]};
  });
}

export function parseSerpApiCount(data) {
  if (!data || data.error || data.search_metadata?.status !== "Success") return {status:"api_error",estimatedPages:null};
  const info = data.search_information || {};
  if (info.showing_results_for || info.results_for || /corrected|spelling fix/i.test(info.organic_results_state || "")) return {status:"query_changed",estimatedPages:null};
  const count = info.total_results;
  if (!positiveInteger(count)) return {status:"count_unavailable",estimatedPages:null};
  // A zero paired with real results is not reliable evidence of no matching pages.
  if (count===0 && data.organic_results?.length) return {status:"count_inconsistent",estimatedPages:null};
  return {status:"ok",estimatedPages:count};
}

export function parseSerperCount(data, item) {
  if (!data || data.error || (data.statusCode!==undefined && data.statusCode!==200)) return {status:"api_error",estimatedPages:null};
  const info=data.searchInformation || {};
  const echoed=data.searchParameters;
  if (info.showingResultsFor || info.correctedQuery || data.showingResultsFor ||
    (item && echoed && ["q","hl","gl"].some(name=>echoed[name]!==undefined && echoed[name]!==item.settings[name]))) {
    return {status:"query_changed",estimatedPages:null};
  }
  const raw=info.totalResults;
  const count=typeof raw==="string" && /^(?:\d+|\d{1,3}(?:,\d{3})+)$/.test(raw) ? Number(raw.replaceAll(",","")) : raw;
  const diagnostics={returnedOrganicResults:Array.isArray(data.organic)?data.organic.length:null,totalCountFieldPresent:raw!==undefined};
  if (!positiveInteger(count)) return {status:"count_unavailable",estimatedPages:null,...diagnostics};
  if (count===0 && data.organic?.length) return {status:"count_inconsistent",estimatedPages:null,...diagnostics};
  return {status:"ok",estimatedPages:count,...diagnostics};
}

export async function fetchCount(item, apiKey, fetcher = fetch) {
  const serper=item.provider==="serper";
  const url = new URL(serper?"https://google.serper.dev/search":"https://serpapi.com/search.json");
  if(!serper)for(const [name,value] of Object.entries({...item.settings,engine:"google",api_key:apiKey})) url.searchParams.set(name,value);
  try {
    const response = await fetcher(url,{signal:AbortSignal.timeout(30000),redirect:"error",
      ...(serper?{method:"POST",headers:{"X-API-KEY":apiKey,"Content-Type":"application/json"},body:JSON.stringify(item.settings)}:{})});
    if (!response.ok) return {status:`http_${response.status}`,estimatedPages:null};
    const data=await response.json();
    return serper?parseSerperCount(data,item):parseSerpApiCount(data);
  } catch {
    // Do not log provider error bodies or URLs: either might contain the API key.
    return {status:"request_failed",estimatedPages:null};
  }
}

export function cacheMatches(record,item) {
  return record?.provider===(item.provider||"serpapi") && record.status==="ok" && positiveInteger(record.estimatedPages) &&
    JSON.stringify(record.settings)===JSON.stringify(item.settings) && record.query===item.query && record.caseId===item.caseId;
}

export function frequencyRanking(plan, records) {
  const matched = plan.map(item=>records.find(record=>cacheMatches(record,item)));
  if(matched.some(item=>!item)) return null;
  const counts=matched.map(item=>item.estimatedPages);
  // Midranks keep identical counts together; missing counts never become zeros.
  return matched.map((record,i)=>{
    const count=counts[i];
    const less=counts.filter(other=>other<count).length;
    const equal=counts.filter(other=>other===count).length;
    const percentile=(less+equal/2)/counts.length;
    return {caseId:record.caseId,estimatedPages:count,webFrequencyHardness:Math.min(5,1+Math.floor((1-percentile)*5))};
  });
}

function options(args) {
  const result={};
  for(const arg of args) {
    const match=/^--(collect|refresh|help|case|limit|terms|provider)(?:=(.*))?$/.exec(arg);
    if(!match) throw new Error(`Unknown argument: ${arg}`);
    const flag=["collect","refresh","help"].includes(match[1]);
    if((flag&&match[2]!==undefined)||(!flag&&!match[2]))throw new Error(`Invalid option: --${match[1]}`);
    result[match[1]]=flag?true:match[2];
  }
  return result;
}

export async function main(args) {
  const opts=options(args);
  if(opts.help) {
    console.log("deno task research:frequency [--provider=serpapi|serper|dataforseo] [--case=1] [--terms=.internal/search-terms.json] [--collect --limit=1] [--refresh]\nDefault: writes the query plan without network requests. Serper uses SERPER_API_KEY; SerpApi uses SERPAPI_API_KEY. DataForSEO uses DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD with its standard queue; rerun to retrieve saved tasks. Reports stay in .internal/. No live hardness ratings are changed.");
    return;
  }
  const {rows}=loadApp();
  const overrides=opts.terms?JSON.parse(Deno.readTextFileSync(opts.terms)):{};
  const provider=opts.provider||"serpapi";
  const plan=buildPlan(rows,overrides,provider);
  if(opts.case && !plan.some(item=>String(item.caseId)===opts.case))throw new Error("Unknown case ID");
  if(opts.limit && (!/^\d+$/.test(opts.limit)||Number(opts.limit)<1||Number(opts.limit)>plan.length))throw new Error("Invalid request limit");
  Deno.mkdirSync(".internal",{recursive:true});
  Deno.writeTextFileSync(".internal/google-frequency-plan.json",JSON.stringify({version:1,provider,metric:"estimated matching web pages for Vietnamese diagnosis queries",generatedAt:new Date().toISOString(),queries:plan},null,2)+"\n");
  if(!opts.collect) { console.log(`Prepared ${plan.length} Vietnamese OR queries; no network requests made. Plan: .internal/google-frequency-plan.json`); return; }
  if(!opts.limit&&!opts.case)throw new Error("Set --limit=5 for a pilot, --limit=400 for the full bank, or --case=<id>");
  const keyName=provider==="dataforseo"?"DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD":provider==="serper"?"SERPER_API_KEY":"SERPAPI_API_KEY";
  const apiKey=provider==="dataforseo"?(Deno.env.get("DATAFORSEO_LOGIN")&&Deno.env.get("DATAFORSEO_PASSWORD")?{login:Deno.env.get("DATAFORSEO_LOGIN"),password:Deno.env.get("DATAFORSEO_PASSWORD")}:null):Deno.env.get(keyName);
  if(!apiKey)throw new Error(`${keyName} is not set. Save it locally or load ~/.env with Deno --env-file; do not put it in this repository. Search Console credentials cannot supply web-wide counts.`);
  const path=provider==="serpapi"?".internal/google-frequency-results.json":`.internal/google-frequency-${provider}-results.json`;
  let previous;
  try {previous=JSON.parse(Deno.readTextFileSync(path));} catch(error) {if(!(error instanceof Deno.errors.NotFound))throw new Error("Existing research report could not be read");}
  const records=Array.isArray(previous?.records)?previous.records:[];
  const saveReport=()=>{
    const ranking=frequencyRanking(plan,records);
    const report={version:1,provider,metric:"Google estimated matching pages for Vietnamese queries, not exact occurrences or student hardness",updatedAt:new Date().toISOString(),coverage:plan.filter(p=>records.some(r=>cacheMatches(r,p))).length,totalCases:plan.length,records,ranking};
    Deno.writeTextFileSync(path,JSON.stringify(report,null,2)+"\n");
  };
  let requests=0;
  for(const item of plan.filter(item=>!opts.case||String(item.caseId)===opts.case)) {
    if(!opts.refresh&&records.some(record=>cacheMatches(record,item))) continue;
    if(requests>=Number(opts.limit || 1))break;
    const existing=records.findIndex(r=>r.caseId===item.caseId&&JSON.stringify(r.settings)===JSON.stringify(item.settings));
    const prior=existing>=0?records[existing]:null;
    if(provider==="dataforseo"&&!opts.refresh&&prior?.status==="submission_unknown") {
      console.log(`#${item.caseId}: submission outcome unknown. Check DataForSEO task history before using --refresh; no new search submitted.`);break;
    }
    // Space requests on new accounts; queued retrievals and submissions share
    // the same pace. Every saved successful case is skipped before this delay.
    if(provider==="dataforseo"&&requests>0)await new Promise(resolve=>setTimeout(resolve,1250));
    if(provider==="dataforseo"&&(opts.refresh||!prior?.taskId)) {
      // Persist intent before billing, so interruption cannot silently resubmit.
      const intent={...item,status:"submission_unknown",estimatedPages:null,retrievedAt:new Date().toISOString()};
      if(existing>=0)records[existing]=intent;else records.push(intent);
      saveReport();
    }
    const measured=provider==="dataforseo"?await fetchDataForSeo(item,apiKey,opts.refresh?null:prior):await fetchCount(item,apiKey); requests++;
    const record={...item,...measured,provider,retrievedAt:new Date().toISOString()};
    const recordIndex=records.findIndex(r=>r.caseId===item.caseId&&JSON.stringify(r.settings)===JSON.stringify(item.settings));
    if(recordIndex>=0)records[recordIndex]=record;else records.push(record);
    saveReport();
    console.log(`#${item.caseId}: ${measured.status}${measured.status==="ok"?` (${measured.estimatedPages} estimated pages)`:""}`);
    if(measured.status==="account_verification_required") console.log("DataForSEO requires account verification in https://app.dataforseo.com/ before API access (40104).");
    if(provider==="serper" && measured.status==="count_unavailable") console.log("Serper returned no usable total count. Returned result-list length is not a web-wide count; stopping collection.");
    // Stop instead of consuming the remaining quota on an unsupported or blocked count response.
    if(measured.status!=="ok"&&measured.status!=="queued")break;
  }
  if(provider==="dataforseo"&&records.some(r=>r.status==="queued"))console.log("Queued tasks saved. Rerun in a few minutes WITHOUT --refresh to retrieve the saved tasks without another paid submission.");
  console.log(`Requests: ${requests}. Report: ${path}. Current case-difficulty.json unchanged.`);
}

if(import.meta.main)main(Deno.args).catch(error=>{console.error(error.message);Deno.exitCode=1;});
