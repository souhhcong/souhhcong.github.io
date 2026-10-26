import {buildPlan,vietnameseTerms,parseSerpApiCount,parseSerperCount,fetchCount,cacheMatches,frequencyRanking} from "../scripts/google-frequency.js";
import {loadApp} from "../scripts/app-harness.js";
function assert(value,message) {if(!value)throw new Error(message);}
function rejects(fn) {let error;try{fn();}catch(e){error=e;}assert(error,"Expected invalid input to fail");}

Deno.test("Vietnamese search terms keep synonyms but exclude English, codes and redundant accentless forms",()=>{
  const row={id:"1",diagnosis:"Sốt xuất huyết Dengue",aliases:"Sốt xuất huyết Dengue|sot xuat huyet dengue|sot xuat huyet|dengue|sxh|A91"};
  const terms=vietnameseTerms(row);
  assert(terms.length===2&&terms.includes("Sốt xuất huyết Dengue")&&terms.includes("sot xuat huyet"),"Vietnamese synonyms lost or English/code aliases included");
  assert(vietnameseTerms({id:"18",diagnosis:"Tả",aliases:"Tả|ta|cholera"})[0]==="bệnh Tả","Ambiguous single-word query not disambiguated");
  const full=vietnameseTerms({id:"7",diagnosis:"Bệnh kháng màng đáy cầu thận (hội chứng Goodpasture)",aliases:"Hội chứng Goodpasture|anti gbm disease"});
  assert(full.length===2 && !full.some(term=>term.includes("(")),"Parenthetical Vietnamese synonym not separated");
});

Deno.test("one OR query per disease avoids summing overlapping synonym counts and fixes locale",()=>{
  const {rows}=loadApp();const plan=buildPlan(rows);
  assert(plan.length===400,"Incomplete query plan");
  const item=plan.find(p=>p.caseId===7);
  assert(item.query.includes('" OR "')&&item.terms.length===2,"Synonyms not joined by OR");
  const url=new URL(item.googleUrl);
  assert(url.searchParams.get("lr")==="lang_vi"&&url.searchParams.get("gl")==="vn"&&url.searchParams.get("hl")==="vi","Locale not fixed");
  const override=buildPlan(rows,{18:["bệnh tả","dịch tả"]}).find(p=>p.caseId===18);
  assert(override.query==='"bệnh tả" OR "dịch tả"',"Explicit synonyms not used");
  rejects(()=>buildPlan(rows,{999:["unknown"]}));
  rejects(()=>vietnameseTerms(rows[0],['disease" OR anything']));
});

Deno.test("missing counts, provider errors and corrected queries never become rare-disease zero counts",()=>{
  const payload={search_metadata:{status:"Success"},search_information:{total_results:12345}};
  assert(parseSerpApiCount(payload).estimatedPages===12345,"Valid numeric count not accepted");
  assert(parseSerpApiCount({...payload,search_information:{total_results:0},organic_results:[]}).estimatedPages===0,"Explicit empty result rejected");
  for(const data of [{}, {...payload,error:"contains secret"},{...payload,search_information:{}},
    {...payload,search_information:{total_results:0},organic_results:[{title:"real page"}]},
    {...payload,search_information:{total_results:-1}}, {...payload,search_information:{total_results:"12345"}},
    {...payload,search_information:{total_results:12,showing_results_for:"another disease"}}]) {
    const result=parseSerpApiCount(data);
    assert(result.status!=="ok"&&result.estimatedPages===null,"Unavailable or changed query treated as a valid count");
  }
});

Deno.test("count requests send fixed Google parameters and keep credentials and error bodies out of records",async()=>{
  const item=buildPlan([{id:"1",diagnosis:"Lao phổi",aliases:"pulmonary tuberculosis"}])[0];
  const result=await fetchCount(item,"test-secret",url=>{
    assert(url.hostname==="serpapi.com"&&url.searchParams.get("engine")==="google"&&url.searchParams.get("device")==="desktop"&&url.searchParams.get("api_key")==="test-secret","Bad API request");
    return Promise.resolve(new Response(JSON.stringify({search_metadata:{status:"Success"},search_information:{total_results:100}})));
  });
  assert(result.estimatedPages===100&&!JSON.stringify(result).includes("test-secret"),"Count result leaked credentials");
  const failed=await fetchCount(item,"test-secret",()=>{throw new Error("https://example.org?api_key=test-secret");});
  assert(!JSON.stringify(failed).includes("test-secret")&&failed.status==="request_failed","Network error leaked request URL");
});

Deno.test("frequency ranking is monotonic, keeps ties together and requires complete comparable coverage",()=>{
  const plan=buildPlan([1,2,3,4,5].map(id=>({id:String(id),diagnosis:`Bệnh thử ${id}`,aliases:""})));
  const records=plan.map((item,i)=>({...item,provider:"serpapi",status:"ok",estimatedPages:10**(i+1)}));
  const ranked=frequencyRanking(plan,records);
  assert(ranked.map(r=>r.webFrequencyHardness).join(",")==="5,4,3,2,1","Lower visibility not ranked harder");
  assert(frequencyRanking(plan,records.slice(1))===null,"Partial pilot reclassified the whole bank");
  const tied=records.map(r=>({...r,estimatedPages:100}));
  assert(frequencyRanking(plan,tied).every(r=>r.webFrequencyHardness===3),"Ties split by case order");
  assert(!cacheMatches({...records[0],settings:{...records[0].settings,lr:"lang_en"}},plan[0]),"Mismatched language reused from cache");
});

Deno.test("Serper result lists and missing totals cannot masquerade as web-wide counts",()=>{
  const item=buildPlan([{id:"1",diagnosis:"Lao phổi",aliases:""}],{},"serper")[0];
  const payload={searchParameters:item.settings,organic:Array.from({length:10},()=>({title:"page"})),credits:1};
  const missing=parseSerperCount(payload,item);
  assert(missing.status==="count_unavailable"&&missing.estimatedPages===null&&missing.returnedOrganicResults===10,"Returned list length became a total count");
  for(const raw of [12345,"12,345"])assert(parseSerperCount({...payload,searchInformation:{totalResults:raw}},item).estimatedPages===12345,"Explicit numeric total lost");
  for(const raw of [null,-1,"about 12,345",10.5,"12,34",Number.MAX_SAFE_INTEGER+1])assert(parseSerperCount({...payload,searchInformation:{totalResults:raw}},item).estimatedPages===null,"Invalid total accepted");
  assert(parseSerperCount({...payload,searchInformation:{totalResults:0}},item).status==="count_inconsistent","Zero with real pages accepted");
  assert(parseSerperCount({...payload,organic:[],searchInformation:{totalResults:0}},item).estimatedPages===0,"Explicit empty total rejected");
  assert(parseSerperCount({...payload,searchParameters:{...item.settings,q:"another disease"},searchInformation:{totalResults:123}},item).status==="query_changed","Rewritten query accepted");
  assert(parseSerperCount({...payload,statusCode:403,message:"secret"},item).status==="api_error","Provider error accepted");
});

Deno.test("Serper uses header authentication and records its actual language scope",async()=>{
  const item=buildPlan([{id:"1",diagnosis:"Lao phổi",aliases:""}],{},"serper")[0];
  assert(!("lr" in item.settings)&&item.languageRestriction.includes("not restricted"),"Unsent language restriction claimed");
  const result=await fetchCount(item,"test-secret",(url,options)=>{
    const body=JSON.parse(options.body);
    assert(url.href==="https://google.serper.dev/search"&&!url.href.includes("test-secret"),"Wrong endpoint or query-string secret");
    assert(options.method==="POST"&&options.headers["X-API-KEY"]==="test-secret","Missing Serper header auth");
    assert(body.q===item.query&&body.gl==="vn"&&body.hl==="vi"&&body.autocorrect===false&&body.num===10,"Wrong query settings");
    return Promise.resolve(new Response(JSON.stringify({searchParameters:body,organic:[{title:"page"}]})));
  });
  assert(result.status==="count_unavailable"&&!JSON.stringify(result).includes("test-secret"),"Missing count or credential handling incorrect");
  const failed=await fetchCount(item,"test-secret",()=>Promise.resolve(new Response("test-secret",{status:401})));
  assert(failed.status==="http_401"&&!JSON.stringify(failed).includes("test-secret"),"Provider error body leaked");
});

Deno.test("different search providers cannot be combined into a frequency ranking",()=>{
  const rows=[{id:"1",diagnosis:"Lao phổi",aliases:""}];
  const serpapi=buildPlan(rows),serper=buildPlan(rows,{},"serper");
  const record={...serpapi[0],status:"ok",estimatedPages:100};
  assert(!cacheMatches({...record,settings:serper[0].settings},serper[0]),"Other provider accepted with identical settings");
  assert(frequencyRanking(serper,[record])===null,"Mixed providers produced candidate hardness");
  assert(frequencyRanking(serper,[{...serper[0],status:"ok",estimatedPages:100}])[0].webFrequencyHardness===3,"Matching Serper record rejected");
  rejects(()=>buildPlan(rows,{},"unknown"));
});
