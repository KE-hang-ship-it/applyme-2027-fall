"use client";

import { useEffect, useMemo, useState } from "react";

type Program = {
  id: string; school: string; rank: number; program: string; degree: string;
  region?: "美国"|"香港"|"加拿大";
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
  "Purdue University":"普渡大学", "University of Georgia":"佐治亚大学", "University of Rochester":"罗切斯特大学",
  "Virginia Polytechnic Institute and State University":"弗吉尼亚理工大学",
  "The University of Hong Kong":"香港大学", "The Chinese University of Hong Kong":"香港中文大学",
  "The Hong Kong University of Science and Technology":"香港科技大学",
  "University of Toronto":"多伦多大学", "University of British Columbia":"英属哥伦比亚大学", "McGill University":"麦吉尔大学"
};

type CostProfile = { tuition:string; shared:string; privateRoom:string; note:string };
const HIGH_COST = new Set(["Stanford University","Massachusetts Institute of Technology","Harvard University","Columbia University","University of California, Berkeley","University of California, Los Angeles","University of Southern California","New York University","Boston University","Northeastern University"]);
const LOWER_COST = new Set(["University of Michigan–Ann Arbor","University of Notre Dame","University of Florida","University of Illinois Urbana-Champaign","University of Wisconsin–Madison","Ohio State University","Purdue University","University of Georgia","University of Rochester"]);
const PRIVATE_SCHOOLS = new Set(["Princeton University","Massachusetts Institute of Technology","Harvard University","Stanford University","University of Pennsylvania","California Institute of Technology","Cornell University","Brown University","Columbia University","Duke University","Johns Hopkins University","Northwestern University","Rice University","Vanderbilt University","Carnegie Mellon University","University of Notre Dame","Washington University in St. Louis","University of Southern California","New York University","Tufts University","Boston University","Lehigh University","Northeastern University","University of Rochester"]);
const HONG_KONG_SCHOOLS = new Set(["The University of Hong Kong","The Chinese University of Hong Kong","The Hong Kong University of Science and Technology"]);
const CANADIAN_SCHOOLS = new Set(["University of Toronto","University of British Columbia","McGill University"]);
const RENTAL_NOTE = "通常需护照/身份证明、录取或在读证明、押金与首月房租；没有当地信用记录时，可能需要担保人或预付数月房租。";
const costFor = (school:string):CostProfile => {
  if (HONG_KONG_SCHOOLS.has(school)) return {tuition:"约 HK$180,000–320,000/项目",shared:"约 HK$5,500–10,000/月",privateRoom:"约 HK$12,000–25,000/月",note:RENTAL_NOTE};
  if (CANADIAN_SCHOOLS.has(school)) return {tuition:"约 C$25,000–70,000/学年（国际生）",shared:"约 C$900–1,800/月",privateRoom:"约 C$1,500–3,000/月",note:RENTAL_NOTE};
  return {
    tuition:PRIVATE_SCHOOLS.has(school) ? "约 US$55,000–75,000/学年" : "约 US$30,000–60,000/学年（国际生）",
    shared:HIGH_COST.has(school) ? "约 US$1,000–1,800/月" : LOWER_COST.has(school) ? "约 US$600–1,000/月" : "约 US$750–1,300/月",
    privateRoom:HIGH_COST.has(school) ? "约 US$1,600–3,000/月" : LOWER_COST.has(school) ? "约 US$900–1,500/月" : "约 US$1,100–2,000/月",
    note:RENTAL_NOTE
  };
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

const REGIONAL_PROGRAMS: Program[] = [
  {...relatedProgram("vtech-me","Virginia Polytechnic Institute and State University",51,"Mechanical Engineering","MS","机械工程","https://me.vt.edu/graduate.html",[{name:"Robotics & Control",courses:["Robotics","Control Systems","Mechatronics"]},{name:"Thermal Fluids",courses:["Thermodynamics","Fluid Mechanics","Heat Transfer"]}]),region:"美国"},
  {...relatedProgram("hku-me","The University of Hong Kong",1,"Mechanical Engineering","MSc(Eng)","机械工程","https://www.mech.hku.hk/academic-programmes/postgraduate/taught-postgraduate",[{name:"Energy & Environment",courses:["Energy Systems","Thermofluids","Sustainability"]},{name:"Design & Manufacturing",courses:["Advanced Manufacturing","Design","Materials"]}]),region:"香港"},
  {...relatedProgram("cuhk-mae","The Chinese University of Hong Kong",2,"Mechanical and Automation Engineering","MSc","机械/自动化","https://www.mae.cuhk.edu.hk/programmes/postgraduate-programmes/",[{name:"Robotics & Automation",courses:["Robotics","Automation","Machine Intelligence"]},{name:"Smart Manufacturing",courses:["Manufacturing Systems","Control","Data Analytics"]}]),region:"香港"},
  {...relatedProgram("hkust-me","The Hong Kong University of Science and Technology",3,"Mechanical Engineering","MSc","机械工程","https://prog-crs.hkust.edu.hk/pgprog/2026-27/msc-mech",[{name:"Advanced Materials",courses:["Materials","Mechanics","Manufacturing"]},{name:"Energy & Fluids",courses:["Energy Systems","Fluid Mechanics","Heat Transfer"]}]),region:"香港"},
  {...relatedProgram("utoronto-me","University of Toronto",1,"Mechanical and Industrial Engineering","MEng","机械工程","https://www.mie.utoronto.ca/programs/graduate/master-of-engineering/",[{name:"Robotics",courses:["Robotics","Control","AI for Engineering"]},{name:"Advanced Manufacturing",courses:["Manufacturing","Design","Optimization"]}]),region:"加拿大"},
  {...relatedProgram("ubc-me","University of British Columbia",2,"Mechanical Engineering","MEng","机械工程","https://mech.ubc.ca/graduate/master-of-engineering/",[{name:"Mechatronics",courses:["Mechatronics","Robotics","Control"]},{name:"Thermofluids",courses:["Fluid Mechanics","Heat Transfer","Energy"]}]),region:"加拿大"},
  {...relatedProgram("mcgill-me","McGill University",3,"Mechanical Engineering","MEng","机械工程","https://www.mcgill.ca/mecheng/grad",[{name:"Design & Manufacturing",courses:["Design","Manufacturing","Materials"]},{name:"Dynamics & Control",courses:["Dynamics","Control","Robotics"]}]),region:"加拿大"}
];

const ALL_PROGRAMS = [...PROGRAMS, ...EXTRA_PROGRAMS, ...REGIONAL_PROGRAMS].sort((a,b)=>a.rank-b.rank || a.school.localeCompare(b.school));
const PROGRAM_BY_ID = new Map(ALL_PROGRAMS.map(program=>[program.id,program]));

const dateLabel = (date: string) => date === "待公布" ? date : new Date(`${date}T00:00:00`).toLocaleDateString("zh-CN", {year:"numeric",month:"short",day:"numeric"});
const courseDescription = (course:string) => {
  const name = course.toLowerCase();
  if (name.includes("robot")) return "围绕机器人建模、运动学、动力学、感知、规划与控制展开，通常包含算法作业或系统项目。";
  if (name.includes("control") || name.includes("linear system")) return "研究动态系统建模、稳定性、反馈控制与状态空间方法，并将理论应用于机械或机电系统。";
  if (name.includes("fluid") || name.includes("aerodynamic")) return "学习流体运动的基本方程、边界层及工程分析方法，可能涉及计算或实验流体力学。";
  if (name.includes("heat") || name.includes("thermal") || name.includes("thermodynamic")) return "涵盖热力学、传热与能量转换中的高级分析方法，并解决实际热系统设计问题。";
  if (name.includes("manufactur")) return "介绍现代制造工艺、生产系统、数字化制造与面向制造的设计，通常结合案例或项目。";
  if (name.includes("design") || name.includes("optimization")) return "聚焦工程设计流程、建模、约束条件与优化决策，通常通过团队项目完成方案迭代。";
  if (name.includes("material") || name.includes("solid") || name.includes("mechanic")) return "研究材料与结构在载荷下的力学行为，涉及应力、变形、失效及数值分析。";
  if (name.includes("energy") || name.includes("sustain")) return "分析能源转换、利用效率与可持续工程方案，并评估系统层面的技术和环境表现。";
  if (name.includes("machine learning") || name.includes("artificial intelligence") || name.includes("data")) return "将机器学习和数据分析方法用于工程建模、预测、感知或自主系统。";
  return "该课程属于本方向的研究生课程模块，具体教学内容、学分、先修要求和开课学期请通过项目官网课程目录确认。";
};

type Category = "Favorite"|"Dream"|"Target"|"Safety"|"Priority";
type View = "dashboard"|"schools"|"favorites";
type ChatMessage = {role:"assistant"|"user";text:string;source?:string};
const CATEGORY_LABELS: Record<Category,string> = {Favorite:"收藏",Dream:"梦校",Target:"目标",Safety:"保底",Priority:"优先"};
const LOCATION_BY_SCHOOL: Record<string,string> = {
  "Stanford University":"Stanford, California", "Massachusetts Institute of Technology":"Cambridge, Massachusetts",
  "Princeton University":"Princeton, New Jersey", "Cornell University":"Ithaca, New York",
  "Columbia University":"New York, New York", "University of Pennsylvania":"Philadelphia, Pennsylvania",
  "Northwestern University":"Evanston, Illinois", "Johns Hopkins University":"Baltimore, Maryland",
  "Duke University":"Durham, North Carolina", "Rice University":"Houston, Texas",
  "University of Michigan–Ann Arbor":"Ann Arbor, Michigan", "Carnegie Mellon University":"Pittsburgh, Pennsylvania",
  "University of Southern California":"Los Angeles, California", "University of California, Los Angeles":"Los Angeles, California",
  "University of California, Berkeley":"Berkeley, California", "University of Texas at Austin":"Austin, Texas",
  "Georgia Institute of Technology":"Atlanta, Georgia", "New York University":"New York, New York",
  "Virginia Polytechnic Institute and State University":"Blacksburg, Virginia",
  "The University of Hong Kong":"Hong Kong", "The Chinese University of Hong Kong":"Hong Kong",
  "The Hong Kong University of Science and Technology":"Hong Kong", "University of Toronto":"Toronto, Ontario",
  "University of British Columbia":"Vancouver, British Columbia", "McGill University":"Montreal, Quebec"
};
const APP_FEE_BY_REGION: Record<string,string> = {美国:"US$75–150",香港:"HK$300–600",加拿大:"C$125–170"};
const deadlineInfo = (deadline:string) => {
  if (deadline === "待公布") return {label:"待公布",days:null,tone:"unknown"};
  const days = Math.ceil((new Date(`${deadline}T23:59:59`).getTime()-Date.now())/86400000);
  if (days < 0) return {label:"Closed",days,tone:"expired"};
  return {label:`${days} Days Left`,days,tone:days>60?"safe":days>=30?"watch":days>=15?"soon":"urgent"};
};
const programLocation = (program:Program) => LOCATION_BY_SCHOOL[program.school] || (program.region==="香港"?"Hong Kong":program.region==="加拿大"?"Canada":"United States");
const programRegion = (program:Program) => program.region || "美国";
const schoolDomain = (program:Program) => {try{return new URL(program.source).hostname.replace(/^www\./,"")}catch{return ""}};
const schoolIconUrl = (program:Program) => `https://www.google.com/s2/favicons?domain_url=https://${schoolDomain(program)}&sz=128`;
function SchoolLogo({program,className=""}:{program:Program;className?:string}){
  const label=(SCHOOL_NAMES[program.school]||program.school).slice(0,1);
  return <span className={`school-logo ${className}`}><em>{label}</em><img src={schoolIconUrl(program)} alt={`${SCHOOL_NAMES[program.school]||program.school} 校徽`} onError={e=>{e.currentTarget.style.display="none"}} /></span>;
}
const answerSchoolQuestion = (question:string,contextId?:string) => {
  const q=question.trim().toLowerCase();
  const explicitProgram=ALL_PROGRAMS.find(p=>q.includes(p.school.toLowerCase())||q.includes((SCHOOL_NAMES[p.school]||"").toLowerCase())||q.includes(p.id.split("-")[0]));
  const program=explicitProgram||(contextId?PROGRAM_BY_ID.get(contextId):undefined);
  if(!program){
    if(q.includes("机器人")||q.includes("robot")){const schools=ALL_PROGRAMS.filter(p=>p.tracks.some(t=>`${t.name}${t.courses.join("")}`.toLowerCase().includes("robot"))).slice(0,6);return {text:`机器人相关项目可以先看：${schools.map(p=>SCHOOL_NAMES[p.school]||p.school).join("、")}。你可以继续问我其中一所的截止日期、费用或课程。`};}
    if(q.includes("香港"))return {text:"香港区目前收录香港大学、香港中文大学和香港科技大学。你可以直接问，例如“香港科技大学有哪些方向？”"};
    if(q.includes("加拿大"))return {text:"加拿大区目前收录多伦多大学、英属哥伦比亚大学和麦吉尔大学。告诉我学校名称，我可以查询费用、课程和申请要求。"};
    return {text:"我可以查询网站内学校的截止日期、推荐信、GRE、学费、生活费、方向、课程、位置和官网。请带上学校名称，例如：“康奈尔大学学费是多少？”"};
  }
  const name=SCHOOL_NAMES[program.school]||program.school;
  const linked={source:program.source,programId:program.id};
  if(q.includes("截止")||q.includes("deadline")){const d=deadlineInfo(program.deadline);return {text:`${name} ${program.degree} 项目的截止日期是 ${dateLabel(program.deadline)}，当前状态：${d.label}。`,...linked};}
  if(q.includes("学费")||q.includes("费用")||q.includes("预算")||q.includes("cost")){const c=costFor(program.school);return {text:`${name} 的规划学费为 ${c.tuition}；合租约 ${c.shared}，独居约 ${c.privateRoom}；申请费参考 ${APP_FEE_BY_REGION[programRegion(program)]}。请以官网账单为准。`,...linked};}
  if(q.includes("推荐信")||q.includes("材料")){return {text:`${name} 当前记录：推荐信 ${program.letters}，CV ${program.cv}，SOP/PS ${program.sop}，GRE ${program.gre}。`,...linked};}
  if(q.includes("gre")){return {text:`${name} ${program.degree} 项目的 GRE 要求当前记录为：${program.gre}。`,...linked};}
  if(q.includes("课程")||q.includes("方向")||q.includes("研究")){return {text:`${name} 当前整理的方向包括：${program.tracks.map(t=>`${t.name}（${t.courses.join("、")}）`).join("；")}。`,...linked};}
  if(q.includes("位置")||q.includes("城市")||q.includes("州")){return {text:`${name} 位于 ${programLocation(program)}。`,...linked};}
  if(q.includes("官网")||q.includes("链接")){return {text:`这是 ${name} 的机械工程硕士官方页面：`,...linked};}
  return {text:`${name} 提供 ${program.degree} in ${program.program}，综合排名记录为 #${program.rank}，位于 ${programLocation(program)}。你还可以继续问“学费呢？”或“课程呢？”。`,...linked};
};

export default function Home() {
  const [view,setView] = useState<View>("dashboard");
  const [tab,setTab] = useState<"library"|"targets">("library");
  const [query,setQuery] = useState("");
  const [degree,setDegree] = useState("全部");
  const [region,setRegion] = useState<"美国"|"香港"|"加拿大">("美国");
  const [status,setStatus] = useState<"全部"|"已核实"|"待复核">("全部");
  const [targets,setTargets] = useState<string[]>([]);
  const [selected,setSelected] = useState<Program | null>(null);
  const [selectedCourse,setSelectedCourse] = useState<{course:string;track:string;program:Program}|null>(null);
  const [compare,setCompare] = useState<string[]>([]);
  const [compareOpen,setCompareOpen] = useState(false);
  const [ready,setReady] = useState(false);
  const [dark,setDark] = useState(false);
  const [filtersOpen,setFiltersOpen] = useState(false);
  const [categoryFilter,setCategoryFilter] = useState<Category|"全部">("全部");
  const [categories,setCategories] = useState<Record<string,Category>>({});
  const [notes,setNotes] = useState<Record<string,string>>({});
  const [featureFilters,setFeatureFilters] = useState<string[]>([]);
  const [rankMax,setRankMax] = useState("全部");
  const [deadlineWindow,setDeadlineWindow] = useState("全部");
  const [assistantOpen,setAssistantOpen] = useState(false);
  const [assistantQuery,setAssistantQuery] = useState("");
  const [messages,setMessages] = useState<ChatMessage[]>([{role:"assistant",text:"你好，我是坤械助手。可以问我学校、申请要求、费用、截止日期或课程。"}]);
  const [assistantSchool,setAssistantSchool] = useState<string>();

  useEffect(() => {
    const saved = localStorage.getItem("me-targets");
    if (saved) setTargets(JSON.parse(saved));
    const savedCategories=localStorage.getItem("me-categories"); if(savedCategories)setCategories(JSON.parse(savedCategories));
    const savedNotes=localStorage.getItem("me-notes"); if(savedNotes)setNotes(JSON.parse(savedNotes));
    localStorage.removeItem("me-trackers");
    const savedTheme=localStorage.getItem("me-theme"); setDark(savedTheme?savedTheme==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches);
    setReady(true);
  },[]);
  useEffect(() => { if (ready) localStorage.setItem("me-targets",JSON.stringify(targets)); },[targets,ready]);
  useEffect(()=>{if(ready)localStorage.setItem("me-categories",JSON.stringify(categories))},[categories,ready]);
  useEffect(()=>{if(ready)localStorage.setItem("me-notes",JSON.stringify(notes))},[notes,ready]);
  useEffect(()=>{if(ready){localStorage.setItem("me-theme",dark?"dark":"light");document.documentElement.dataset.theme=dark?"dark":"light"}},[dark,ready]);

  const list = useMemo(() => ALL_PROGRAMS.filter(p =>
    (tab === "library" || targets.includes(p.id)) &&
    (tab === "targets" || (p.region || "美国") === region) &&
    (degree === "全部" || p.degree === degree) &&
    (status === "全部" || p.verified === status) &&
    (rankMax === "全部" || p.rank <= Number(rankMax)) &&
    (deadlineWindow === "全部" || (deadlineInfo(p.deadline).days !== null && deadlineInfo(p.deadline).days! >= 0 && deadlineInfo(p.deadline).days! <= Number(deadlineWindow))) &&
    (categoryFilter === "全部" || categories[p.id] === categoryFilter) &&
    featureFilters.every(feature=>`${p.field} ${p.program} ${p.tracks.map(t=>`${t.name} ${t.courses.join(" ")}`).join(" ")}`.toLowerCase().includes(feature.toLowerCase().replace(/s$/,""))) &&
    `${p.school}${SCHOOL_NAMES[p.school] || ""}${p.program}${p.degree}${p.field}${programLocation(p)}`.toLowerCase().includes(query.toLowerCase())
  ),[tab,targets,degree,status,region,query,categoryFilter,categories,featureFilters,rankMax,deadlineWindow]);

  const toggleTarget = (id:string) => setTargets(old => old.includes(id) ? old.filter(x=>x!==id) : [...old,id]);
  const toggleCompare = (id:string) => setCompare(old => old.includes(id) ? old.filter(x=>x!==id) : old.length < 3 ? [...old,id] : old);
  const setCategory=(id:string,value:string)=>setCategories(old=>{const next={...old};if(!value)delete next[id];else next[id]=value as Category;return next});
  const upcoming=useMemo(()=>ALL_PROGRAMS.filter(p=>deadlineInfo(p.deadline).days!==null&&deadlineInfo(p.deadline).days!>=0).sort((a,b)=>(deadlineInfo(a.deadline).days||0)-(deadlineInfo(b.deadline).days||0)).slice(0,8),[]);
  const sendAssistantQuestion=(value:string)=>{const question=value.trim();if(!question)return;const answer=answerSchoolQuestion(question,assistantSchool);if("programId" in answer&&answer.programId)setAssistantSchool(answer.programId);setMessages(old=>[...old,{role:"user",text:question},{role:"assistant",text:answer.text,source:"source" in answer?answer.source:undefined}]);setAssistantQuery("")};
  const askAssistant=()=>sendAssistantQuestion(assistantQuery);
  const title=view==="dashboard"?"Dashboard":view==="favorites"?"收藏与分类":"项目库";

  return <main className="app-shell">
    <aside>
      <div className="logo"><b>APPLY</b><span>ME</span></div>
      <nav className="primary-nav">
        <button className={view==="dashboard"?"active":""} onClick={()=>setView("dashboard")}><span>⌂</span> Dashboard</button>
        <button className={view==="schools"?"active":""} onClick={()=>{setView("schools");setTab("library")}}><span>◇</span> 项目库 <small>{ALL_PROGRAMS.length}</small></button>
        <button className={view==="favorites"?"active":""} onClick={()=>setView("favorites")}><span>☆</span> 收藏分类 <small>{Object.keys(categories).length}</small></button>
      </nav>
      <button className="theme-toggle" onClick={()=>setDark(v=>!v)} aria-label="切换深色模式"><span>{dark?"☀":"◐"}</span>{dark?"浅色模式":"深色模式"}</button>
      <div className="side-note"><b>2027 FALL</b><p>机械工程硕士申请</p><span>数据保存在当前浏览器</span></div>
    </aside>

    <section className="page">
      <header>
        <div><p>MASTER'S APPLICATION WORKSPACE</p><h1>{title}</h1></div>
        <div className="header-actions"><label className="global-search"><span>⌕</span><input value={query} onFocus={()=>setView("schools")} onChange={e=>{setQuery(e.target.value);setView("schools")}} placeholder="搜索学校、专业、城市或州" /></label><div className="season">申请季 <b>2027 Fall</b></div></div>
      </header>

      {view==="dashboard" && <section className="dashboard-view">
        <div className="dashboard-heading"><div><span className="eyebrow">UPCOMING DEADLINES</span><h2>即将截止</h2></div><button onClick={()=>setView("schools")}>查看全部项目 →</button></div>
        <div className="deadline-grid">{upcoming.length?upcoming.map(p=>{const d=deadlineInfo(p.deadline);return <button className="deadline-card" key={p.id} onClick={()=>setSelected(p)}><SchoolLogo program={p}/><div><b>{SCHOOL_NAMES[p.school]||p.school}</b><span>{p.degree} · {p.program}</span></div><em className={`countdown ${d.tone}`}>{d.label}</em><small>{dateLabel(p.deadline)}</small></button>}):<div className="premium-empty"><b>暂无已公布的临近截止日期</b><span>项目公布 2027 Fall 截止日期后会自动按剩余天数排序。</span></div>}</div>
      </section>}

      {(view==="schools"||view==="favorites") && <>
      <section className="summary compact-summary">
        <button onClick={()=>{setTab("library");setCategoryFilter("全部")}}><span>收录项目</span><b>{ALL_PROGRAMS.length}</b></button>
        <button onClick={()=>setTab("targets")}><span>我的目标</span><b>{targets.length}</b></button>
        <button className={`status-card verified-card ${status==="已核实"?"active":""}`} onClick={()=>setStatus(status==="已核实"?"全部":"已核实")}><span>已核实</span><b>{ALL_PROGRAMS.filter(p=>p.verified==="已核实").length}</b></button>
        <button className={`status-card pending-card ${status==="待复核"?"active":""}`} onClick={()=>setStatus(status==="待复核"?"全部":"待复核")}><span>待更新</span><b>{ALL_PROGRAMS.filter(p=>p.verified==="待复核").length}</b></button>
      </section>

      {status!=="全部" && <div className={`filter-notice ${status==="已核实"?"is-verified":"is-pending"}`}>正在显示：{status==="已核实"?"已核实项目":"待官方更新项目"}（{list.length}）<button onClick={()=>setStatus("全部")}>显示全部</button></div>}

      <div className="toolbar">
        <div className="region-tabs" aria-label="地区筛选">{(["美国","香港","加拿大"] as const).map(r=><button key={r} className={region===r?"active":""} onClick={()=>setRegion(r)}>{r}</button>)}</div>
        <select value={degree} onChange={e=>setDegree(e.target.value)}><option>全部</option><option>MS</option><option>MSc</option><option>MSc(Eng)</option><option>SM</option><option>ScM</option><option>MSE</option><option>MEng</option><option>MMechE</option></select>
        <select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value as Category|"全部")}><option value="全部">全部分类</option>{Object.entries(CATEGORY_LABELS).map(([v,l])=><option value={v} key={v}>{l}</option>)}</select>
        <select value={rankMax} onChange={e=>setRankMax(e.target.value)}><option value="全部">全部排名</option><option value="10">Top 10</option><option value="20">Top 20</option><option value="30">Top 30</option><option value="50">Top 50</option></select>
        <select value={deadlineWindow} onChange={e=>setDeadlineWindow(e.target.value)}><option value="全部">全部截止时间</option><option value="30">30 天内</option><option value="60">60 天内</option><option value="90">90 天内</option></select>
        <button className={`filter-button ${filtersOpen?"active":""}`} onClick={()=>setFiltersOpen(v=>!v)}>筛选 {featureFilters.length?`· ${featureFilters.length}`:""}</button>
      </div>
      {filtersOpen&&<div className="filter-panel"><span>研究方向</span>{["Robotics","Controls","Thermal","Manufacturing","Materials","Artificial Intelligence"].map(f=><button key={f} className={featureFilters.includes(f)?"active":""} onClick={()=>setFeatureFilters(old=>old.includes(f)?old.filter(x=>x!==f):[...old,f])}>{f}</button>)}<button className="clear-filter" onClick={()=>setFeatureFilters([])}>清除</button></div>}

      <section className="table-card">
        <div className="thead"><span>学校 / 项目</span><span>学位</span><span>截止日期</span><span>倒计时</span><span>分类</span><span>状态</span><span /></div>
        {list.map(p=><article className={`row ${p.verified==="已核实"?"row-verified":"row-pending"}`} key={p.id} onClick={()=>setSelected(p)}>
          <div className="school"><SchoolLogo program={p}/><div><b>{SCHOOL_NAMES[p.school] || p.school}</b><span>#{p.rank} · {p.school} · {p.program} · {p.field}</span></div></div>
          <strong className="degree">{p.degree}</strong>
          <span>{dateLabel(p.deadline)}</span>
          <span className={`countdown ${deadlineInfo(p.deadline).tone}`}>{deadlineInfo(p.deadline).label}</span>
          <select className={`category-select ${categories[p.id]||""}`} value={categories[p.id]||""} onClick={e=>e.stopPropagation()} onChange={e=>setCategory(p.id,e.target.value)}><option value="">未分类</option>{Object.entries(CATEGORY_LABELS).map(([v,l])=><option value={v} key={v}>{l}</option>)}</select>
          <span className={p.verified==="已核实"?"verified":"pending"}>{p.verified}</span>
          <div className="actions">
            <button className={compare.includes(p.id)?"selected":""} onClick={e=>{e.stopPropagation();toggleCompare(p.id)}} title="加入对比">Compare</button>
            <button className={targets.includes(p.id)?"saved":""} onClick={e=>{e.stopPropagation();toggleTarget(p.id)}} title="添加或移除目标">{targets.includes(p.id)?"−":"＋"}</button>
          </div>
        </article>)}
        {!list.length && <div className="empty">{tab==="targets"?"还没有目标项目，请从项目库点击“＋”添加。":"没有找到项目。"}</div>}
      </section>
      <p className="disclaimer">申请要求与费用以项目官网为准；未确认内容标记为“待复核”。个人分类、笔记与进度仅保存在当前浏览器。</p>
      </>}

    </section>

    {selected && <div className="overlay" onClick={()=>setSelected(null)}>
      <section className="drawer" onClick={e=>e.stopPropagation()}>
        <button className="close" onClick={()=>setSelected(null)}>×</button>
        <div className="school-banner"><SchoolLogo program={selected} className="school-mark"/><span>{programLocation(selected)}</span></div>
        <p className="kicker">PROGRAM PROFILE · #{selected.rank}</p>
        <h2>{SCHOOL_NAMES[selected.school] || selected.school}</h2><h3>{selected.school} · {selected.degree} in {selected.program}</h3>
        <div className="detail-actions"><button className="target-btn" onClick={()=>toggleTarget(selected.id)}>{targets.includes(selected.id)?"从目标中移除":"＋ 添加到我的目标"}</button><select className={`category-select ${categories[selected.id]||""}`} value={categories[selected.id]||""} onChange={e=>setCategory(selected.id,e.target.value)}><option value="">设置分类</option>{Object.entries(CATEGORY_LABELS).map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></div>
        <section className="detail-overview"><div><span>院系</span><b>{selected.program}</b></div><div><span>学位</span><b>{selected.degree}</b></div><div><span>位置</span><b>{programLocation(selected)}</b></div><div><span>US News</span><b>#{selected.rank}</b></div><div><span>QS 排名</span><b>Not Available</b></div><div><span>机械工程排名</span><b>Not Available</b></div></section>
        <div className={`detail-deadline ${deadlineInfo(selected.deadline).tone}`}><div><span>APPLICATION DEADLINE</span><b>{dateLabel(selected.deadline)}</b></div><strong>{deadlineInfo(selected.deadline).label}</strong></div>
        <div className="facts">
          <div><span>截止日期</span><b>{dateLabel(selected.deadline)}</b></div><div><span>推荐信</span><b>{selected.letters}</b></div>
          <div><span>CV / Resume</span><b>{selected.cv}</b></div><div><span>SOP / PS</span><b>{selected.sop}</b></div>
          <div><span>GRE</span><b>{selected.gre}</b></div><div><span>学分 / 时长</span><b>{selected.credits} · {selected.duration}</b></div>
        </div>
        <section className="costs">
          <p className="kicker">COST INFORMATION</p><h4>费用估算</h4>
          <div className="cost-grid">
            <div><span>申请费</span><b>{APP_FEE_BY_REGION[programRegion(selected)]||"Not Available"}</b></div>
            <div><span>项目学费</span><b>{costFor(selected.school).tuition}</b></div>
            <div><span>生活费 / 合租</span><b>{costFor(selected.school).shared}</b></div>
            <div><span>保险</span><b>Not Available</b></div>
            <div><span>独居预算</span><b>{costFor(selected.school).privateRoom}</b></div>
            <div><span>预计总成本</span><b>Not Available</b></div>
          </div>
          <p className="housing-note"><b>常见租房要求：</b>{costFor(selected.school).note}</p>
          <p className="budget-warning">费用为选校规划区间，不是学校报价；不同学分、学制、校区和房源会改变总成本，请在申请和签约前通过官网复核。</p>
        </section>
        <div className="tracks"><p className="kicker">DIRECTIONS & COURSES</p><h4>官网方向与课程整理</h4>
          {selected.tracks.map(t=><div className="track" key={t.name}><b>{t.name}</b><ul>{t.courses.map(c=><li key={c}><button onClick={()=>setSelectedCourse({course:c,track:t.name,program:selected})}>{c}<span>查看介绍</span></button></li>)}</ul></div>)}
        </div>
        <section className="notes-section"><p className="kicker">PRIVATE NOTES · AUTO SAVED</p><h4>私人笔记</h4><textarea value={notes[selected.id]||""} onChange={e=>setNotes(old=>({...old,[selected.id]:e.target.value}))} placeholder="记录教授、研究方向、就业、天气、安全或个人想法…" /><span>仅保存在当前浏览器</span></section>
        <div className="official-links"><a className="source source-button" href={selected.source} target="_blank" rel="noreferrer">Department Website ↗</a><a className="source secondary-link" href={selected.source} target="_blank" rel="noreferrer">Official Website ↗</a><a className="source secondary-link" href={selected.source} target="_blank" rel="noreferrer">Application Portal ↗</a></div>
        <p className="last-updated">Last Updated · July 17, 2026</p>
        <p className="source-note">第一批完整整理范围为美国综合排名前 20 中已收录项目、香港 3 所及加拿大 3 所。课程名称与开课安排可能按学期调整，请以按钮链接进入的官方页面为最终依据。</p>
      </section>
    </div>}

    {selectedCourse && <div className="course-overlay" onClick={()=>setSelectedCourse(null)}>
      <section className="course-modal" role="dialog" aria-modal="true" aria-labelledby="course-title" onClick={e=>e.stopPropagation()}>
        <button className="course-close" onClick={()=>setSelectedCourse(null)} aria-label="关闭课程介绍">×</button>
        <p className="kicker">COURSE PROFILE</p>
        <h3 id="course-title">{selectedCourse.course}</h3>
        <p className="course-school">{SCHOOL_NAMES[selectedCourse.program.school] || selectedCourse.program.school} · {selectedCourse.track}</p>
        <div className="course-description"><span>课程内容导读</span><p>{courseDescription(selectedCourse.course)}</p></div>
        <div className="course-meta"><div><span>所属项目</span><b>{selectedCourse.program.degree} · {selectedCourse.program.program}</b></div><div><span>学分 / 先修课</span><b>请在当学年官方课程目录确认</b></div></div>
        <a className="source source-button" href={selectedCourse.program.source} target="_blank" rel="noreferrer">前往官方项目与课程页面 ↗</a>
        <p className="source-note">中文内容为便于选校的概括，不替代官网原始课程说明。</p>
      </section>
    </div>}

    <button className={`assistant-launcher ${assistantOpen?"open":""}`} onClick={()=>setAssistantOpen(v=>!v)} aria-label="打开坤械助手"><img src="./kun-mech-assistant.png" alt="坤械助手"/><span><b>坤械助手</b><small>问学校问题</small></span></button>
    {assistantOpen&&<section className="assistant-panel" aria-label="坤械助手聊天窗口"><header><img src="./kun-mech-assistant.png" alt=""/><div><b>坤械助手</b><span>在线 · 支持连续追问</span></div><button onClick={()=>setAssistantOpen(false)}>×</button></header><div className="assistant-messages">{messages.map((m,i)=><div key={i} className={`assistant-message ${m.role}`}><p>{m.text}</p>{m.source&&<a href={m.source} target="_blank" rel="noreferrer">查看官方页面 ↗</a>}</div>)}</div><div className="assistant-suggestions">{["康奈尔大学学费","港科大有哪些方向","多伦多大学申请材料"].map(q=><button key={q} onClick={()=>sendAssistantQuestion(q)}>{q}</button>)}</div><form onSubmit={e=>{e.preventDefault();askAssistant()}}><input value={assistantQuery} onChange={e=>setAssistantQuery(e.target.value)} placeholder="输入学校和问题，也可以连续追问…" autoFocus/><button type="submit">发送</button></form><small className="assistant-note">回答来自当前网站数据，申请前请以官网为准。</small></section>}

    {compareOpen&&<div className="compare-overlay" onClick={()=>setCompareOpen(false)}><section className="compare-modal" onClick={e=>e.stopPropagation()}><button className="course-close" onClick={()=>setCompareOpen(false)}>×</button><p className="kicker">SCHOOL COMPARISON</p><h2>学校对比</h2><div className="compare-table"><div className="compare-labels"><b>项目</b><span>综合排名</span><span>申请费</span><span>学费</span><span>生活费</span><span>截止日期</span><span>位置</span><span>研究优势</span><span>官网</span></div>{compare.map(id=>{const p=PROGRAM_BY_ID.get(id);if(!p)return null;return <div className="compare-column" key={id}><b>{SCHOOL_NAMES[p.school]||p.school}</b><span>#{p.rank}</span><span>{APP_FEE_BY_REGION[programRegion(p)]}</span><span>{costFor(p.school).tuition}</span><span>{costFor(p.school).shared}</span><span>{dateLabel(p.deadline)}</span><span>{programLocation(p)}</span><span>{p.tracks.map(t=>t.name).join(" · ")}</span><a href={p.source} target="_blank" rel="noreferrer">官网 ↗</a></div>})}</div></section></div>}
    {!!compare.length && <div className="compare-bar"><span>已选择 {compare.length}/3 个项目</span>{compare.map(id=>{const program=PROGRAM_BY_ID.get(id);return <b key={id}>{program ? SCHOOL_NAMES[program.school] || program.school.split(" ")[0] : id} <button onClick={()=>toggleCompare(id)}>×</button></b>})}<button className="compare-now" disabled={compare.length<2} onClick={()=>setCompareOpen(true)}>对比 {compare.length} 所学校</button></div>}
  </main>
}
