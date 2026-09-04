"use client";

import {Component,ReactNode,useEffect,useMemo,useState} from "react";

import {strToU8,zipSync} from "fflate";
import BenefitsManager from "./benefits-manager";
import {formatTrMoney} from "./tr-money";

import "./cost-management.css";

type Cost={gross:number;
net:number;
employeeSgk:number;
employeeUnemployment:number;
incomeTax:number;
stampTax:number;
employerSgkBeforeIncentive:number;
sgkIncentive:number;
employerSgk:number;
employerUnemployment:number;
meal:number;
travel:number;
health:number;
bes:number;
vehicle:number;
phone:number;
bonus:number;
otherBenefits:number;
benefits:number;
employerCost:number};

type Row=Cost&{id:number;
employeeNo:string;
name:string;
department:string;
position:string;
workType:string;
salaryBasis:string;
difference?:number};

type Group=Cost&{name:string;
count:number;
average:number;
share:number;
personnelShare:number;
minNet?:number;
maxNet?:number;
medianNet?:number;
averageNet?:number;
employees?:Row[]};

type Data={range:{from:string;
to:string};
summary:Cost&{employeeCount:number;
averageCost:number;
annualProjection:number};
details:Row[];
departments:Group[];
positions:Group[];
monthly:{label:string;
cost:number}[];
budget:{budget:number;
actual:number;
difference:number;
differenceRate:number};
filters:{departments:string[];
positions:string[]};
parameters:Record<string,unknown>[]};

type ReportKey="personnel_cost"|"department_cost"|"company_cost"|"position_salary_comparison"|"benefits_cost"|"sgk_employer_cost"|"tax_cost"|"budget_vs_actual";

type ReportData={reportKey:ReportKey;
title:string;
columns:string[];
rows:(string|number)[][];
totals:Record<string,number>;
companyName:string;
range:{from:string;
to:string};
filters:{department:string;
position:string;
employeeId:number}};

// Sicil Kartı ve Excel aktarım önizlemesiyle AYNI ortak formatTrMoney
// kullanılır (bkz. app/tr-money.ts) — para her yerde daima 2 kuruş
// hanesiyle gösterilsin diye. ₺ öneki mevcut tasarımdaki yerinde korunur.
const tl=(n=0)=>`₺${formatTrMoney(n)}`;

const today=new Date(),iso=(d:Date)=>d.toISOString().slice(0,10),monthStart=iso(new Date(today.getFullYear(),today.getMonth(),1)),monthEnd=iso(new Date(today.getFullYear(),today.getMonth()+1,0));

const tabs=["Genel Bakış","Maliyet Analizi","Bütçe","Gerçekleşen","Tahmini","Sapma Analizi","Pozisyon Karşılaştırması","Ücret Adaleti","Yan Haklar Yönetimi","Projeksiyon","Raporlar","Parametreler"];

const emptyCost:Cost={gross:0,net:0,employeeSgk:0,employeeUnemployment:0,incomeTax:0,stampTax:0,employerSgkBeforeIncentive:0,sgkIncentive:0,employerSgk:0,employerUnemployment:0,meal:0,travel:0,health:0,bes:0,vehicle:0,phone:0,bonus:0,otherBenefits:0,benefits:0,employerCost:0};
function normalizeData(value:unknown):Data{const v=value&&typeof value==="object"?value as Partial<Data>:{};return{range:v.range&&typeof v.range.from==="string"&&typeof v.range.to==="string"?v.range:{from:monthStart,to:monthEnd},summary:{...emptyCost,employeeCount:0,averageCost:0,annualProjection:0,...(v.summary||{})},details:Array.isArray(v.details)?v.details:[],departments:Array.isArray(v.departments)?v.departments:[],positions:Array.isArray(v.positions)?v.positions:[],monthly:Array.isArray(v.monthly)?v.monthly:[],budget:{budget:0,actual:0,difference:0,differenceRate:0,...(v.budget||{})},filters:{departments:Array.isArray(v.filters?.departments)?v.filters.departments:[],positions:Array.isArray(v.filters?.positions)?v.filters.positions:[]},parameters:Array.isArray(v.parameters)?v.parameters:[]}}

class CostModuleErrorBoundary extends Component<{children:ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return{failed:true}}componentDidCatch(error:Error){console.error("Ücret / Maliyet / Bütçe render hatası",error)}render(){if(this.state.failed)return <section className="panel cost-safe-error"><h3>Ücret / Maliyet / Bütçe</h3><p>Bu bölüm görüntülenirken bir sorun oluştu. Ana menü ve diğer modüller çalışmaya devam eder.</p><button onClick={()=>this.setState({failed:false})}>Tekrar Dene</button></section>;return this.props.children}}

export default function CostManagement(props:{act:(s:string)=>void}){return <CostModuleErrorBoundary><CostManagementContent {...props}/></CostModuleErrorBoundary>}
function CostManagementContent({act}:{act:(s:string)=>void}){const[tab,setTab]=useState("Genel Bakış"),[from,setFrom]=useState(monthStart),[to,setTo]=useState(monthEnd),[periodMode,setPeriodMode]=useState<"Ay"|"Yıl"|"Özel">("Ay"),[department,setDepartment]=useState(""),[position,setPosition]=useState(""),[employeeId,setEmployeeId]=useState(""),[data,setData]=useState<Data|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(""),[raise,setRaise]=useState(10),[newHires,setNewHires]=useState(0),[benefitIncrease,setBenefitIncrease]=useState(0);
async function load(){setLoading(true);
try{const q=new URLSearchParams({from,to});
if(department)q.set("department",department);
if(position)q.set("position",position);
if(employeeId)q.set("employeeId",employeeId);
const r=await fetch(`/api/personnel-costs?${q}`),j=await r.json();
if(!r.ok)throw new Error(j.error);
setData(normalizeData(j));
setError("")}catch(e){setError(e instanceof Error?e.message:"Maliyet verileri alınamadı")}finally{setLoading(false)}}useEffect(()=>{load()},[from,to,department,position,employeeId]);
function preset(kind:string){const d=new Date();
if(kind==="Bu Ay"){setFrom(iso(new Date(d.getFullYear(),d.getMonth(),1)));
setTo(iso(new Date(d.getFullYear(),d.getMonth()+1,0)))}if(kind==="Geçen Ay"){setFrom(iso(new Date(d.getFullYear(),d.getMonth()-1,1)));
setTo(iso(new Date(d.getFullYear(),d.getMonth(),0)))}if(kind==="YTD"){setFrom(`${d.getFullYear()}-01-01`);
setTo(iso(d))}if(kind==="Bu Yıl"){setFrom(`${d.getFullYear()}-01-01`);
setTo(`${d.getFullYear()}-12-31`)}}function csv(){if(!data)return;
const rows=[["Sicil No","Çalışan","Departman","Pozisyon","Net","Brüt","SGK İşveren","Yan Hak","Toplam Maliyet"],...data.details.map(x=>[x.employeeNo,x.name,x.department,x.position,x.net,x.gross,x.employerSgk+x.employerUnemployment,x.benefits,x.employerCost])],body=rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(";")).join("\n"),a=document.createElement("a");
a.href=URL.createObjectURL(new Blob(["\ufeff"+body],{type:"text/csv;charset=utf-8"}));
a.download=`mega-hrms-personel-maliyet-${from}-${to}.csv`;
a.click();
URL.revokeObjectURL(a.href);
act("Personel maliyet raporu Excel uyumlu olarak indirildi")}const projected=useMemo(()=>{if(!data)return 0;
const average=data.summary.averageCost||0;
return data.summary.employerCost*(1+raise/100)+(average*newHires)+(data.summary.benefits*benefitIncrease/100)},[data,raise,newHires,benefitIncrease]);
return <div className="workspace cost-shell">
<div className="workspace-head">
<div>
<span>MEGA HRMS / ÜCRET & MALİYET</span>
<h2>Personel Ücret ve İşveren Maliyeti</h2>
<p>Net/brüt dönüşümü, yasal yükler, yan haklar ve tarihsel maliyet tek hesaplama motorunda.</p>
</div>
</div>
<div className="cost-tabs">{tabs.map(x=>
<button key={x} className={tab===x?"active":""} onClick={()=>setTab(x)}>{x}</button>)}</div>
<section className="cost-filter panel">
<div className="presets period-modes">{(["Ay","Yıl","Özel"] as const).map(x=><button key={x} className={periodMode===x?"active":""} onClick={()=>{setPeriodMode(x);if(x==="Ay")preset("Bu Ay");if(x==="Yıl")preset("Bu Yıl")}}>{x==="Özel"?"Özel Tarih Aralığı":x}</button>)}{["Bu Ay","Geçen Ay","YTD","Bu Yıl"].map(x=>
<button key={x} onClick={()=>preset(x)}>{x==="YTD"?"Yıl Başından Bugüne":x}</button>)}</div>
<label>
<span>Başlangıç</span>
<input type="date" value={from} onChange={e=>setFrom(e.target.value)}/>
</label>
<label>
<span>Bitiş</span>
<input type="date" value={to} onChange={e=>setTo(e.target.value)}/>
</label>
<label>
<span>Departman</span>
<select value={department} onChange={e=>setDepartment(e.target.value)}>
<option value="">Tümü</option>{data?.filters.departments.map(x=>
<option key={x}>{x}</option>)}</select>
</label>
<label>
<span>Pozisyon</span>
<select value={position} onChange={e=>setPosition(e.target.value)}>
<option value="">Tümü</option>{data?.filters.positions.map(x=>
<option key={x}>{x}</option>)}</select>
</label>
<label>
<span>Çalışan</span>
<select value={employeeId} onChange={e=>setEmployeeId(e.target.value)}>
<option value="">Tümü</option>{data?.details.map(x=><option key={x.id} value={x.id}>{x.name} · {x.employeeNo}</option>)}</select>
</label>
</section>{error&&<div className="form-error">{error}</div>}{loading?<div className="panel loading">Maliyetler hesaplanıyor…</div>:!data?<div className="panel empty-state">Veri bulunamadı.</div>:<>{tab==="Genel Bakış"&&<SafeDashboardView data={data}/>} {tab==="Maliyet Analizi"&&<PeopleView rows={data.details}/>} {["Bütçe","Gerçekleşen","Tahmini","Sapma Analizi"].includes(tab)&&<DeferredBudgetView tab={tab}/>} {tab==="Pozisyon Karşılaştırması"&&<PositionView rows={data.positions}/>} {tab==="Ücret Adaleti"&&<EquityView rows={data.positions}/>} {tab==="Yan Haklar Yönetimi"&&<BenefitsManager act={act}/>} {tab==="Projeksiyon"&&<ProjectionView data={data} raise={raise} setRaise={setRaise} newHires={newHires} setNewHires={setNewHires} benefitIncrease={benefitIncrease} setBenefitIncrease={setBenefitIncrease} projected={projected}/>} {tab==="Parametreler"&&<ParametersView data={data} reload={load}/>} {tab==="Raporlar"&&<ReportsView from={from} to={to} department={department} position={position} employeeId={employeeId} act={act}/>}</>}</div>}

function num(value:unknown){const n=Number(value);return Number.isFinite(n)?n:0}
function textValue(value:unknown,fallback="Tanımsız"){const valueText=String(value??"").trim();return valueText||fallback}
function SafeDashboardView({data}:{data:Data}){const[selectedDepartment,setSelectedDepartment]=useState<Group|null>(null),[selectedPerson,setSelectedPerson]=useState<Row|null>(null),summary=data?.summary||({...emptyCost,employeeCount:0,averageCost:0,annualProjection:0}),details=(Array.isArray(data?.details)?data.details:[]).filter(Boolean).map(row=>({...row,name:textValue(row?.name,"İsimsiz Personel"),employeeNo:textValue(row?.employeeNo,"—"),department:textValue(row?.department,"Atanmamış"),position:textValue(row?.position,"Atanmamış"),net:num(row?.net),gross:num(row?.gross),employerSgk:num(row?.employerSgk),employerUnemployment:num(row?.employerUnemployment),benefits:num(row?.benefits),employerCost:num(row?.employerCost)})),departments=(Array.isArray(data?.departments)?data.departments:[]).filter(Boolean).map(row=>({...row,name:textValue(row?.name,"Atanmamış"),count:num(row?.count),net:num(row?.net),gross:num(row?.gross),incomeTax:num(row?.incomeTax),stampTax:num(row?.stampTax),employerSgk:num(row?.employerSgk),employerUnemployment:num(row?.employerUnemployment),benefits:num(row?.benefits),employerCost:num(row?.employerCost),average:num(row?.average),personnelShare:num(row?.personnelShare)})),departmentRows=selectedDepartment?details.filter(row=>row.department===selectedDepartment.name):[],max=Math.max(1,...departments.map(row=>row.employerCost));return <><section className="cost-kpis"><article><small>Toplam Çalışan</small><strong>{num(summary.employeeCount)}</strong><span>Seçilen dönemde aktif</span></article><article><small>Toplam Net Ücret</small><strong>{tl(num(summary.net))}</strong><span>Personel ödemesi</span></article><article><small>Bordro Brütü</small><strong>{tl(num(summary.gross))}</strong><span>Hesaplanan brüt ücret</span></article><article className="accent"><small>Toplam İşveren Maliyeti</small><strong>{tl(num(summary.employerCost))}</strong><span>Kişi ort. {tl(num(summary.averageCost))}</span></article><article><small>SGK İşveren Maliyeti</small><strong>{tl(num(summary.employerSgk)+num(summary.employerUnemployment))}</strong><span>Teşvik sonrası</span></article><article><small>Yıllık Projeksiyon</small><strong>{tl(num(summary.annualProjection))}</strong><span>Seçilen dönem temposu</span></article></section><section className="cost-grid"><article className="panel cost-card wide"><header><div><strong>Departman Bazlı Personel ve Maliyet Dağılımı</strong><small>Şirket → Departman → Personel maliyet incelemesi</small></div></header>{departments.length?departments.map(row=><button className="cost-bar cost-bar-button" key={row.name} onClick={()=>{setSelectedDepartment(row);setSelectedPerson(null)}}><div><b>{row.name.toLocaleUpperCase("tr-TR")}</b><span>{row.count} personel • %{row.personnelShare}</span></div><i><em style={{width:`${Math.max(0,row.employerCost/max*100)}%`}}/></i><strong>{tl(row.employerCost)}</strong></button>):<p className="empty-state">Departman maliyet verisi bulunamadı.</p>}</article><article className="panel cost-card"><header><div><strong>Maliyet Kalemleri</strong><small>Merkezi bordro hesaplaması</small></div></header>{[["Bordro Brütü",num(summary.gross)],["SGK + İşsizlik",num(summary.employerSgk)+num(summary.employerUnemployment)],["Vergi / Yasal Kesinti",num(summary.incomeTax)+num(summary.stampTax)],["Yan Haklar",num(summary.benefits)]].map(([name,value])=><div className="part" key={String(name)}><span>{name}</span><b>{tl(Number(value))}</b></div>)}<div className="cost-total"><span>Toplam işveren maliyeti</span><strong>{tl(num(summary.employerCost))}</strong></div></article></section>{selectedDepartment&&<div className="modal-backdrop cost-drill-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget){setSelectedDepartment(null);setSelectedPerson(null)}}}><section className="cost-drill-modal"><header><div><span>DEPARTMAN MALİYET DETAYI</span><h2>{selectedDepartment.name.toLocaleUpperCase("tr-TR")} DEPARTMANI</h2><p>{textValue(data?.range?.from,"—")} – {textValue(data?.range?.to,"—")}</p></div><button onClick={()=>{setSelectedDepartment(null);setSelectedPerson(null)}}>×</button></header><section className="cost-drill-kpis"><article><small>Toplam Personel</small><strong>{selectedDepartment.count}</strong></article><article><small>Toplam Net Ücret</small><strong>{tl(selectedDepartment.net)}</strong></article><article><small>Toplam Brüt Ücret</small><strong>{tl(selectedDepartment.gross)}</strong></article><article><small>SGK İşveren Maliyeti</small><strong>{tl(selectedDepartment.employerSgk+selectedDepartment.employerUnemployment)}</strong></article><article><small>Vergi / Yasal Kesinti</small><strong>{tl(selectedDepartment.incomeTax+selectedDepartment.stampTax)}</strong></article><article><small>Yan Haklar</small><strong>{tl(selectedDepartment.benefits)}</strong></article><article className="accent"><small>Toplam İşveren Maliyeti</small><strong>{tl(selectedDepartment.employerCost)}</strong></article></section><div className="cost-drill-table"><div className="cost-drill-row head"><span>Personel / Pozisyon</span><span>Net Ücret</span><span>Brüt Ücret</span><span>SGK İşveren</span><span>Yan Haklar</span><span>Toplam Maliyet</span></div>{departmentRows.length?departmentRows.map(row=><button className="cost-drill-row" key={row.id} onClick={()=>setSelectedPerson(row)}><span><b>{row.name}</b><small>{row.position}</small></span><span>{tl(row.net)}</span><span>{tl(row.gross)}</span><span>{tl(row.employerSgk+row.employerUnemployment)}</span><span>{tl(row.benefits)}</span><strong>{tl(row.employerCost)}</strong></button>):<p className="empty-state">Bu departmanda personel maliyet kaydı bulunamadı.</p>}</div>{selectedPerson&&<PersonCostDetail row={selectedPerson} close={()=>setSelectedPerson(null)} excel={()=>{}} pdf={()=>{}}/>}</section></div>}</>}
function DeferredBudgetView({tab}:{tab:string}){return <section className="panel empty-state"><h3>{tab}</h3><p>Genel maliyet dashboard’u güvenli biçimde çalışıyor. Bu bölüm, dashboard’dan bağımsız olarak yeniden doğrulanacaktır.</p></section>}
function DashboardView({data,act}:{data:Data;act:(s:string)=>void}){const[selectedDepartment,setSelectedDepartment]=useState<Group|null>(null),[selectedPerson,setSelectedPerson]=useState<Row|null>(null),s=data.summary,max=Math.max(1,...data.departments.map(x=>x.employerCost)),parts=[{n:"Brüt Ücret",v:s.gross,c:"#1d4ed8"},{n:"SGK + İşsizlik",v:s.employerSgk+s.employerUnemployment,c:"#7c3aed"},{n:"Vergi / Yasal Kesinti",v:s.incomeTax+s.stampTax,c:"#ea580c"},{n:"Yan Haklar",v:s.benefits,c:"#059669"}];
const departmentRows=selectedDepartment?data.details.filter(x=>x.department===selectedDepartment.name):[];
function exportLevel(level:"company"|"department"|"person",format:"excel"|"pdf"){const rows=level==="company"?data.details:level==="department"?departmentRows:selectedPerson?[selectedPerson]:[],title=level==="company"?"Şirket Personel Maliyet Raporu":level==="department"?`${selectedDepartment?.name} Departmanı Maliyet Raporu`:`${selectedPerson?.name} Personel Maliyet Detayı`,head=["Personel","Pozisyon","Net Ücret","Brüt Ücret","SGK İşveren","Yan Haklar","Toplam İşveren Maliyeti"],body=rows.map(x=>[x.name,x.position,x.net,x.gross,x.employerSgk+x.employerUnemployment,x.benefits,x.employerCost]);if(format==="excel"){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\ufeff"+[[title],[`Dönem: ${data.range.from} - ${data.range.to}`],head,...body].map(r=>r.map(v=>`\"${String(v).replaceAll('"','""')}\"`).join("\t")).join("\n")],{type:"application/vnd.ms-excel"}));a.download=`${title.replaceAll(" ","_")}_${data.range.from}_${data.range.to}.xls`;a.click();URL.revokeObjectURL(a.href)}else downloadSimplePdf(title,data.range,head,body);act(`${title} ${format==="excel"?"Excel":"PDF"} olarak indirildi`)}
return <><>
<section className="cost-kpis">
<article>
<small>Toplam Çalışan</small>
<strong>{s.employeeCount}</strong>
<span>Seçilen dönemde aktif</span>
</article>
<article>
<small>Toplam Net Ücret</small>
<strong>{tl(s.net)}</strong>
<span>Personel ödemesi</span>
</article>
<article>
<small>Toplam Brüt Ücret</small>
<strong>{tl(s.gross)}</strong>
<span>Bordro brütü</span>
</article>
<article className="accent">
<small>Toplam İşveren Maliyeti</small>
<strong>{tl(s.employerCost)}</strong>
<span>Kişi ort. {tl(s.averageCost)}</span>
</article>
<article>
<small>Yıllık Projeksiyon</small>
<strong>{tl(s.annualProjection)}</strong>
<span>Seçilen dönem temposu</span>
</article>
<article>
<small>SGK İşveren Maliyeti</small>
<strong>{tl(s.employerSgk+s.employerUnemployment)}</strong>
<span>Teşvik sonrası</span>
</article>
</section>
<section className="cost-grid">
<article className="panel cost-card wide">
<header>
<div>
<strong>Departman Bazlı Personel ve Maliyet Dağılımı</strong>
<small>Şirket → Departman → Personel maliyet incelemesi</small>
</div>
</header><div className="cost-dashboard-actions"><button onClick={()=>exportLevel("company","excel")}>Şirket Excel</button><button onClick={()=>exportLevel("company","pdf")}>Şirket PDF</button></div>{data.departments.map(x=>
<button className="cost-bar cost-bar-button" key={x.name} onClick={()=>setSelectedDepartment(x)}>
<div>
<b>{x.name.toLocaleUpperCase("tr-TR")}</b>
<span>{x.count} personel • %{x.personnelShare}</span>
</div>
<i>
<em style={{width:`${x.employerCost/max*100}%`}}/>
</i>
<strong>{tl(x.employerCost)}</strong>
</button>)}</article>
<article className="panel cost-card">
<header>
<div>
<strong>Maliyet Kalemleri</strong>
<small>Vergiler bilgi amaçlı;
 işveren toplamına ikinci kez eklenmez</small>
</div>
</header>{parts.map(x=>
<div className="part" key={x.n}>
<i style={{background:x.c}}/>
<span>{x.n}</span>
<b>{tl(x.v)}</b>
</div>)}<div className="cost-total">
<span>Toplam işveren maliyeti</span>
<strong>{tl(s.employerCost)}</strong>
</div>
</article>
</section>
<section className="panel cost-card">
<header>
<div>
<strong>Aylık Maliyet Trendi</strong>
<small>{data.range.from} – {data.range.to}</small>
</div>
</header>
<div className="trend">{data.monthly.map((x,i)=>
<div key={i}>
<span style={{height:`${Math.max(8,x.cost/Math.max(...data.monthly.map(m=>m.cost),1)*100)}%`}}/>
<b>{x.label}</b>
<small>{tl(x.cost)}</small>
</div>)}</div>
</section>
</>{selectedDepartment&&<div className="modal-backdrop cost-drill-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget){setSelectedDepartment(null);setSelectedPerson(null)}}}><section className="cost-drill-modal"><header><div><span>DEPARTMAN MALİYET DETAYI</span><h2>{selectedDepartment.name.toLocaleUpperCase("tr-TR")} DEPARTMANI</h2><p>{data.range.from} – {data.range.to}</p></div><button onClick={()=>{setSelectedDepartment(null);setSelectedPerson(null)}}>×</button></header><section className="cost-drill-kpis"><article><small>Toplam Personel</small><strong>{selectedDepartment.count}</strong></article><article><small>Toplam Net Ücret</small><strong>{tl(selectedDepartment.net)}</strong></article><article><small>Toplam Brüt Ücret</small><strong>{tl(selectedDepartment.gross)}</strong></article><article><small>SGK İşveren Maliyeti</small><strong>{tl(selectedDepartment.employerSgk+selectedDepartment.employerUnemployment)}</strong></article><article><small>Vergi / Yasal Kesinti</small><strong>{tl(selectedDepartment.incomeTax+selectedDepartment.stampTax)}</strong></article><article><small>Yan Haklar</small><strong>{tl(selectedDepartment.benefits)}</strong></article><article><small>Kişi Başı Ortalama</small><strong>{tl(selectedDepartment.average)}</strong></article><article className="accent"><small>Toplam İşveren Maliyeti</small><strong>{tl(selectedDepartment.employerCost)}</strong></article></section><div className="cost-drill-actions"><button onClick={()=>exportLevel("department","excel")}>Departman Excel</button><button onClick={()=>exportLevel("department","pdf")}>Departman PDF</button></div><div className="cost-drill-table"><div className="cost-drill-row head"><span>Personel / Pozisyon</span><span>Net Ücret</span><span>Brüt Ücret</span><span>SGK İşveren</span><span>Yan Haklar</span><span>Toplam Maliyet</span></div>{departmentRows.map(x=><button className="cost-drill-row" key={x.id} onClick={()=>setSelectedPerson(x)}><span><b>{x.name}</b><small>{x.position}</small></span><span>{tl(x.net)}</span><span>{tl(x.gross)}</span><span>{tl(x.employerSgk+x.employerUnemployment)}</span><span>{tl(x.benefits)}</span><strong>{tl(x.employerCost)}</strong></button>)}</div>{selectedPerson&&<PersonCostDetail row={selectedPerson} close={()=>setSelectedPerson(null)} excel={()=>exportLevel("person","excel")} pdf={()=>exportLevel("person","pdf")}/>}</section></div>}
</>}
function PersonCostDetail({row,close,excel,pdf}:{row:Row;close:()=>void;excel:()=>void;pdf:()=>void}){const items=[["Net Ücret",row.net],["Brüt Ücret",row.gross],["SGK İşçi Payı",row.employeeSgk],["İşsizlik İşçi Payı",row.employeeUnemployment],["Gelir Vergisi",row.incomeTax],["Damga Vergisi",row.stampTax],["SGK İşveren Payı",row.employerSgk],["İşsizlik İşveren Payı",row.employerUnemployment],["İşveren Teşvik / İndirimi",row.sgkIncentive],["Yemek",row.meal],["Yol",row.travel],["Yakıt / Diğer",row.otherBenefits],["Araç",row.vehicle],["Özel Sağlık Sigortası",row.health],["Hayat Sigortası / BES",row.bes],["Telefon / İletişim",row.phone],["Prim / Bonus",row.bonus],["Ek Ödemeler",0],["Diğer İşveren Maliyetleri",0]] as [string,number][];return <aside className="person-cost-detail"><header><div><span>PERSONEL MALİYET DETAYI</span><h2>{row.name}</h2><p>{row.position} · {row.department}</p></div><button onClick={close}>×</button></header><div className="person-cost-items">{items.map(([name,value])=><div key={name}><span>{name}</span><strong>{tl(value)}</strong></div>)}</div><section className="person-cost-totals"><div><span>Aylık Toplam İşveren Maliyeti</span><strong>{tl(row.employerCost)}</strong></div><div><span>Yıllık Projeksiyon</span><strong>{tl(row.employerCost*12)}</strong></div></section><footer><button onClick={excel}>Personel Excel</button><button onClick={pdf}>Personel PDF</button></footer></aside>}
function downloadSimplePdf(title:string,range:{from:string;to:string},head:string[],rows:(string|number)[][]){const ascii=(v:unknown)=>String(v??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[\\()]/g," ").replace(/[^\x20-\x7E]/g,"?"),lines=["MEGA HRMS Professional",title,`Donem: ${range.from} - ${range.to}`,`Rapor tarihi: ${new Date().toLocaleString("tr-TR")}`,head.join(" | "),...rows.map(r=>r.map(v=>typeof v==="number"?v.toFixed(2):v).join(" | "))],stream=`BT /F1 9 Tf 32 560 Td ${lines.slice(0,30).map((l,i)=>`${i?"0 -17 Td ":""}(${ascii(l).slice(0,155)}) Tj`).join("\n")} ET`,objs=["","<< /Type /Catalog /Pages 2 0 R >>","<< /Type /Pages /Kids [4 0 R] /Count 1 >>","<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>","<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 3 0 R >> >> /Contents 5 0 R >>",`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`];let pdf="%PDF-1.4\n",offset=[0];for(let i=1;i<objs.length;i++){offset[i]=pdf.length;pdf+=`${i} 0 obj\n${objs[i]}\nendobj\n`}const xref=pdf.length;pdf+=`xref\n0 ${objs.length}\n0000000000 65535 f \n${offset.slice(1).map(x=>String(x).padStart(10,"0")+" 00000 n \n").join("")}trailer\n<< /Size ${objs.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([pdf],{type:"application/pdf"}));a.download=`${title.replaceAll(" ","_")}_${range.from}_${range.to}.pdf`;a.click();URL.revokeObjectURL(a.href)}
function PeopleView({rows}:{rows:Row[]}){return <section className="panel cost-table">
<header>
<div>
<strong>Personel Bazlı Maliyet</strong>
<small>{rows.length} sicil kaydı · gerçek merkezi personel verisi</small>
</div>
</header>
<div className="cost-tr head">
<span>Personel</span>
<span>Net / Brüt</span>
<span>SGK İşveren</span>
<span>Yan Haklar</span>
<span>Toplam</span>
</div>{rows.map(x=>
<div className="cost-tr" key={x.id}>
<span>
<b>{x.name}</b>
<small>{x.employeeNo} · {x.department}<br/>{x.position} · {x.salaryBasis}</small>
</span>
<span>{tl(x.net)}<small>{tl(x.gross)} brüt</small>
</span>
<span>{tl(x.employerSgk+x.employerUnemployment)}<small>Teşvik sonrası</small>
</span>
<span>{tl(x.benefits)}<small>Yemek {tl(x.meal)} · Yol {tl(x.travel)}</small>
</span>
<span>
<b>{tl(x.employerCost)}</b>
</span>
</div>)}</section>}
function DepartmentView({rows}:{rows:Group[]}){return <section className="panel cost-table">
<header>
<div>
<strong>Departman Maliyet Analizi</strong>
<small>Kişi sayısı, toplam ve kişi başı maliyet</small>
</div>
</header>
<div className="cost-tr dept head">
<span>Departman</span>
<span>Personel</span>
<span>Net / Brüt</span>
<span>SGK + Yan Hak</span>
<span>Aylık Toplam</span>
<span>Pay</span>
</div>{rows.map(x=>
<div className="cost-tr dept" key={x.name}>
<span>
<b>{x.name}</b>
</span>
<span>{x.count}</span>
<span>{tl(x.net)}<small>{tl(x.gross)} brüt</small>
</span>
<span>{tl(x.employerSgk+x.employerUnemployment+x.benefits)}</span>
<span>
<b>{tl(x.employerCost)}</b>
<small>Kişi başı {tl(x.average)}</small>
</span>
<span>%{x.share}</span>
</div>)}</section>}
function PositionView({rows}:{rows:Group[]}){return <div className="position-cards">{rows.map(x=>
<section className="panel position-card" key={x.name}>
<header>
<div>
<strong>{x.name}</strong>
<small>{x.count} çalışan · Ortalama işveren maliyeti {tl(x.average)}</small>
</div>
</header>
<div className="position-stats">
<span>Min net <b>{tl(x.minNet)}</b>
</span>
<span>Medyan net <b>{tl(x.medianNet)}</b>
</span>
<span>Ort. net <b>{tl(x.averageNet)}</b>
</span>
<span>Maks. net <b>{tl(x.maxNet)}</b>
</span>
</div>{x.employees?.map(e=>
<div className="position-person" key={e.id}>
<span>{e.name}<small>{e.department}</small>
</span>
<b>{tl(e.net)}</b>
<em className={(e.difference||0)>10?"high":(e.difference||0)<-10?"low":""}>{(e.difference||0)>0?"+":""}{e.difference}%</em>
</div>)}</section>)}</div>}
function EquityView({rows}:{rows:Group[]}){const flags=rows.flatMap(p=>(p.employees||[]).filter(e=>Math.abs(e.difference||0)>=10).map(e=>({...e,group:p.name})));
return <section className="panel cost-table">
<header>
<div>
<strong>Ücret Dağılımı ve Adalet Analizi</strong>
<small>Karar önermez;
 aynı pozisyon ortalamasından ±%10 üzerindeki farkları işaretler.</small>
</div>
<span className="warning-badge">{flags.length} inceleme</span>
</header>{flags.length===0?<div className="empty-cost">Belirgin ücret farkı bulunmadı.</div>:flags.map(x=>
<div className="equity-row" key={x.id}>
<span>
<b>{x.name}</b>
<small>{x.group} · {x.department}</small>
</span>
<span>{tl(x.net)}</span>
<em className={(x.difference||0)>0?"high":"low"}>{(x.difference||0)>0?"+":""}{x.difference}%</em>
<button>İncele</button>
</div>)}</section>}
function ProjectionView({data,raise,setRaise,newHires,setNewHires,benefitIncrease,setBenefitIncrease,projected}:{data:Data;
raise:number;
setRaise:(n:number)=>void;
newHires:number;
setNewHires:(n:number)=>void;
benefitIncrease:number;
setBenefitIncrease:(n:number)=>void;
projected:number}){return <section className="projection">
<div className="panel scenario-controls">
<h3>Gerçek kayıtları değiştirmeyen senaryo</h3>
<label>Ücret artışı <b>%{raise}</b>
<input type="range" min="0" max="50" value={raise} onChange={e=>setRaise(Number(e.target.value))}/>
</label>
<label>Yeni işe alım <b>{newHires} kişi</b>
<input type="range" min="0" max="50" value={newHires} onChange={e=>setNewHires(Number(e.target.value))}/>
</label>
<label>Yan hak artışı <b>%{benefitIncrease}</b>
<input type="range" min="0" max="50" value={benefitIncrease} onChange={e=>setBenefitIncrease(Number(e.target.value))}/>
</label>
</div>
<div className="panel scenario-result">
<span>Mevcut dönem maliyeti</span>
<strong>{tl(data.summary.employerCost)}</strong>
<span>Yeni dönem maliyeti</span>
<strong>{tl(projected)}</strong>
<em>Fark {tl(projected-data.summary.employerCost)}</em>
<small>Simülasyon;
 bordro ve sicil ücretlerini değiştirmez.</small>
</div>
</section>}
function ParametersView({data,reload}:{data:Data;
reload:()=>void}){const[saving,setSaving]=useState(false),[message,setMessage]=useState(""),current=data.parameters[0]||{},bp=(key:string,fallback:number)=>{const raw=Number(current[key]);
return String(Number.isFinite(raw)&&raw>0?(key==="stampTaxRate"&&raw>100?raw/1000:raw/100):fallback)},brackets=String(current.incomeTaxBrackets||JSON.stringify([{limit:158000,rate:15},{limit:330000,rate:20},{limit:1200000,rate:27},{limit:4300000,rate:35},{limit:null,rate:40}],null,2));
async function save(e:React.FormEvent<HTMLFormElement>){e.preventDefault();
setSaving(true);
setMessage("");
const p=Object.fromEntries(new FormData(e.currentTarget).entries());
const r=await fetch("/api/personnel-costs",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({...p,action:"parameters"})}),j=await r.json();
setSaving(false);
if(!r.ok){setMessage(j.error||"Parametreler kaydedilemedi");
return}setMessage("Yeni parametre sürümü kaydedildi. Geçmiş bordrolar önceki sürümle korunur.");
reload()}return <form className="panel legal-form" onSubmit={save}>
<header>
<div>
<strong>Bordro ve Yasal Parametreler</strong>
<small>Oranları doğrudan yüzde olarak girin. Örnek: %14, %21,75 veya damga vergisi için %0,759.</small>
</div>
<span className="version-badge">Tarihsel sürümleme aktif</span>
</header>{message&&<div className={message.includes("kaydedildi")?"legal-success":"form-error"}>{message}</div>}<h3>Dönem ve SGK Matrahı</h3>
<div className="legal-grid">
<label>Yıl<input name="year" type="number" defaultValue={String(current.year||2026)} required/>
</label>
<label>Geçerlilik Başlangıcı<input name="effectiveFrom" type="date" defaultValue={String(current.effectiveFrom||"2026-01-01")} required/>
</label>
<label>Geçerlilik Bitişi<input name="effectiveTo" type="date" defaultValue={String(current.effectiveTo||"")}/>
</label>
<label>Brüt Asgari Ücret<input name="minimumWage" type="number" min="0.01" step="0.01" defaultValue={String(current.minimumWage||33030)} required/>
</label>
<label>SGK Prime Esas Alt Sınır<input name="sgkFloor" type="number" min="0.01" step="0.01" defaultValue={String(current.sgkFloor||33030)} required/>
</label>
<label>SGK Prime Esas Üst Sınır<input name="sgkCeiling" type="number" min="0.01" step="0.01" defaultValue={String(current.sgkCeiling||297270)} required/>
</label>
</div>
<h3>Prim ve Vergi Oranları (%)</h3>
<div className="legal-grid">
<Percent label="İşçi SGK" name="employeeSgkRate" value={bp("employeeSgkRate",14)}/>
<Percent label="İşveren SGK" name="employerSgkRate" value={bp("employerSgkRate",21.75)}/>
<Percent label="İşçi İşsizlik" name="employeeUnemploymentRate" value={bp("employeeUnemploymentRate",1)}/>
<Percent label="İşveren İşsizlik" name="employerUnemploymentRate" value={bp("employerUnemploymentRate",2)}/>
<Percent label="SGK Teşvik" name="employerIncentiveRate" value={bp("employerIncentiveRate",5)}/>
<Percent label="Damga Vergisi" name="stampTaxRate" value={bp("stampTaxRate",0.759)}/>
<Percent label="Emekli İşçi SGDP" name="employeeSgdpRate" value={bp("employeeSgdpRate",7.5)}/>
<Percent label="Emekli İşveren SGDP" name="employerSgdpRate" value={bp("employerSgdpRate",24.75)}/>
</div>
<h3>Asgari Ücret ve Yan Hak İstisnaları</h3>
<div className="legal-grid">
<Money label="Asgari Ücret Gelir Vergisi İstisnası" name="minimumWageIncomeTaxExemption" value={current.minimumWageIncomeTaxExemption}/>
<Money label="Asgari Ücret Damga Vergisi İstisnası" name="minimumWageStampTaxExemption" value={current.minimumWageStampTaxExemption}/>
<Money label="Yemek SGK Günlük İstisnası" name="mealSgkDailyExemption" value={current.mealSgkDailyExemption}/>
<Money label="Yemek Vergi Günlük İstisnası" name="mealTaxDailyExemption" value={current.mealTaxDailyExemption}/>
<Money label="Yol SGK Günlük İstisnası" name="travelSgkDailyExemption" value={current.travelSgkDailyExemption}/>
<Money label="Yol Vergi Günlük İstisnası" name="travelTaxDailyExemption" value={current.travelTaxDailyExemption}/>
</div>
<h3>Gelir Vergisi Dilimleri</h3>
<label className="tax-brackets">Dilimler (JSON)<textarea name="incomeTaxBrackets" rows={7} defaultValue={brackets} required/>
<small>Her dilim için üst sınır ve yüzde oranı tanımlanır. Son dilimin sınırı null olmalıdır.</small>
</label>
<div className="legal-history">
<strong>Parametre Geçmişi</strong>{data.parameters.length?data.parameters.map((x,i)=>
<span key={i}>
<b>{String(x.year)}</b> · {String(x.effectiveFrom)} – {String(x.effectiveTo||"Devam ediyor")}</span>):<span>Henüz kayıtlı sürüm yok.</span>}</div>
<button className="primary" disabled={saving}>{saving?"Kaydediliyor…":"Yeni Parametre Sürümünü Kaydet"}</button>
</form>}
function Percent({label,name,value}:{label:string;
name:string;
value:string}){return <label>{label}<span className="percent-input">
<input name={name} type="number" min="0" max="100" step="0.001" defaultValue={value} required/>
<i>%</i>
</span>
</label>}
function Money({label,name,value}:{label:string;
name:string;
value:unknown}){return <label>{label}<input name={name} type="number" min="0" step="0.01" defaultValue={String(value||0)}/>
</label>}
function ReportsView({from,to,department,position,employeeId,act}:{from:string;to:string;department:string;position:string;employeeId:string;act:(s:string)=>void}){const[open,setOpen]=useState<ReportData|null>(null),[busy,setBusy]=useState<ReportKey|null>(null),reports:{key:ReportKey;title:string;desc:string}[]=[{key:"personnel_cost",title:"Personel Maliyet Raporu",desc:"Çalışan bazında ücret, kesinti ve toplam maliyet"},{key:"department_cost",title:"Departman Maliyet Raporu",desc:"Departman toplamları ve kişi başı ortalama"},{key:"company_cost",title:"Şirket Personel Maliyet Raporu",desc:"Şirket aylık ve yıllık maliyet özeti"},{key:"position_salary_comparison",title:"Pozisyon Ücret Karşılaştırma Raporu",desc:"Min, maks, ortalama, medyan ve sapma"},{key:"benefits_cost",title:"Yan Haklar Maliyet Raporu",desc:"Yemek, yol, sigorta, prim, araç ve diğerleri"},{key:"sgk_employer_cost",title:"SGK İşveren Maliyet Raporu",desc:"Matrah, teşvik öncesi ve sonrası primler"},{key:"tax_cost",title:"Vergi Maliyet Raporu",desc:"Matrah, dilim, gelir ve damga vergisi"},{key:"budget_vs_actual",title:"Bütçe / Gerçekleşen Raporu",desc:"Plan, gerçekleşen, fark ve sapma"}];
async function get(key:ReportKey){setBusy(key);try{const q=new URLSearchParams({reportKey:key,from,to});if(department)q.set("department",department);if(position)q.set("position",position);if(employeeId)q.set("employeeId",employeeId);const r=await fetch(`/api/personnel-cost-reports?${q}`),j=await r.json();if(!r.ok)throw new Error(j.error);return j as ReportData}finally{setBusy(null)}}
async function view(key:ReportKey){try{setOpen(await get(key))}catch(e){act(e instanceof Error?e.message:"Rapor oluşturulamadı")}}
async function excel(key:ReportKey){try{const d=await get(key);downloadXlsx(d);act(`${d.title} Excel olarak indirildi`)}catch(e){act(e instanceof Error?e.message:"Excel oluşturulamadı")}}
async function pdf(key:ReportKey){try{const d=await get(key);downloadPdf(d);act(`${d.title} PDF olarak indirildi`)}catch(e){act(e instanceof Error?e.message:"PDF oluşturulamadı")}}
return <><section className="report-grid">{reports.map(r=><article className="panel" key={r.key} data-report-key={r.key}><i>▤</i><strong>{r.title}</strong><small>{r.desc}<br/>Aktif tarih ve filtrelerle hazırlanır.</small><div><button onClick={()=>view(r.key)} disabled={busy===r.key}>Görüntüle</button><button onClick={()=>excel(r.key)} disabled={busy===r.key}>Excel</button><button onClick={()=>pdf(r.key)} disabled={busy===r.key}>PDF</button></div></article>)}</section>{open&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setOpen(null)}}><section className="report-preview"><header><div><span>{open.reportKey}</span><h2>{open.title}</h2><p>{open.companyName} · {open.range.from} – {open.range.to}</p></div><button onClick={()=>setOpen(null)}>×</button></header><div className="report-preview-actions"><button onClick={()=>downloadXlsx(open)}>Excel İndir</button><button onClick={()=>downloadPdf(open)}>PDF İndir</button></div><div className="report-table-wrap"><table><thead><tr>{open.columns.map(c=><th key={c}>{c}</th>)}</tr></thead><tbody>{open.rows.map((row,i)=><tr key={i}>{row.map((v,j)=><td key={j}>{typeof v==="number"?new Intl.NumberFormat("tr-TR",{maximumFractionDigits:2}).format(v):v}</td>)}</tr>)}</tbody></table></div><footer><b>Genel Toplam</b>{Object.entries(open.totals).map(([k,v])=><span key={k}>{k}: {new Intl.NumberFormat("tr-TR",{maximumFractionDigits:2}).format(v)}</span>)}</footer></section></div>}</>}
function safeName(d:ReportData,ext:string){const month=(d.range.from||new Date().toISOString().slice(0,7)).slice(0,7),base=d.title.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/ı/g,"i").replace(/[^a-zA-Z0-9]+/g,"_").replace(/^_|_$/g,"");return `${base}_${month}.${ext}`}
function download(blob:Blob,name:string){const a=document.createElement("a"),url=URL.createObjectURL(blob);a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function xml(v:unknown){return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}
function downloadXlsx(d:ReportData){const all=[d.columns,...d.rows,["GENEL TOPLAM",...Object.entries(d.totals).map(([k,v])=>`${k}: ${v}`)]],sheet=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${all.map((row,i)=>`<row r="${i+1}">${row.map((v,j)=>{const col=String.fromCharCode(65+j%26),ref=`${col}${i+1}`;return typeof v==="number"?`<c r="${ref}"><v>${v}</v></c>`:`<c r="${ref}" t="inlineStr"><is><t>${xml(v)}</t></is></c>`}).join("")}</row>`).join("")}</sheetData></worksheet>`,files={"[Content_Types].xml":strToU8(`<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`),"_rels/.rels":strToU8(`<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`),"xl/workbook.xml":strToU8(`<?xml version="1.0"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Rapor" sheetId="1" r:id="rId1"/></sheets></workbook>`),"xl/_rels/workbook.xml.rels":strToU8(`<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`),"xl/worksheets/sheet1.xml":strToU8(sheet)};download(new Blob([zipSync(files)],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}),safeName(d,"xlsx"))}
function ascii(v:unknown){return String(v??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/ı/g,"i").replace(/[şŞ]/g,"s").replace(/[ğĞ]/g,"g").replace(/[çÇ]/g,"c").replace(/[öÖ]/g,"o").replace(/[üÜ]/g,"u").replace(/[()\\]/g," ")}
function downloadPdf(d:ReportData){const landscape=d.columns.length>8,w=landscape?842:595,h=landscape?595:842,per=landscape?22:34,count=Math.max(1,Math.ceil(d.rows.length/per)),objects:string[]=["","<< /Type /Catalog /Pages 2 0 R >>","","<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"],pageIds:number[]=[];for(let p=0;p<count;p++){const pageId=objects.length,contentId=pageId+1;pageIds.push(pageId);objects.push("");const lines=[`BT /F1 14 Tf 35 ${h-35} Td (MEGA HRMS Professional) Tj /F1 11 Tf 0 -18 Td (${ascii(d.title)}) Tj /F1 8 Tf 0 -14 Td (${ascii(`${d.companyName} | ${d.range.from} - ${d.range.to} | ${new Date().toLocaleString("tr-TR")}`)}) Tj`,`0 -18 Td (${ascii(d.columns.join(" | ")).slice(0,landscape?175:115)}) Tj`];d.rows.slice(p*per,(p+1)*per).forEach(row=>lines.push(`0 -${landscape?18:20} Td (${ascii(row.map(v=>typeof v==="number"?v.toFixed(2):v).join(" | ")).slice(0,landscape?175:115)}) Tj`));lines.push(`0 -20 Td (Genel Toplam: ${ascii(Object.entries(d.totals).map(([k,v])=>`${k}=${v.toFixed(2)}`).join(" | ")).slice(0,160)}) Tj`,`ET`,`BT /F1 8 Tf ${w-90} 20 Td (Sayfa ${p+1} / ${count}) Tj ET`);const stream=lines.join("\n");objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);objects[pageId]=`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`}objects[2]=`<< /Type /Pages /Kids [${pageIds.map(x=>`${x} 0 R`).join(" ")}] /Count ${count} >>`;let pdf="%PDF-1.4\n",offsets=[0];for(let i=1;i<objects.length;i++){offsets[i]=pdf.length;pdf+=`${i} 0 obj\n${objects[i]}\nendobj\n`}const xref=pdf.length;pdf+=`xref\n0 ${objects.length}\n0000000000 65535 f \n`+offsets.slice(1).map(x=>String(x).padStart(10,"0")+" 00000 n \n").join("")+`trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;download(new Blob([pdf],{type:"application/pdf"}),safeName(d,"pdf"))}
