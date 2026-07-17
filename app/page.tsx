"use client";

import { useEffect, useMemo, useState } from "react";

type Program = {
  id: string; school: string; rank: number; program: string; degree: string;
  field: string; deadline: string; letters: string; cv: string; sop: string;
  gre: string; credits: string; duration: string; verified: "已核实" | "待复核";
  source: string; tracks: { name: string; courses: string[] }[];
};

const SCHOOL_NAMES: Record<string, string> = {
  "Princeton University":"普林斯顿大学", "Massachusetts Institute of Technology":"麻省理工学院",
  "Harvard University":"哈佛大学", "Stanford University":"斯坦福大学", "University of Pennsylvania":"宾夕法尼亚大学",
  "California Institute of Technology":"加州理工学院", "Cornell University":"康奈尔大学", "Brown University":"布朗大学",
  "Columbia University":"哥伦比亚大学", "University of California, Berkeley":"加州大学伯克利分校",
  "Duke University":"杜克大学", "Johns Hopkins University":"约翰斯·霍普金斯大学", "Northwestern University":"西北大学",
  "Rice University":"莱斯大学", "University of California, Los Angeles":"加州大学洛杉矶分校",
  "Vanderbilt University":"范德堡大学", "Carnegie Mellon University":"卡内基梅隆大学",
  "University of Michigan–Ann Arbor":"密歇根大学安娜堡分校", "University of Notre Dame":"圣母大学",
  "Washington University in St. Louis":"圣路易斯华盛顿大学", "University of Virginia":"弗吉尼亚大学",
  "University of Southern California":"南加州大学", "University of California, San Diego":"加州大学圣地亚哥分校",
  "University of Florida":"佛罗里达大学", "University of Texas at Austin":"得克萨斯大学奥斯汀分校",
  "Georgia Institute of Technology":"佐治亚理工学院", "New York University":"纽约大学",
  "University of California, Davis":"加州大学戴维斯分校", "University of California, Irvine":"加州大学欧文分校",
  "Tufts University":"塔夫茨大学", "University of Illinois Urbana-Champaign":"伊利诺伊大学厄巴纳-香槟分校",
  "University of Wisconsin–Madison":"威斯康星大学麦迪逊分校", "University of California, Santa Barbara":"加州大学圣塔芭芭拉分校",
  "Ohio State University":"俄亥俄州立大学", "Boston University":"波士顿大学",
  "Rutgers University–New Brunswick":"罗格斯大学新布朗斯维克分校", "University of Maryland, College Park":"马里兰大学帕克分校",
  "University of Washington":"华盛顿大学", "Lehigh University":"理海大学", "Northeastern University":"东北大学",
  "Purdue University":"普渡大学", "University of Georgia":"佐治亚大学", "University of Rochester":"罗切斯特大学"
};

type CostProfile = { tuition:string; shared:string; privateRoom:string; note:string };
const HIGH_COST = new Set(["Stanford University","Massachusetts Institute of Technology","Harvard University","Columbia University","University of California, Berkeley","University of California, Los Angeles","University of Southern California","New York University","Boston University","Northeastern University"]);
const LOWER_COST = new Set(["University of Michigan–Ann Arbor","University of Notre Dame","University of Florida","University of Illinois Urbana-Champaign","University of Wisconsin–Madison","Ohio State University","Purdue University","University of Georgia","University of Rochester"]);
const PRIVATE_SCHOOLS = new Set(["Princeton University","Massachusetts Institute of Technology","Harvard University","Stanford University","University of Pennsylvania","California Institute of Technology","Cornell University","Brown University","Columbia University","Duke University","Johns Hopkins University","Northwestern University","Rice University","Vanderbilt University","Carnegie Mellon University","University of Notre Dame","Washington University in St. Louis","University of Southern California","New York University","Tufts University","Boston University","Lehigh University","Northeastern University","University of Rochester"]);
const costFor = (school:string):CostProfile => ({
  tuition: PRIVATE_SCHOOLS.has(school) ? "约 US$55,000–75,000/学年" : "约 US$30,000–60,000/学年（国际生）",
  shared: HIGH_COST.has(school) ? "约 US$1,000–1,800/月" : LOWER_COST.has(school) ? "约 US$600–1,000/月" : "约 US$750–1,300/月",
  privateRoom: HIGH_COST.has(school) ? "约 US$1,600–3,000/月" : LOWER_COST.has(school) ? "约 US$900–1,500/月" : "约 US$1,100–2,000/月",
  note:"通常需护照/身份证明、I-20或录取证明、押金与首月房租；没有美国信用记录时，可能需要担保人或预付数月房租。"
});

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

const relatedProgram = (id:string, school:string, rank:number, program:string, degree:string, field:string, source:string, tracks:Program["tracks"]):Program => ({
  id, school, rank, program, degree, field, source, tracks, verified:"待复核", deadline:"待公布",
  letters:"待复核", cv:"需要", sop:"需要", gre:"待复核", credits:"待复核", duration:"1–2年"
});

const EXTRA_PROGRAMS: Program[] = [
  relatedProgram("princeton-mae","Princeton University",1,"Mechanical and Aerospace Engineering","MSE","机械/航空","https://mae.princeton.edu/graduate",[{name:"Dynamics & Control",courses:["Dynamics","Control Systems","Robotics"]},{name:"Thermal & Fluids",courses:["Fluid Mechanics","Heat Transfer","Energy Systems"]}]),
  relatedProgram("upenn-robotics","University of Pennsylvania",7,"Robotics","MSE","机器人","https://www.grasp.upenn.edu/academics/masters/",[{name:"Robotics",courses:["Robot Design","Machine Perception","Motion Planning"]},{name:"Autonomy",courses:["Artificial Intelligence","Control Systems","Computer Vision"]}]),
  relatedProgram("brown-me","Brown University",13,"Mechanical Engineering","ScM","机械工程","https://engineering.brown.edu/academics/graduate-study",[{name:"Solid Mechanics",courses:["Continuum Mechanics","Finite Elements","Materials"]},{name:"Fluids & Thermal",courses:["Fluid Mechanics","Thermodynamics","Transport"]}]),
  relatedProgram("columbia-me","Columbia University",15,"Mechanical Engineering","MS","机械工程","https://www.me.columbia.edu/ms-program",[{name:"Robotics & Control",courses:["Robotics","Control Systems","Mechatronics"]},{name:"Energy Systems",courses:["Energy Conversion","Heat Transfer","Fluid Mechanics"]}]),
  relatedProgram("berkeley-me","University of California, Berkeley",15,"Mechanical Engineering","MEng","机械工程","https://me.berkeley.edu/graduate/masters/",[{name:"Advanced Energy",courses:["Energy Systems","Thermal Science","Transport"]},{name:"Robotics",courses:["Advanced Robotics","Control","Design"]}]),
  relatedProgram("ucla-me","University of California, Los Angeles",17,"Mechanical Engineering","MS","机械工程","https://www.mae.ucla.edu/graduate-programs/",[{name:"Systems & Control",courses:["Linear Systems","Robotics","Optimization"]},{name:"Thermal Science",courses:["Heat Transfer","Fluid Dynamics","Combustion"]}]),
  relatedProgram("vanderbilt-me","Vanderbilt University",17,"Mechanical Engineering","MS","机械工程","https://engineering.vanderbilt.edu/me/graduate-programs/",[{name:"Robotics",courses:["Robotics","Controls","Mechatronics"]},{name:"Design & Manufacturing",courses:["Design Optimization","Manufacturing","Materials"]}]),
  relatedProgram("notredame-me","University of Notre Dame",20,"Mechanical Engineering","MS","机械工程","https://ame.nd.edu/graduate-programs/",[{name:"Aerospace",courses:["Aerodynamics","Flight Dynamics","Propulsion"]},{name:"Mechanical Systems",courses:["Dynamics","Controls","Design"]}]),
  relatedProgram("wustl-me","Washington University in St. Louis",20,"Mechanical Engineering","MS","机械工程","https://engineering.wustl.edu/academics/graduate-programs/",[{name:"Aerospace Systems",courses:["Aerodynamics","Structures","Propulsion"]},{name:"Robotics",courses:["Robotics","Control","Computer Vision"]}]),
  relatedProgram("uva-mae","University of Virginia",26,"Mechanical and Aerospace Engineering","MS","机械/航空","https://engineering.virginia.edu/department/mechanical-and-aerospace-engineering/academics/graduate",[{name:"Aerospace",courses:["Aerodynamics","Flight Mechanics","Structures"]},{name:"Mechanical",courses:["Dynamics","Thermal Sciences","Design"]}]),
  relatedProgram("ucsd-mae","University of California, San Diego",29,"Mechanical and Aerospace Engineering","MS","机械/航空","https://mae.ucsd.edu/graduate",[{name:"Controls & Robotics",courses:["Linear Systems","Robotics","Optimization"]},{name:"Thermal Sciences",courses:["Fluid Mechanics","Heat Transfer","Energy"]}]),
  relatedProgram("uf-me","University of Florida",30,"Mechanical Engineering","MS","机械工程","https://mae.ufl.edu/graduate/",[{name:"Dynamics & Control",courses:["Controls","Robotics","Dynamics"]},{name:"Manufacturing",courses:["Advanced Manufacturing","Design","Materials"]}]),
  relatedProgram("utaustin-me","University of Texas at Austin",30,"Mechanical Engineering","MS","机械工程","https://www.me.utexas.edu/academics/graduate-program",[{name:"Dynamic Systems & Control",courses:["Controls","Robotics","System Dynamics"]},{name:"Thermal/Fluid Systems",courses:["Thermodynamics","Fluid Mechanics","Heat Transfer"]}]),
  relatedProgram("nyu-me","New York University",32,"Mechatronics and Robotics","MS","机器人/机电","https://engineering.nyu.edu/academics/programs/mechatronics-and-robotics-ms",[{name:"Mechatronics",courses:["Mechatronics","Embedded Systems","Control"]},{name:"Robotics",courses:["Robot Perception","Motion Planning","Machine Learning"]}]),
  relatedProgram("tufts-me","Tufts University",36,"Mechanical Engineering","MS","机械工程","https://engineering.tufts.edu/me/academics/graduate",[{name:"Robotics",courses:["Robotics","Controls","Human-Robot Interaction"]},{name:"Design",courses:["Engineering Design","Manufacturing","Optimization"]}]),
  relatedProgram("wisc-me","University of Wisconsin–Madison",36,"Mechanical Engineering","MS","机械工程","https://guide.wisc.edu/graduate/mechanical-engineering/mechanical-engineering-ms/",[{name:"Controls",courses:["Control Systems","Robotics","Dynamics"]},{name:"Energy",courses:["Thermal Science","Fluid Mechanics","Energy Systems"]}]),
  relatedProgram("ucsb-me","University of California, Santa Barbara",39,"Mechanical Engineering","MS","机械工程","https://me.ucsb.edu/graduate",[{name:"Dynamics & Control",courses:["Control","Dynamics","Robotics"]},{name:"Thermal Sciences",courses:["Fluid Mechanics","Heat Transfer","Transport"]}]),
  relatedProgram("osu-me","Ohio State University",41,"Mechanical Engineering","MS","机械工程","https://mae.osu.edu/graduate",[{name:"Automotive",courses:["Vehicle Dynamics","Powertrain","Controls"]},{name:"Manufacturing",courses:["Manufacturing Systems","Design","Materials"]}]),
  relatedProgram("bu-me","Boston University",42,"Mechanical Engineering","MS","机械工程","https://www.bu.edu/eng/academics/explore-degree-programs/ms-in-mechanical-engineering/",[{name:"Robotics",courses:["Robotics","Controls","Machine Learning"]},{name:"Design & Manufacturing",courses:["Product Design","Manufacturing","Optimization"]}]),
  relatedProgram("rutgers-me","Rutgers University–New Brunswick",42,"Mechanical and Aerospace Engineering","MS","机械/航空","https://mae.rutgers.edu/graduate-program",[{name:"Aerospace",courses:["Aerodynamics","Structures","Propulsion"]},{name:"Mechanical Systems",courses:["Dynamics","Design","Controls"]}]),
  relatedProgram("umd-me","University of Maryland, College Park",42,"Mechanical Engineering","MEng","机械工程","https://mage.umd.edu/mechanical",[{name:"Robotics",courses:["Robotics","Controls","Autonomy"]},{name:"Design & Manufacturing",courses:["Design","Manufacturing","Systems Engineering"]}]),
  relatedProgram("uw-me","University of Washington",42,"Mechanical Engineering","MS","机械工程","https://www.me.washington.edu/students/grad",[{name:"Controls & Robotics",courses:["Robotics","Control Systems","Dynamics"]},{name:"Energy & Fluids",courses:["Fluid Mechanics","Heat Transfer","Energy"]}]),
  relatedProgram("lehigh-me","Lehigh University",46,"Mechanical Engineering","MS","机械工程","https://engineering.lehigh.edu/meche/graduate",[{name:"Mechanics",courses:["Continuum Mechanics","Finite Elements","Materials"]},{name:"Thermal Fluids",courses:["Thermodynamics","Fluids","Heat Transfer"]}]),
  relatedProgram("neu-me","Northeastern University",46,"Mechanical Engineering","MS","机械工程","https://graduate.northeastern.edu/programs/ms-mechanical-engineering/master-of-science-in-mechanical-engineering/",[{name:"Mechatronics",courses:["Mechatronics","Controls","Robotics"]},{name:"Thermofluids",courses:["Thermodynamics","Fluid Mechanics","Heat Transfer"]}]),
  relatedProgram("purdue-me","Purdue University",46,"Mechanical Engineering","MS","机械工程","https://engineering.purdue.edu/ME/Graduate",[{name:"Robotics",courses:["Robotics","Control Systems","Machine Learning"]},{name:"Manufacturing",courses:["Advanced Manufacturing","Design","Optimization"]}]),
  relatedProgram("rochester-me","University of Rochester",46,"Mechanical Engineering","MS","机械工程","https://www.hajim.rochester.edu/me/graduate/",[{name:"Energy",courses:["Thermodynamics","Heat Transfer","Fluid Mechanics"]},{name:"Mechanics & Design",courses:["Solid Mechanics","Design","Finite Elements"]}])
];

const ALL_PROGRAMS = [...PROGRAMS, ...EXTRA_PROGRAMS].sort((a,b)=>a.rank-b.rank || a.school.localeCompare(b.school));

const dateLabel = (date: string) => date === "待公布" ? date : new Date(`${date}T00:00:00`).toLocaleDateString("zh-CN", {year:"numeric",month:"short",day:"numeric"});

export default function Home() {
  const [tab,setTab] = useState<"library"|"targets">("library");
  const [query,setQuery] = useState("");
  const [degree,setDegree] = useState("全部");
  const [status,setStatus] = useState<"全部"|"已核实"|"待复核">("全部");
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

  const list = useMemo(() => ALL_PROGRAMS.filter(p =>
    (tab === "library" || targets.includes(p.id)) &&
    (degree === "全部" || p.degree === degree) &&
    (status === "全部" || p.verified === status) &&
    `${p.school}${SCHOOL_NAMES[p.school] || ""}${p.program}${p.degree}${p.field}`.toLowerCase().includes(query.toLowerCase())
  ),[tab,targets,degree,status,query]);

  const toggleTarget = (id:string) => setTargets(old => old.includes(id) ? old.filter(x=>x!==id) : [...old,id]);
  const toggleCompare = (id:string) => setCompare(old => old.includes(id) ? old.filter(x=>x!==id) : old.length < 3 ? [...old,id] : old);

  return <main>
    <aside>
      <div className="logo"><b>APPLY</b><span>ME</span></div>
      <nav>
        <button className={tab==="library"?"active":""} onClick={()=>setTab("library")}>项目库 <small>{ALL_PROGRAMS.length}</small></button>
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
        <div><span>收录项目</span><b>{ALL_PROGRAMS.length}</b></div>
        <div><span>目标项目</span><b>{targets.length}</b></div>
        <button className={`status-card verified-card ${status==="已核实"?"active":""}`} onClick={()=>setStatus(status==="已核实"?"全部":"已核实")} aria-pressed={status==="已核实"}><span>已核实 · 点击筛选</span><b>{ALL_PROGRAMS.filter(p=>p.verified==="已核实").length}</b></button>
        <button className={`status-card pending-card ${status==="待复核"?"active":""}`} onClick={()=>setStatus(status==="待复核"?"全部":"待复核")} aria-pressed={status==="待复核"}><span>待官方更新 · 点击筛选</span><b>{ALL_PROGRAMS.filter(p=>p.verified==="待复核").length}</b></button>
      </section>

      {status!=="全部" && <div className={`filter-notice ${status==="已核实"?"is-verified":"is-pending"}`}>正在显示：{status==="已核实"?"已核实项目":"待官方更新项目"}（{list.length}）<button onClick={()=>setStatus("全部")}>显示全部</button></div>}

      <div className="toolbar">
        <label><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索学校、专业或方向" /></label>
        <select value={degree} onChange={e=>setDegree(e.target.value)}><option>全部</option><option>MS</option><option>SM</option><option>ScM</option><option>MSE</option><option>MEng</option><option>MMechE</option></select>
      </div>

      <section className="table-card">
        <div className="thead"><span>学校 / 项目</span><span>学位</span><span>申请截止</span><span>推荐信</span><span>材料</span><span>状态</span><span /></div>
        {list.map(p=><article className={`row ${p.verified==="已核实"?"row-verified":"row-pending"}`} key={p.id} onClick={()=>setSelected(p)}>
          <div className="school"><i>{p.rank}</i><div><b>{SCHOOL_NAMES[p.school] || p.school}</b><span>{p.school} · {p.program} · {p.field}</span></div></div>
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
      <p className="disclaimer">院校范围参考 2026 US News 美本综合排名前 50；仅展示机械、机器人、制造或航天相关 MS/MEng 类项目，没有匹配项目的学校不列入项目表。申请要求以项目官网为准，未确认内容标记为“待复核”。</p>
    </section>

    {selected && <div className="overlay" onClick={()=>setSelected(null)}>
      <section className="drawer" onClick={e=>e.stopPropagation()}>
        <button className="close" onClick={()=>setSelected(null)}>×</button>
        <p className="kicker">PROGRAM PROFILE · #{selected.rank}</p>
        <h2>{SCHOOL_NAMES[selected.school] || selected.school}</h2><h3>{selected.school} · {selected.degree} in {selected.program}</h3>
        <button className="target-btn" onClick={()=>toggleTarget(selected.id)}>{targets.includes(selected.id)?"从目标中移除":"＋ 添加到我的目标"}</button>
        <div className="facts">
          <div><span>截止日期</span><b>{dateLabel(selected.deadline)}</b></div><div><span>推荐信</span><b>{selected.letters}</b></div>
          <div><span>CV / Resume</span><b>{selected.cv}</b></div><div><span>SOP / PS</span><b>{selected.sop}</b></div>
          <div><span>GRE</span><b>{selected.gre}</b></div><div><span>学分 / 时长</span><b>{selected.credits} · {selected.duration}</b></div>
        </div>
        <section className="costs">
          <p className="kicker">TUITION & HOUSING PLAN</p><h4>学费与租房预算</h4>
          <div className="cost-grid">
            <div><span>项目学费规划值</span><b>{costFor(selected.school).tuition}</b></div>
            <div><span>合租单间预算</span><b>{costFor(selected.school).shared}</b></div>
            <div><span>整租一居 / Studio</span><b>{costFor(selected.school).privateRoom}</b></div>
          </div>
          <p className="housing-note"><b>常见租房要求：</b>{costFor(selected.school).note}</p>
          <p className="budget-warning">费用为选校规划区间，不是学校报价；不同学分、学制、校区和房源会改变总成本，请在申请和签约前通过官网复核。</p>
        </section>
        <div className="tracks"><p className="kicker">DIRECTIONS & COURSES</p><h4>方向与课程示例</h4>
          {selected.tracks.map(t=><div className="track" key={t.name}><b>{t.name}</b><ul>{t.courses.map(c=><li key={c}>{c}</li>)}</ul></div>)}
        </div>
        <a className="source source-button" href={selected.source} target="_blank" rel="noreferrer">直接进入机械硕士官方网站 ↗</a>
        <p className="source-note">课程为培养方向示例，实际学期开课情况需在选课目录中再次确认。</p>
      </section>
    </div>}

    {!!compare.length && <div className="compare-bar"><span>已选择 {compare.length}/3 个项目</span>{compare.map(id=><b key={id}>{SCHOOL_NAMES[ALL_PROGRAMS.find(p=>p.id===id)?.school || ""] || ALL_PROGRAMS.find(p=>p.id===id)?.school.split(" ")[0]} <button onClick={()=>toggleCompare(id)}>×</button></b>)}<button className="compare-now" onClick={()=>setSelected(ALL_PROGRAMS.find(p=>p.id===compare[0])||null)}>查看对比</button></div>}
  </main>
}
