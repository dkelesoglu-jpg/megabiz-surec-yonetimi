"use client";
import {FormEvent,useEffect,useMemo,useState} from "react";
import "./benefits-manager.css";
type Definition={id:number;name:string;category:string;defaultAmount:number;currency:string;frequency:string;effectiveFrom:string;effectiveTo?:string;subjectToSgk:boolean;subjectToIncomeTax:boolean;subjectToStampTax:boolean;exemptionLimit:number;status:string};
type Template={id:number;definitionId:number;scopeType:string;department?:string;position?:string;amount?:number;status:string};
type Employee={id:number;name:string;employeeNo:string;department:string;departmentId?:number;position:string;status:string};
type Assignment={id:number;employeeId:number;definitionId?:number;name:string;amount:number;currency:string;frequency:string;effectiveFrom:string;effectiveTo?:string;source:string;status:string};
type Data={definitions:Definition[];templates:Template[];employees:Employee[];assignments:Assignment[];departments:{id:number;name:string}[];suggestions?:Array<Template&{definition?:Definition;alreadyAssigned:boolean}>};
const categories=["Yemek","Yol","Özel Sağlık Sigortası","Hayat Sigortası","Telefon","Araç","Yakıt","Prim","İkramiye","Konaklama","Çocuk Yardımı","Diğer"];
const money=(n:number,c="TRY")=>new Intl.NumberFormat("tr-TR",{style:"currency",currency:c||"TRY",maximumFractionDigits:2}).format(n||0);
export default function BenefitsManager({act}:{act:(s:string)=>void}){const[data,setData]=useState<Data|null>(null),[tab,setTab]=useState<"catalog"|"templates"|"assignments">("catalog"),[modal,setModal]=useState<"definition"|"template"|"assign"|null>(null),[busy,setBusy]=useState(false);async function load(){const r=await fetch("/api/benefits"),j=await r.json();if(r.ok)setData(j);else act(j.error||"Yan haklar yüklenemedi")}useEffect(()=>{load()},[]);async function save(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);const form=new FormData(e.currentTarget),payload=Object.fromEntries(form.entries());for(const key of ["subjectToSgk","subjectToIncomeTax","subjectToStampTax"])payload[key]=form.has(key)?"true":"";const r=await fetch("/api/benefits",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({...payload,["subjectToSgk"]:form.has("subjectToSgk"),["subjectToIncomeTax"]:form.has("subjectToIncomeTax"),["subjectToStampTax"]:form.has("subjectToStampTax")})}),j=await r.json();setBusy(false);if(!r.ok){act(j.error||"Kayıt tamamlanamadı");return}setModal(null);await load();act("Yan hak kaydı güncellendi")};if(!data)return <div className="panel loading">Yan haklar hazırlanıyor…</div>;const total=data.assignments.filter(x=>x.status==="Aktif").reduce((s,x)=>s+(x.frequency==="Yıllık"?x.amount/12:x.frequency==="Tek Seferlik"?0:x.amount),0);return <div className="benefits-shell">
<section className="benefit-kpis">
<article>
<small>Tanımlı Yan Hak</small>
<strong>{data.definitions.length}</strong>
</article>
<article>
<small>Aktif Şablon</small>
<strong>{data.templates.filter(x=>x.status==="Aktif").length}</strong>
</article>
<article>
<small>Personel Ataması</small>
<strong>{data.assignments.filter(x=>x.status==="Aktif").length}</strong>
</article>
<article>
<small>Aylık Yan Hak Maliyeti</small>
<strong>{money(total)}</strong>
</article>
</section>
<div className="benefit-toolbar">
<nav>{[["catalog","Yan Hak Kataloğu"],["templates","Departman / Pozisyon Şablonları"],["assignments","Personel Atamaları"]].map(([k,n])=>
<button className={tab===k?"active":""} key={k} onClick={()=>setTab(k as typeof tab)}>{n}</button>)}</nav>
<button className="primary" onClick={()=>setModal(tab==="catalog"?"definition":tab==="templates"?"template":"assign")}>＋ {tab==="catalog"?"Yan Hak Tanımla":tab==="templates"?"Şablon Oluştur":"Personele Ata"}</button>
</div>{tab==="catalog"&&<section className="panel benefit-table">
<div className="benefit-row head">
<span>Yan Hak</span>
<span>Tutar / Periyot</span>
<span>Vergi Durumu</span>
<span>Geçerlilik</span>
<span>Durum</span>
</div>{data.definitions.map(x=>
<div className="benefit-row" key={x.id}>
<span>
<b>{x.name}</b>
<small>{x.category} · {x.currency}</small>
</span>
<span>
<b>{money(x.defaultAmount,x.currency)}</b>
<small>{x.frequency}</small>
</span>
<span>
<small>SGK: {x.subjectToSgk?"Tabi":"Muaf"}</small>
<small>GV: {x.subjectToIncomeTax?"Tabi":"Muaf"} · DV: {x.subjectToStampTax?"Tabi":"Muaf"}</small>
<small>İstisna: {money(x.exemptionLimit,x.currency)}</small>
</span>
<span>{x.effectiveFrom}<small>{x.effectiveTo||"Süresiz"}</small>
</span>
<span>
<b className="benefit-status">{x.status}</b>
</span>
</div>)}</section>}{tab==="templates"&&<section className="panel benefit-table">
<div className="benefit-row template head">
<span>Yan Hak</span>
<span>Kapsam</span>
<span>Departman / Pozisyon</span>
<span>Tutar</span>
</div>{data.templates.map(x=>{const d=data.definitions.find(y=>y.id===x.definitionId);return <div className="benefit-row template" key={x.id}>
<span>
<b>{d?.name||"—"}</b>
</span>
<span>{x.scopeType}</span>
<span>{x.department||x.position||"—"}</span>
<span>{money(x.amount||d?.defaultAmount||0,d?.currency)}</span>
</div>})}</section>}{tab==="assignments"&&<section className="panel benefit-table">
<div className="benefit-row assignment head">
<span>Çalışan</span>
<span>Yan Hak</span>
<span>Tutar</span>
<span>Kaynak</span>
<span>Durum</span>
</div>{data.assignments.map(x=>{const e=data.employees.find(y=>y.id===x.employeeId);return <div className="benefit-row assignment" key={x.id}>
<span>
<b>{e?.name||"—"}</b>
<small>{e?.department} · {e?.position}</small>
</span>
<span>{x.name}<small>{x.frequency}</small>
</span>
<span>{money(x.amount,x.currency)}</span>
<span>{x.source}</span>
<span>{x.status}</span>
</div>})}</section>}{modal&&<BenefitModal kind={modal} data={data} close={()=>setModal(null)} save={save} busy={busy}/>}</div>}
function BenefitModal({kind,data,close,save,busy}:{kind:"definition"|"template"|"assign";data:Data;close:()=>void;save:(e:FormEvent<HTMLFormElement>)=>void;busy:boolean}){return <div className="modal-backdrop">
<form className="benefit-modal" onSubmit={save}>
<header>
<div>
<span>YAN HAKLAR YÖNETİMİ</span>
<h2>{kind==="definition"?"Yeni Yan Hak":kind==="template"?"Yeni Yan Hak Şablonu":"Personele Yan Hak Ata"}</h2>
</div>
<button type="button" onClick={close}>×</button>
</header>
<input type="hidden" name="action" value={kind}/>{kind==="definition"&&<div className="benefit-form-grid">
<label>Yan Hak Adı<input name="name" required/>
</label>
<label>Yan Hak Türü<select name="category">{categories.map(x=>
<option key={x}>{x}</option>)}</select>
</label>
<label>Varsayılan Tutar<input name="defaultAmount" type="number" min="0" step="0.01" required/>
</label>
<label>Para Birimi<select name="currency">
<option>TRY</option>
<option>USD</option>
<option>EUR</option>
</select>
</label>
<label>Periyot<select name="frequency">
<option>Aylık</option>
<option>Yıllık</option>
<option>Tek Seferlik</option>
</select>
</label>
<label>Başlangıç<input name="effectiveFrom" type="date" required/>
</label>
<label>Bitiş<input name="effectiveTo" type="date"/>
</label>
<label>İstisna Limiti<input name="exemptionLimit" type="number" min="0" step="0.01"/>
</label>
<label className="check">
<input name="subjectToSgk" type="checkbox"/> SGK’ya tabi</label>
<label className="check">
<input name="subjectToIncomeTax" type="checkbox"/> Gelir vergisine tabi</label>
<label className="check">
<input name="subjectToStampTax" type="checkbox"/> Damga vergisine tabi</label>
</div>}{kind==="template"&&<div className="benefit-form-grid">
<label>Yan Hak<select name="definitionId" required>
<option value="">Seçiniz</option>{data.definitions.filter(x=>x.status==="Aktif").map(x=>
<option value={x.id} key={x.id}>{x.name}</option>)}</select>
</label>
<label>Kapsam<select name="scopeType" required>
<option>Departman</option>
<option>Pozisyon</option>
</select>
</label>
<label>Departman<select name="department">
<option value="">Seçiniz</option>{data.departments.map(x=>
<option key={x.id}>{x.name}</option>)}</select>
</label>
<label>Departman ID<select name="departmentId">
<option value="">Seçiniz</option>{data.departments.map(x=>
<option value={x.id} key={x.id}>{x.name}</option>)}</select>
</label>
<label>Pozisyon<input name="position"/>
</label>
<label>Şablon Tutarı<input name="amount" type="number" min="0" step="0.01"/>
</label>
</div>}{kind==="assign"&&<div className="benefit-form-grid">
<label>Çalışan<select name="employeeId" required>
<option value="">Seçiniz</option>{data.employees.filter(x=>x.status==="Aktif").map(x=>
<option value={x.id} key={x.id}>{x.name} · {x.department}</option>)}</select>
</label>
<label>Yan Hak<select name="definitionId" required>
<option value="">Seçiniz</option>{data.definitions.filter(x=>x.status==="Aktif").map(x=>
<option value={x.id} key={x.id}>{x.name}</option>)}</select>
</label>
<label>Tutar<input name="amount" type="number" min="0" step="0.01"/>
</label>
<label>Başlangıç<input name="effectiveFrom" type="date"/>
</label>
<label>Bitiş<input name="effectiveTo" type="date"/>
</label>
<input type="hidden" name="source" value="Personel"/>
</div>}<footer>
<button type="button" onClick={close}>İptal</button>
<button className="primary" disabled={busy}>{busy?"Kaydediliyor…":"Kaydet"}</button>
</footer>
</form>
</div>}

export function EmployeeBenefitsPanel({employeeId}:{employeeId:number}){const[data,setData]=useState<Data|null>(null),[open,setOpen]=useState(false),[message,setMessage]=useState("");async function load(){const r=await fetch(`/api/benefits?employeeId=${employeeId}`),j=await r.json();if(r.ok)setData(j)}useEffect(()=>{load()},[employeeId]);const active=useMemo(()=>data?.assignments.filter(x=>x.status==="Aktif")||[],[data]);async function assign(definitionId:number,source="Şablon Önerisi"){const r=await fetch("/api/benefits",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"assign",employeeId,definitionId,source})}),j=await r.json();if(r.ok){setMessage("Yan hak personele atandı");await load()}else setMessage(j.error||"Atama yapılamadı")};return <section className="employee-benefits">
<header>
<div>
<h3>Ücret ve Yan Haklar</h3>
<small>Personele özel yan haklar ve departman/pozisyon önerileri</small>
</div>
<button type="button" onClick={()=>setOpen(!open)}>{open?"Kapat":"Yönet"}</button>
</header>
<div className="employee-benefit-list">{active.length?active.map(x=>
<span key={x.id}>
<b>{x.name}</b>{money(x.amount,x.currency)} · {x.frequency}</span>):<small>Aktif yan hak ataması bulunmuyor.</small>}</div>{open&&data&&<div className="benefit-suggestions">
<h4>Otomatik Öneriler</h4>{data.suggestions?.filter(x=>!x.alreadyAssigned).map(x=>
<button type="button" key={x.id} onClick={()=>assign(x.definitionId)}>＋ {x.definition?.name} · {x.scopeType}: {x.department||x.position}</button>)}<h4>Yan Hak Ekle</h4>
<div>{data.definitions.filter(x=>x.status==="Aktif"&&!active.some(a=>a.definitionId===x.id)).map(x=>
<button type="button" key={x.id} onClick={()=>assign(x.id)}>＋ {x.name}</button>)}</div>
</div>}{message&&<p>{message}</p>}</section>}
