import {buildPlan,cacheMatches,frequencyRanking} from "../scripts/google-frequency.js";
import {fetchDataForSeo,parseDataForSeoCount} from "../scripts/dataforseo-frequency.js";
const assert=(v,m)=>{if(!v)throw new Error(m);};
const id="01291721-1535-0066-0000-8f0635c0dc89";
const item=buildPlan([{id:"1",diagnosis:"Lao phổi",aliases:""}],{},"dataforseo")[0];
const credentials={login:"test-login",password:"test-secret"};
const payload=(result,code=20000)=>({status_code:20000,tasks:[{id,status_code:code,result:result?[result]:null}]});
const result={keyword:item.query,language_code:"vi",location_code:2704,se_domain:"google.com",spell:null,se_results_count:12345,items:[{type:"organic"}]};

Deno.test("DataForSEO standard queue submits once and resumes the exact saved task by GET",async()=>{
  let submits=0,gets=0;
  const mock=(url,options)=>{
    assert(options.headers.Authorization===`Basic ${btoa("test-login:test-secret")}`,"Missing Basic header authentication");
    assert(!url.includes("test-secret")&&!url.includes("test-login"),"Credentials in URL");
    if(options.method==="POST") {
      submits++;
      assert(url.endsWith("/task_post"),"Unexpected billed endpoint");
      const body=JSON.parse(options.body);
      assert(body.length===1&&body[0].keyword===item.query,"Unexpected submitted searches");
      assert(body[0].priority===1&&body[0].depth===10&&body[0].max_crawl_pages===1,"Expensive depth or priority enabled");
      assert(body[0].language_code==="vi"&&body[0].location_code===2704&&!body[0].search_param.includes("lr="),"Unsupported language restriction or wrong locale");
      return Promise.resolve(new Response(JSON.stringify({status_code:20000,tasks:[{id,status_code:20100,cost:0.0006}]})));
    }
    gets++;
    assert(url.endsWith(`/task_get/regular/${id}`)&&!options.body,"Saved task not reused");
    return Promise.resolve(new Response(JSON.stringify(gets===1?payload(null,40602):payload(result))));
  };
  const queued=await fetchDataForSeo(item,credentials,null,mock);
  assert(queued.status==="queued"&&queued.taskId===id&&queued.submissionCostUsd===0.0006,"Submission details lost");
  const pending=await fetchDataForSeo(item,credentials,queued,mock);
  const complete=await fetchDataForSeo(item,credentials,pending,mock);
  assert(submits===1&&gets===2&&complete.estimatedPages===12345&&complete.submissionCostUsd===0.0006,"Paid search repeated or total not parsed");
});

Deno.test("DataForSEO rejects missing totals, changed searches, wrong tasks and inconsistent zeros",()=>{
  assert(parseDataForSeoCount(payload(result),item,id).estimatedPages===12345,"Valid total rejected");
  assert(parseDataForSeoCount(payload(null,40601),item,id).status==="queued","Handed task treated as error");
  assert(parseDataForSeoCount(payload(null,40602),item,id).status==="queued","Queued task treated as zero");
  for(const changes of [{se_results_count:undefined},{se_results_count:-1},{se_results_count:"12345"},{se_results_count:0},{spell:{type:"showing_results_for"}},{language_code:"en"},{location_code:2840},{keyword:"other disease"},{se_domain:"bing.com"}]) {
    const parsed=parseDataForSeoCount(payload({...result,...changes}),item,id);
    assert(parsed.status!=="ok"&&parsed.estimatedPages===null,"Invalid or mismatched total accepted");
  }
  assert(parseDataForSeoCount(payload({...result,se_results_count:0,items:[]}),item,id).estimatedPages===0,"Explicit zero rejected");
  assert(parseDataForSeoCount(payload(result),item,"other-task").status==="task_mismatch","Other task's count accepted");
  assert(parseDataForSeoCount(payload(null,40200),item,id).status==="api_40200","Provider status lost");
});

Deno.test("DataForSEO failures preserve pending IDs and never log credentials or raw errors",async()=>{
  const timeout=()=>{throw new Error("request test-secret timed out");};
  const unknown=await fetchDataForSeo(item,credentials,null,timeout);
  assert(unknown.status==="submission_unknown"&&!JSON.stringify(unknown).includes("test-secret"),"Ambiguous paid submission retried or secret leaked");
  const prior={taskId:id,submissionCostUsd:0.0006};
  const failed=await fetchDataForSeo(item,credentials,prior,timeout);
  assert(failed.status==="request_failed"&&failed.taskId===id,"Failed poll lost paid task");
  const server=await fetchDataForSeo(item,credentials,null,()=>Promise.resolve(new Response("test-secret",{status:500})));
  assert(server.status==="submission_unknown"&&!JSON.stringify(server).includes("test-secret"),"Server failure could repeat paid search or leak response body");
  const refused=await fetchDataForSeo(item,credentials,null,()=>{throw new Error("dns error: failed to lookup address");});
  assert(refused.status==="request_failed","Pre-connection failure marked as billed");
  const invalid=await fetchDataForSeo(item,credentials,{taskId:"../../elsewhere"},()=>{throw new Error("Should not fetch");});
  assert(invalid.status==="invalid_task_id","Task URL traversal accepted");
  for(const priorTask of [null,prior]) {
    const unverified=await fetchDataForSeo(item,credentials,priorTask,()=>Promise.resolve(new Response(JSON.stringify({status_code:40104,status_message:"test-secret",cost:0}),{status:403})));
    assert(unverified.status==="account_verification_required"&&!JSON.stringify(unverified).includes("test-secret"),"Verification error hidden or raw provider text leaked");
    if(priorTask)assert(unverified.taskId===id,"Verification failure discarded saved task");
  }
});

Deno.test("DataForSEO counts stay separate from other providers and preserve complete-coverage ranking",()=>{
  const good={...item,status:"ok",estimatedPages:12345};
  assert(cacheMatches(good,item),"Matching DataForSEO result not reusable");
  assert(!cacheMatches({...good,provider:"serper"},item),"Other provider accepted");
  assert(!cacheMatches({...good,settings:{...item.settings,priority:2}},item),"Different request configuration reused");
  assert(frequencyRanking([item],[good])[0].webFrequencyHardness===3,"Complete matching counts not ranked");
  assert(frequencyRanking([item],[{...good,status:"queued",estimatedPages:null}])===null,"Queued search produced hardness");
});

Deno.test("spelling suggestions preserve a verified original query while actual rewrites remain rejected",()=>{
  const url=new URL("https://www.google.com/search");url.searchParams.set("q",item.query);url.searchParams.set("nfpr","1");
  const suggested={...result,check_url:url.href,spell:{type:"did_you_mean",keyword:"another spelling"}};
  const parsed=parseDataForSeoCount(payload(suggested),item,id);
  assert(parsed.status==="ok"&&parsed.estimatedPages===12345&&parsed.spellingSuggestion==="another spelling","Suggestion mistaken for a rewritten query");
  for(const unsafe of [{...suggested,spell:{type:"showing_results_for",keyword:"another disease"}},{...suggested,check_url:"https://www.google.com/search?q=another&nfpr=1"},{...suggested,check_url:"https://www.google.com/search?q="+encodeURIComponent(item.query)},{...suggested,keyword:"changed query"}]) {
    assert(parseDataForSeoCount(payload(unsafe),item,id).status==="query_changed","Rewritten or unverifiable query accepted");
  }
});
