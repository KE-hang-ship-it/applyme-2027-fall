"use client";

import { useEffect, useMemo, useState } from "react";

type Program = {
  id: string; school: string; rank: number; program: string; degree: string;
  field: string; deadline: string; letters: string; cv: string; sop: string;
  gre: string; credits: string; duration: string; verified: "已核实" | "待复核";
  source: string; tracks: { name: string; courses: string[] }[];
};

const PROGRAMS: Program[] = [
  { id:"stanford-me", school:"Stanford University", rank:4, program:"Mechanical Engineering", degree:"MS", field:"机械工程", deadline:"2026-12-01", letters:"3封", cv:"需要", sop:"需要", gre:"不接受", credits:"45 units", duration:"约2年", verified:"已核实", source:"https://me.stanford.edu/academics-admissions/graduate-programs/masters-program/masters-admissions", tracks:[
    {name:"Controls & Robotics",courses:["Experimental Robotics","Introduction to Robotics","Decision Making under Uncertainty"]},
    {name:"Design & Manufacturing",courses:["Product Design","Smart Product Design","Design for Additive Manufacturing"]},
    {name:"Thermofluids",courses:["Fluid Mechanics","Heat Transfer","Energy Systems"]}]},
  { id:"mit-me", school:"Massachusetts Institute of Technology", rank:2, program:"Mechanical Engineering", degree:"SM", field:"机械工程", deadline:"待公布", letters:"至少3封", cv:"需要", sop:"需要", gre:"待复核", credits:"研究型培养", duration:"约2年", verified:"待复核", source:"https://meche.mit.edu/education/prospective-students/graduate", tracks:[
    {name:"Mechanics",courses:["Advanced Mechanics of Solids","Continuum Mechanics","Finite Element Analysis"]},
    {name:"Robotics & Control",courses:["Underactuated Robotics","Feedback Control","Robotic Manipulation"]},
    {name:"Energy",courses:["Thermal Science","Energy Conversion","Fluid Dynamics"]}]},
  { id:"umich-me", school:"University of Michigan–Ann Arbor", rank:21, program:"Mechanical Engineering", degree:"MSE", field:"机械工程", deadline:"待公布", letters:"2封", cv:"需要", sop:"需要＋PS", gre:"可选", credits:"30 credits", duration:"10个月–2年", verified:"已核实", source:"https://me.engin.umich.edu/admissions/graduate/application-requirements/", tracks:[
    {name:"Robotics & Mechatronics",courses:["Math for Robotics","Linear Systems Theory","Mechatronic Systems Design"]},
    {name:"Automotive",courses:["Vehicle Dynamics","Automotive Engineering","Powertrain Systems"]},
    {name:"Design & Manufacturing",courses:["Design Optimization","Advanced Manufacturing","Product Design"]}]},
  { id:"cmu-me", school:"Carnegie Mellon University", rank:21, program:"Mechanical Engineering", degree:"MS", field:"机械工程", deadline:"待公布", letters:"待复核", cv:"需要", sop:"需要", gre:"待复核", credits:"待复核", duration:"3–4学期", verified:"待复核", source:"https://www.meche.engineering.cmu.edu/education/graduate-programs/index.html", tracks:[
    {name:"Advanced Study",courses:["Engineering Computation","Advanced Controls","Finite Element Methods"]},
    {name:"Research",courses:["Graduate Research","Advanced Mechanical Systems","Technical Electives"]}]},
  { id:"cornell-me", school:"Cornell University", rank:11, program:"Mechanical Engineering", degree:"MEng", field:"机械工程", deadline:"待公布", letters:"待复核", cv:"需要", sop:"需要", gre:"待复核", credits:"30 credits", duration:"1年", verified:"待复核", source:"https://www.mae.cornell.edu/mae/programs/graduate-programs/master-engineering-program", tracks:[
    {name:"Robotics",courses:["Foundations of Robotics","Robot Dynamics","Embedded Systems"]},
    {name:"Energy Systems",courses:["Applied Thermodynamics","Energy Engineering","Fluid Dynamics"]},
    {name:"Design",courses:["Mechanical Synthesis","Product Design","Engineering Leadership"]}]},
  { id:"northwestern-me", school:"Northwestern University", rank:6, program:"Mechanical Engineering", degree:"MS", field:"机械工程", deadline:"待公布", letters:"待复核", cv:"需要", sop:"需要", gre:"待复核", credits:"12 courses", duration:"约15个月", verified:"待复核", source:"https://www.mccormick.northwestern.edu/mechanical/academics/graduate/masters/", tracks:[
    {name:"Robotics & Control",courses:["Modern Robotics","Control Systems","Mechatronics"]},
    {name:"Design & Manufacturing",courses:["Engineering Design","Manufacturing Processes","Computer Integrated Manufacturing"]}]},
  { id:"jhu-me", school:"Johns Hopkins University", rank:6, program:"Mechanical Engineering", degree:"MSE", field:"机械工程", deadline:"待公布", letters:"待复核", cv:"需要", sop:"需要", gre:"待复核", credits:"10 courses", duration:"1–2年", verified:"待复核", source:"https://me.jhu.edu/graduate/masters-program/", tracks:[
    {name:"Robotics",courses:["Robot Motion Planning","Robot Control","Mechatronics"]},
    {name:"Biomechanics",courses:["Computational Medicine","Biomechanics","Finite Element Methods"]}]},
  { id:"duke-me", school:"Duke University", rank:6, program:"Mechanical Engineering & Materials Science", degree:"MS", field:"机械工程", deadline:"待公布", letters:"待复核", cv:"需要", sop:"需要", gre:"待复核", credits:"30 credits", duration:"1.5–2年", verified:"待复核", source:"https://mems.duke.edu/academics/masters/", tracks:[
    {name:"Autonomous Systems",courses:["Robotics","Dynamics & Control","Machine Learning"]},
    {name:"Thermal Fluids",courses:["Advanced Fluid Mechanics","Heat Transfer","Energy Systems"]}]},
  { id:"rice-me", school:"Rice University", rank:18, program:"Mechanical Engineering", degree:"MMechE", field:"机械工程", deadline:"待公布", letters:"待复核", cv:"需要", sop:"需要", gre:"待复核", credits:"30 credits", duration:"1–1.5年", verified:"待复核", source:"https://mech.rice.edu/academics/graduate-programs", tracks:[
    {name:"Computational Engineering",courses:["Finite Element Analysis","Computational Fluid Dynamics","Numerical Methods"]},
    {name:"Thermal Science",courses:["Advanced Thermodynamics","Transport Phenomena","Fluid Mechanics"]}]},
  { id:"usc-me", school:"University of Southern California", rank:27, program:"Mechanical Engineering", degree:"MS", field:"机械工程", deadline:"待公布", letters:"待复核", cv:"需要", sop:"需要", gre:"待复核", credits:"27 units", duration:"1.5–2年", verified:"待复核", source:"https://ame.usc.edu/academics/graduate-programs/", tracks:[
    {name:"Dynamics & Control",courses:["Advanced Dynamics","Control Systems","Robotics"]},
    {name:"Thermal & Fluid Sciences",courses:["Heat Transfer","Fluid Dynamics","Combustion"]}]},
  { id:"gatech-me", school:"Georgia Institute of Technology", rank:33, program:"Mechanical Engineering", degree:"MS", field:"机械工程", deadline:"待公布", letters:"待复核", cv:"需要", sop:"需要", gre:"待复核", credits:"30 credits", duration:"约2年", verified:"待复核", source:"https://www.me.gatech.edu/graduate", tracks:[
    {name:"Automation & Robotics",courses:["Advanced Controls","Robotics","Mechatronics"]},
    {name:"Manufacturing",courses:["Advanced Manufacturing","Computer-Aided Manufacturing","Design Optimization"]}]},
  { id:"uiuc-me", school:"University of Illinois Urbana-Champaign", rank:33, program:"Mechanical Engineering", degree:"MEng", field:"机械工程", deadline:"待公布", letters:"待复核", cv:"需要", sop:"需要", gre:"待复核", credits:"32 hours", duration:"1年", verified:"待复核", source:"https://mechse.illinois.edu/graduate/graduate-degree-programs/master-engineering-mechanical-engineering", tracks:[
    {name:"Autonomy & Robotics",courses:["Robot Dynamics","Control System Theory","AI for Engineering"]},
    {name:"Design & Manufacturing",courses:["Engineering Design","Manufacturing Systems","Data Analytics"]}]},
  { id:"ucd-me", school:"University of California, Davis", rank:33, program:"Mechanical and Aerospace Engineering", degree:"MS", field:"机械/航空", deadline:"待公布", letters:"待复核", cv:"需要", sop:"需要", gre:"待复核", credits:"待复核", duration:"约2年", verified:"待复核", source:"https://mae.ucdavis.edu/graduate", tracks:[
    {name:"Aerospace",courses:["Aerodynamics","Flight Dynamics","Propulsion"]},
    {name:"Mechanical Systems",courses:["Dynamics","Controls","Design Optimization"]}]},
  { id:"uci-me", school:"University of California, Irvine", rank:33, program:"Mechanical and Aerospace Engineering", degree:"MS", field:"机械/航空", deadline:"待公布", letters:"待复核", cv:"需要", sop:"需要", gre:"待复核", credits:"待复核", duration:"约2年", verified:"待复核", source:"https://engineering.uci.edu/dept/mae/academics/graduate", tracks:[
    {name:"Energy Systems",courses:["Thermodynamics","Heat Transfer","Sustainable Energy"]},
    {name:"Dynamics & Controls",courses:["Nonlinear Control","Robotics","System Dynamics"]}]},
];

const dateLabel = (date: string) => date === "待公布" ? date : new Date(`${date}T00:00:00`).toLocaleDateString("zh-CN", {year:"numeric",month:"short",day:"numeric"});

export default function Home() {
  const [tab,setTab] = useState<"library"|"targets">("library");
  const [query,setQuery] = useState("");
  const [degree,setDegree] = useState("全部");
  const [targets,setTargets] = useState<string[]>([]);
  const [selected,setSelected] = useState<Program | null>(null);
  const [compare,setCompare] = useState<string[]>([]);
  const [ready,setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("me-targets");
    if (saved) setTargets(JSON.parse(saved));
    setReady(true);
  },[]);
  useEffect(() => { if (ready) localStorage.setItem("me-targets",JSON.stringify(targets)); },[targets,ready]);

  const list = useMemo(() => PROGRAMS.filter(p =>
    (tab === "library" || targets.includes(p.id)) &&
    (degree === "全部" || p.degree === degree) &&
    `${p.school}${p.program}${p.degree}${p.field}`.toLowerCase().includes(query.toLowerCase())
  ),[tab,targets,degree,query]);

  const toggleTarget = (id:string) => setTargets(old => old.includes(id) ? old.filter(x=>x!==id) : [...old,id]);
  const toggleCompare = (id:string) => setCompare(old => old.includes(id) ? old.filter(x=>x!==id) : old.length < 3 ? [...old,id] : old);

  return <main>
    <aside>
      <div className="logo"><b>APPLY</b><span>ME</span></div>
      <nav>
        <button className={tab==="library"?"active":""} onClick={()=>setTab("library")}>项目库 <small>{PROGRAMS.length}</small></button>
        <button className={tab==="targets"?"active":""} onClick={()=>setTab("targets")}>我的目标 <small>{targets.length}</small></button>
      </nav>
      <div className="side-note"><b>2027 FALL</b><p>美国机械及相关工程硕士申请</p><span>数据保存在当前浏览器</span></div>
    </aside>

    <section className="page">
      <header>
        <div><p>MASTER'S APPLICATION DATABASE</p><h1>{tab==="library"?"项目库":"我的目标项目"}</h1></div>
        <div className="season">申请季 <b>2027 Fall</b></div>
      </header>

      <section className="summary">
        <div><span>收录项目</span><b>{PROGRAMS.length}</b></div>
        <div><span>目标项目</span><b>{targets.length}</b></div>
        <div><span>已核实</span><b>{PROGRAMS.filter(p=>p.verified==="已核实").length}</b></div>
        <div><span>待官方更新</span><b>{PROGRAMS.filter(p=>p.deadline==="待公布").length}</b></div>
      </section>

      <div className="toolbar">
        <label><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索学校、专业或方向" /></label>
        <select value={degree} onChange={e=>setDegree(e.target.value)}><option>全部</option><option>MS</option><option>SM</option><option>MSE</option><option>MEng</option><option>MMechE</option></select>
      </div>

      <section className="table-card">
        <div className="thead"><span>学校 / 项目</span><span>学位</span><span>申请截止</span><span>推荐信</span><span>材料</span><span>状态</span><span /></div>
        {list.map(p=><article className="row" key={p.id} onClick={()=>setSelected(p)}>
          <div className="school"><i>{p.rank}</i><div><b>{p.school}</b><span>{p.program} · {p.field}</span></div></div>
          <strong className="degree">{p.degree}</strong>
          <span>{dateLabel(p.deadline)}</span>
          <span>{p.letters}</span>
          <span className="materials">CV · SOP</span>
          <span className={p.verified==="已核实"?"verified":"pending"}>{p.verified}</span>
          <div className="actions">
            <button className={compare.includes(p.id)?"selected":""} onClick={e=>{e.stopPropagation();toggleCompare(p.id)}} title="加入对比">⇄</button>
            <button className={targets.includes(p.id)?"saved":""} onClick={e=>{e.stopPropagation();toggleTarget(p.id)}} title="添加或移除目标">{targets.includes(p.id)?"−":"＋"}</button>
          </div>
        </article>)}
        {!list.length && <div className="empty">{tab==="targets"?"还没有目标项目，请从项目库点击“＋”添加。":"没有找到项目。"}</div>}
      </section>
      <p className="disclaimer">排名用于限定初始选校范围；申请要求以项目官网为准。2027 Fall 尚未公布的内容会标记为“待复核”。</p>
    </section>

    {selected && <div className="overlay" onClick={()=>setSelected(null)}>
      <section className="drawer" onClick={e=>e.stopPropagation()}>
        <button className="close" onClick={()=>setSelected(null)}>×</button>
        <p className="kicker">PROGRAM PROFILE · #{selected.rank}</p>
        <h2>{selected.school}</h2><h3>{selected.degree} in {selected.program}</h3>
        <button className="target-btn" onClick={()=>toggleTarget(selected.id)}>{targets.includes(selected.id)?"从目标中移除":"＋ 添加到我的目标"}</button>
        <div className="facts">
          <div><span>截止日期</span><b>{dateLabel(selected.deadline)}</b></div><div><span>推荐信</span><b>{selected.letters}</b></div>
          <div><span>CV / Resume</span><b>{selected.cv}</b></div><div><span>SOP / PS</span><b>{selected.sop}</b></div>
          <div><span>GRE</span><b>{selected.gre}</b></div><div><span>学分 / 时长</span><b>{selected.credits} · {selected.duration}</b></div>
        </div>
        <div className="tracks"><p className="kicker">DIRECTIONS & COURSES</p><h4>方向与课程示例</h4>
          {selected.tracks.map(t=><div className="track" key={t.name}><b>{t.name}</b><ul>{t.courses.map(c=><li key={c}>{c}</li>)}</ul></div>)}
        </div>
        <a className="source" href={selected.source} target="_blank" rel="noreferrer">查看项目官方页面 ↗</a>
        <p className="source-note">课程为培养方向示例，实际学期开课情况需在选课目录中再次确认。</p>
      </section>
    </div>}

    {!!compare.length && <div className="compare-bar"><span>已选择 {compare.length}/3 个项目</span>{compare.map(id=><b key={id}>{PROGRAMS.find(p=>p.id===id)?.school.split(" ")[0]} <button onClick={()=>toggleCompare(id)}>×</button></b>)}<button className="compare-now" onClick={()=>setSelected(PROGRAMS.find(p=>p.id===compare[0])||null)}>查看对比</button></div>}
  </main>
}
