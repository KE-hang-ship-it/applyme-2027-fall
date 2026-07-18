"use client";

/* eslint-disable react-hooks/set-state-in-effect, react/no-unescaped-entities */

import { useEffect, useMemo, useRef, useState } from "react";
import { SchoolLogo } from "@/components/SchoolLogo";
import { EmptyState } from "@/components/EmptyState";
import { CompareButton } from "@/components/programs/CompareButton";
import { RankingBadge } from "@/components/programs/RankingBadge";
import { VerificationStatus } from "@/components/programs/VerificationStatus";
import { getFieldVerification, overallVerification } from "@/lib/program-status";
import { getTrustedRanking } from "@/lib/ranking-display";
import type { CalendarNote, Category, ChatMessage, CostProfile, Program, ThemeMode, View } from "@/types/application";

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
  "University of Toronto":"多伦多大学", "University of British Columbia":"英属哥伦比亚大学", "McGill University":"麦吉尔大学", "University of Waterloo":"滑铁卢大学",
  "City University of Hong Kong":"香港城市大学", "Hong Kong Polytechnic University":"香港理工大学", "Hong Kong Baptist University":"香港浸会大学", "Lingnan University":"岭南大学", "Education University of Hong Kong":"香港教育大学",
  "Imperial College London":"帝国理工学院", "University of Oxford":"牛津大学", "University of Cambridge":"剑桥大学", "University College London":"伦敦大学学院", "University of Edinburgh":"爱丁堡大学", "King's College London":"伦敦国王学院", "University of Manchester":"曼彻斯特大学", "University of Bristol":"布里斯托大学", "London School of Economics and Political Science":"伦敦政治经济学院", "University of Warwick":"华威大学", "University of Birmingham":"伯明翰大学", "University of Glasgow":"格拉斯哥大学", "University of Leeds":"利兹大学", "University of Sheffield":"谢菲尔德大学", "Durham University":"杜伦大学", "University of Nottingham":"诺丁汉大学",
  "Adelaide University":"阿德莱德大学", "Australian National University":"澳大利亚国立大学", "University of Melbourne":"墨尔本大学", "Monash University":"莫纳什大学", "University of New South Wales":"新南威尔士大学", "University of Queensland":"昆士兰大学", "University of Sydney":"悉尼大学", "University of Western Australia":"西澳大学"
};

const HIGH_COST = new Set(["Stanford University","Massachusetts Institute of Technology","Harvard University","Columbia University","University of California, Berkeley","University of California, Los Angeles","University of Southern California","New York University","Boston University","Northeastern University"]);
const LOWER_COST = new Set(["University of Michigan–Ann Arbor","University of Notre Dame","University of Florida","University of Illinois Urbana-Champaign","University of Wisconsin–Madison","Ohio State University","Purdue University","University of Georgia","University of Rochester"]);
const HONG_KONG_SCHOOLS = new Set(["The University of Hong Kong","The Chinese University of Hong Kong","The Hong Kong University of Science and Technology","City University of Hong Kong","Hong Kong Polytechnic University","Hong Kong Baptist University","Lingnan University","Education University of Hong Kong"]);
const CANADIAN_SCHOOLS = new Set(["University of Toronto","University of British Columbia","McGill University","University of Waterloo"]);
const BRITISH_SCHOOLS = new Set(["Imperial College London","University of Oxford","University of Cambridge","University College London","University of Edinburgh","King's College London","University of Manchester","University of Bristol","London School of Economics and Political Science","University of Warwick","University of Birmingham","University of Glasgow","University of Leeds","University of Sheffield","Durham University","University of Nottingham"]);
const AUSTRALIAN_SCHOOLS = new Set(["Adelaide University","Australian National University","University of Melbourne","Monash University","University of New South Wales","University of Queensland","University of Sydney","University of Western Australia"]);
const ME_TUITION:Record<string,string>={
  "Stanford University":"约 US$65,000–75,000 / 45-unit MS 项目",
  "Massachusetts Institute of Technology":"约 US$64,000 / 学年（SM）",
  "Carnegie Mellon University":"约 US$58,000–62,000 / MS 项目",
  "Cornell University":"约 US$71,000–75,000 / MEng 项目",
  "University of Waterloo":"约 C$38,000–45,000 / 16个月 MEng",
  "The Hong Kong University of Science and Technology":"约 HK$210,000–250,000 / MSc 项目",
  "Hong Kong Polytechnic University":"约 HK$240,000–260,000 / MSc 项目",
  "Imperial College London":"约 £42,000–45,000 / MSc 项目",
  "University College London":"约 £39,000–43,000 / MSc 项目",
  "University of Melbourne":"约 A$55,000–60,000 / 学年",
  "University of New South Wales":"约 A$54,000–59,000 / 学年"
};
const RENTAL_NOTE = "通常需护照/身份证明、录取或在读证明、押金与首月房租；没有当地信用记录时，可能需要担保人或预付数月房租。";
const costFor = (school:string):CostProfile => {
  if (HONG_KONG_SCHOOLS.has(school)) return {tuition:ME_TUITION[school]||"机械硕士学费待官网确认",shared:"约 HK$5,500–10,000/月",privateRoom:"约 HK$12,000–25,000/月",note:RENTAL_NOTE};
  if (CANADIAN_SCHOOLS.has(school)) return {tuition:ME_TUITION[school]||"机械硕士学费待官网确认",shared:"约 C$900–1,800/月",privateRoom:"约 C$1,500–3,000/月",note:RENTAL_NOTE};
  if (BRITISH_SCHOOLS.has(school)) return {tuition:ME_TUITION[school]||"机械硕士学费待官网确认",shared:"约 £650–1,300/月",privateRoom:"约 £950–2,000/月",note:RENTAL_NOTE};
  if (AUSTRALIAN_SCHOOLS.has(school)) return {tuition:ME_TUITION[school]||"机械硕士学费待官网确认",shared:"约 A$900–1,700/月",privateRoom:"约 A$1,500–2,800/月",note:RENTAL_NOTE};
  return {
    tuition:ME_TUITION[school]||"机械硕士学费待官网确认",
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
  { id:"mit-me", school:"Massachusetts Institute of Technology", rank:2, program:"Mechanical Engineering", degree:"SM", field:"机械工程", deadline:"2026-12-15", letters:"至少3封", cv:"需要", sop:"Statement of Objectives", gre:"不要求（2N/2N6 除外）", credits:"研究型培养", duration:"约2年", verified:"已核实", source:"https://meche.mit.edu/education/prospective-students/graduate/apply", tracks:[
    {name:"Mechanics",courses:["Advanced Mechanics of Solids","Continuum Mechanics","Finite Element Analysis"]},
    {name:"Robotics & Control",courses:["Underactuated Robotics","Feedback Control","Robotic Manipulation"]},
    {name:"Energy",courses:["Thermal Science","Energy Conversion","Fluid Dynamics"]}]},
  { id:"umich-me", school:"University of Michigan–Ann Arbor", rank:21, program:"Mechanical Engineering", degree:"MSE", field:"机械工程", deadline:"待公布", letters:"2封", cv:"需要", sop:"需要＋PS", gre:"可选", credits:"30 credits", duration:"10个月–2年", verified:"已核实", source:"https://me.engin.umich.edu/admissions/graduate/application-requirements/", tracks:[
    {name:"Robotics & Mechatronics",courses:["Math for Robotics","Linear Systems Theory","Mechatronic Systems Design"]},
    {name:"Automotive",courses:["Vehicle Dynamics","Automotive Engineering","Powertrain Systems"]},
    {name:"Design & Manufacturing",courses:["Design Optimization","Advanced Manufacturing","Product Design"]}]},
  { id:"cmu-me", school:"Carnegie Mellon University", rank:21, program:"Mechanical Engineering", degree:"MS", field:"机械工程", deadline:"2027-01-05", letters:"3封", cv:"需要", sop:"MS 项目不要求 SOP", gre:"不接受", credits:"待复核", duration:"3–4学期", verified:"已核实", source:"https://www.meche.engineering.cmu.edu/education/graduate-programs/admission/index.html", tracks:[
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
  id, school, rank, program, degree, field, source, tracks, verified:"已核实", deadline:"待公布",
  programUrl:source, regionalOrder:rank, regionalOrderLabel:"分区参考序号", letters:"待复核", cv:"需要", sop:"需要", gre:"待复核", credits:"待复核", duration:"1–2年"
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

const EXPANDED_PROGRAMS: Program[] = [
  {...relatedProgram("cityu-me","City University of Hong Kong",4,"Mechanical Engineering","MSc","机械工程","https://www.cityu.edu.hk/mae/academic-programmes/postgraduate-programmes",[{name:"Advanced Mechanical Systems",courses:["Advanced Mechanics","Control Systems","Engineering Design"]},{name:"Energy & Manufacturing",courses:["Energy Systems","Advanced Manufacturing","Materials Engineering"]}]),region:"香港"},
  {...relatedProgram("polyu-me","Hong Kong Polytechnic University",5,"Mechanical Engineering","MSc","机械工程","https://www.polyu.edu.hk/me/study/taught-postgraduate-programmes/",[{name:"Product Development",courses:["Product Design","Computer Aided Engineering","Advanced Manufacturing"]},{name:"Energy & Transport",courses:["Thermofluids","Energy Systems","Vehicle Engineering"]}]),region:"香港"},
  {...relatedProgram("hkbu-none","Hong Kong Baptist University",6,"暂无匹配的机械工程硕士","N/A","暂无匹配项目","https://gs.hkbu.edu.hk/",[]),region:"香港",verified:"待复核"},
  {...relatedProgram("lingnan-none","Lingnan University",7,"暂无匹配的机械工程硕士","N/A","暂无匹配项目","https://www.ln.edu.hk/sgs/",[]),region:"香港",verified:"待复核"},
  {...relatedProgram("eduhk-none","Education University of Hong Kong",8,"暂无匹配的机械工程硕士","N/A","暂无匹配项目","https://www.eduhk.hk/gradsch/",[]),region:"香港",verified:"待复核"},
  {...relatedProgram("waterloo-meng","University of Waterloo",4,"Mechanical and Mechatronics Engineering","MEng","机械/机电","https://uwaterloo.ca/future-graduate-students/programs/by-faculty/engineering/mechanical-and-mechatronics-engineering-master-engineering",[{name:"Building Systems",courses:["Building Systems Engineering"]},{name:"Materials and Advanced Manufacturing",courses:["Advanced Manufacturing","Engineering Materials"]},{name:"Mechatronic Systems",courses:["Mechatronic Systems","Robotics","Control Systems"]},{name:"Sustainable Energy",courses:["Sustainable Energy","Thermofluids"]}]),region:"加拿大",deadline:"2027-02-01",letters:"2封学术推荐信",cv:"需要",sop:"项目专项问题（PSQ）",duration:"全日制16个月"},

  {...relatedProgram("imperial-ame","Imperial College London",2,"Advanced Mechanical Engineering","MSc","机械工程","https://www.imperial.ac.uk/study/courses/postgraduate-taught/advanced-mechanical-engineering/",[{name:"Design & Manufacturing",courses:["Design Engineering","Advanced Manufacturing","Finite Element Analysis"]},{name:"Thermofluids",courses:["Advanced Fluid Mechanics","Heat Transfer","Energy Systems"]}]),region:"英国"},
  {...relatedProgram("oxford-none","University of Oxford",4,"暂无匹配的授课型机械工程硕士","N/A","暂无匹配项目","https://eng.ox.ac.uk/study/graduate",[]),region:"英国",verified:"待复核"},
  {...relatedProgram("cambridge-mphil","University of Cambridge",6,"Engineering","MPhil","机械与工程","https://www.postgraduate.study.cam.ac.uk/courses/directory/egegmpmeg",[{name:"Energy, Fluid Mechanics and Turbomachinery",courses:["Fluid Mechanics","Turbomachinery","Energy Technologies"]},{name:"Mechanics, Materials and Design",courses:["Solid Mechanics","Materials","Engineering Design"]}]),region:"英国"},
  {...relatedProgram("ucl-me","University College London",8,"Mechanical Engineering","MSc","机械工程","https://www.ucl.ac.uk/prospective-students/graduate/taught-degrees/mechanical-engineering-msc",[{name:"Mechanical Systems",courses:["Advanced Mechanical Engineering","Vibrations","Control"]},{name:"Energy & Fluids",courses:["Thermofluids","Energy Systems","Heat Transfer"]}]),region:"英国"},
  {...relatedProgram("edinburgh-me","University of Edinburgh",35,"Mechanical Engineering related programmes","MSc","机械/能源","https://study.ed.ac.uk/programmes/postgraduate-taught/963-advanced-power-engineering",[{name:"Advanced Power Engineering",courses:["Power Plant Technologies","Energy Systems","Thermal Engineering"]}]),region:"英国"},
  {...relatedProgram("kcl-none","King's College London",37,"暂无匹配的机械工程硕士","N/A","暂无匹配项目","https://www.kcl.ac.uk/study/postgraduate-taught",[]),region:"英国",verified:"待复核"},
  {...relatedProgram("manchester-me","University of Manchester",40,"Advanced Mechanical Engineering","MSc","机械工程","https://www.manchester.ac.uk/study/masters/courses/list/08320/msc-advanced-mechanical-engineering/",[{name:"Design & Reliability",courses:["Engineering Design","Structural Integrity","Finite Element Analysis"]},{name:"Thermofluids",courses:["Computational Fluid Dynamics","Heat Transfer","Energy Systems"]}]),region:"英国"},
  {...relatedProgram("lse-none","London School of Economics and Political Science",56,"暂无匹配的机械工程硕士","N/A","暂无匹配项目","https://www.lse.ac.uk/study-at-lse/Graduate",[]),region:"英国",verified:"待复核"},
  {...relatedProgram("bristol-me","University of Bristol",57,"Mechanical Engineering","MSc","机械工程","https://www.bristol.ac.uk/study/postgraduate/taught/msc-engineering-with-management/",[{name:"Engineering Systems",courses:["Systems Engineering","Engineering Design","Project Management"]}]),region:"英国"},
  {...relatedProgram("warwick-me","University of Warwick",68,"Advanced Mechanical Engineering","MSc","机械工程","https://warwick.ac.uk/study/postgraduate/courses/msc-advanced-mechanical-engineering/",[{name:"Advanced Mechanical Systems",courses:["Advanced Robotics","CAE","Dynamic Analysis"]},{name:"Manufacturing",courses:["Advanced Manufacturing","Materials","Design"]}]),region:"英国"},
  {...relatedProgram("birmingham-me","University of Birmingham",76,"Advanced Mechanical Engineering","MSc","机械工程","https://www.birmingham.ac.uk/postgraduate/courses/taught/mechanical-engineering/advanced-mechanical-engineering-msc",[{name:"Mechanical Design",courses:["Engineering Design","Finite Element Analysis","Advanced Mechanics"]},{name:"Energy",courses:["Thermofluids","Energy Systems","Heat Transfer"]}]),region:"英国"},
  {...relatedProgram("glasgow-me","University of Glasgow",79,"Mechanical Engineering","MSc","机械工程","https://www.gla.ac.uk/postgraduate/taught/mechanicalengineering/",[{name:"Design & Dynamics",courses:["Dynamics","Control","Engineering Design"]},{name:"Energy & Fluids",courses:["Fluid Mechanics","Heat Transfer","Energy Conversion"]}]),region:"英国"},
  {...relatedProgram("sheffield-me","University of Sheffield",82,"Advanced Mechanical Engineering","MSc","机械工程","https://www.sheffield.ac.uk/postgraduate/taught/courses/2026/advanced-mechanical-engineering-msceng",[{name:"Advanced Manufacturing",courses:["Manufacturing Technology","Composite Materials","Engineering Design"]},{name:"Thermofluids",courses:["Computational Fluid Dynamics","Heat Transfer","Energy"]}]),region:"英国"},
  {...relatedProgram("leeds-me","University of Leeds",86,"Advanced Mechanical Engineering","MSc","机械工程","https://courses.leeds.ac.uk/i546/advanced-mechanical-engineering-msc-eng-",[{name:"Design & Manufacturing",courses:["Engineering Design","Manufacturing","Computational Mechanics"]},{name:"Energy",courses:["Thermofluids","Energy Systems","Heat Transfer"]}]),region:"英国"},
  {...relatedProgram("durham-me","Durham University",94,"Advanced Mechanical Engineering","MSc","机械工程","https://www.durham.ac.uk/study/courses/advanced-mechanical-engineering-msc-h3k209/",[{name:"Advanced Engineering",courses:["Advanced Mechanics","Thermofluids","Engineering Design"]}]),region:"英国"},
  {...relatedProgram("nottingham-me","University of Nottingham",97,"Mechanical Engineering","MSc","机械工程","https://www.nottingham.ac.uk/pgstudy/course/taught/mechanical-engineering-msc",[{name:"Manufacturing & Materials",courses:["Advanced Manufacturing","Materials","Design"]},{name:"Thermofluids",courses:["Fluid Mechanics","Heat Transfer","Energy"]}]),region:"英国"},

  {...relatedProgram("unsw-me","University of New South Wales",19,"Engineering Science (Mechanical Engineering)","MEngSc","机械工程","https://www.unsw.edu.au/study/postgraduate/master-of-engineering-science-mechanical-engineering",[{name:"Mechanical Systems",courses:["Advanced Mechanics","Mechanical Design","Control"]},{name:"Energy & Manufacturing",courses:["Energy Systems","Manufacturing","Thermofluids"]}]),region:"澳大利亚"},
  {...relatedProgram("melbourne-me","University of Melbourne",22,"Mechanical Engineering","MEng","机械工程","https://study.unimelb.edu.au/find/courses/graduate/master-of-mechanical-engineering/",[{name:"Mechanical Systems",courses:["Mechanical Systems Design","Dynamics","Control"]},{name:"Energy",courses:["Thermofluids","Energy Systems","Heat Transfer"]}]),region:"澳大利亚"},
  {...relatedProgram("sydney-me","University of Sydney",28,"Professional Engineering (Mechanical)","MPE","机械工程","https://www.sydney.edu.au/courses/courses/pc/master-of-professional-engineering-mechanical.html",[{name:"Mechanical Engineering",courses:["Advanced Mechanics","Mechanical Design","Engineering Management"]},{name:"Thermofluids",courses:["Fluid Mechanics","Heat Transfer","Energy"]}]),region:"澳大利亚"},
  {...relatedProgram("anu-me","Australian National University",29,"Mechatronics","MEng","机电/系统","https://programsandcourses.anu.edu.au/program/MENGI",[{name:"Mechatronics",courses:["Mechatronic Systems","Control","Robotics"]}]),region:"澳大利亚"},
  {...relatedProgram("monash-me","Monash University",31,"Professional Engineering (Mechanical)","MPE","机械工程","https://www.monash.edu/study/courses/find-a-course/professional-engineering-e6011",[{name:"Mechanical Engineering",courses:["Advanced Mechanics","Design","Manufacturing"]},{name:"Energy",courses:["Thermofluids","Sustainable Energy","Heat Transfer"]}]),region:"澳大利亚"},
  {...relatedProgram("uq-me","University of Queensland",40,"Engineering Science (Mechanical)","MEngSc","机械工程","https://study.uq.edu.au/study-options/programs/master-engineering-science-5528",[{name:"Mechanical Engineering",courses:["Advanced Engineering Analysis","Mechanical Design","Control"]},{name:"Energy",courses:["Thermofluids","Energy Systems","Sustainability"]}]),region:"澳大利亚"},
  {...relatedProgram("uwa-me","University of Western Australia",77,"Professional Engineering (Mechanical)","MPE","机械工程","https://www.uwa.edu.au/study/courses/master-of-professional-engineering",[{name:"Mechanical Engineering",courses:["Mechanical Design","Dynamics","Thermofluids"]}]),region:"澳大利亚"},
  {...relatedProgram("adelaide-me","Adelaide University",82,"Mechanical Engineering","MEng","机械工程","https://adelaideuni.edu.au/study/degrees/master-of-engineering-mechanical/",[{name:"Mechanical Systems",courses:["Advanced Mechanics","Engineering Design","Control"]},{name:"Energy & Manufacturing",courses:["Thermofluids","Manufacturing","Materials"]}]),region:"澳大利亚"}
];

const OFFICIAL_LINKS:Record<string,Pick<Program,"departmentUrl"|"programUrl"|"applicationUrl">>={
  "uci-me":{departmentUrl:"https://engineering.uci.edu/dept/mae",programUrl:"https://engineering.uci.edu/dept/mae/academics/graduate",applicationUrl:"https://apply.grad.uci.edu/apply/"},
  "ucsd-mae":{departmentUrl:"https://mae.ucsd.edu/",programUrl:"https://mae.ucsd.edu/graduate",applicationUrl:"https://connect.grad.ucsd.edu/apply/"},
  "ucd-me":{departmentUrl:"https://mae.ucdavis.edu/",programUrl:"https://mae.ucdavis.edu/graduate",applicationUrl:"https://grad.ucdavis.edu/apply"},
  "usc-me":{departmentUrl:"https://ame.usc.edu/",programUrl:"https://ame.usc.edu/academics/graduate-programs/",applicationUrl:"https://gradadm.usc.edu/apply/"},
  "uiuc-me":{departmentUrl:"https://mechse.illinois.edu/",programUrl:"https://mechse.illinois.edu/graduate/graduate-degree-programs/master-engineering-mechanical-engineering",applicationUrl:"https://grad.illinois.edu/admissions/apply"},
  "wisc-me":{departmentUrl:"https://engineering.wisc.edu/departments/mechanical-engineering/",programUrl:"https://guide.wisc.edu/graduate/mechanical-engineering/mechanical-engineering-ms/",applicationUrl:"https://grad.wisc.edu/apply/"},
  "osu-me":{departmentUrl:"https://mae.osu.edu/",programUrl:"https://mae.osu.edu/graduate",applicationUrl:"https://gpadmissions.osu.edu/apply/online-application.html"},
  "purdue-me":{departmentUrl:"https://engineering.purdue.edu/ME",programUrl:"https://engineering.purdue.edu/ME/Graduate",applicationUrl:"https://gradschool.purdue.edu/admissions/how-to-apply/"},
  "neu-me":{departmentUrl:"https://mie.northeastern.edu/",programUrl:"https://graduate.northeastern.edu/programs/ms-mechanical-engineering/master-of-science-in-mechanical-engineering/",applicationUrl:"https://graduate.northeastern.edu/apply/"},
  "bu-me":{departmentUrl:"https://www.bu.edu/eng/academics/departments-and-divisions/mechanical-engineering/",programUrl:"https://www.bu.edu/eng/academics/explore-degree-programs/ms-in-mechanical-engineering/",applicationUrl:"https://www.bu.edu/grad/admission/how-to-apply/"},
  "uw-me":{departmentUrl:"https://www.me.washington.edu/",programUrl:"https://www.me.washington.edu/students/grad",applicationUrl:"https://grad.uw.edu/admission/application/"},
  "umd-me":{departmentUrl:"https://me.umd.edu/",programUrl:"https://mage.umd.edu/mechanical",applicationUrl:"https://gradschool.umd.edu/admissions/application-process"},
  "rutgers-me":{departmentUrl:"https://mae.rutgers.edu/",programUrl:"https://mae.rutgers.edu/graduate-program",applicationUrl:"https://grad.rutgers.edu/admissions/how-to-apply"},
  "rochester-me":{departmentUrl:"https://www.hajim.rochester.edu/me/",programUrl:"https://www.hajim.rochester.edu/me/graduate/",applicationUrl:"https://gradapply.rochester.edu/apply/"},
  "cornell-me":{departmentUrl:"https://www.mae.cornell.edu/mae",programUrl:"https://www.mae.cornell.edu/mae/programs/graduate-programs/master-engineering-program",applicationUrl:"https://gradschool.cornell.edu/admissions/apply/"},
  "columbia-me":{departmentUrl:"https://www.me.columbia.edu/",programUrl:"https://www.me.columbia.edu/ms-program",applicationUrl:"https://apply.engineering.columbia.edu/apply/"},
  "jhu-me":{departmentUrl:"https://me.jhu.edu/",programUrl:"https://me.jhu.edu/graduate/masters-program/",applicationUrl:"https://engineering.jhu.edu/graduate-admissions/"},
  "duke-me":{departmentUrl:"https://mems.duke.edu/",programUrl:"https://mems.duke.edu/academics/masters/",applicationUrl:"https://gradschool.duke.edu/admissions/application-instructions/"},
  "cmu-me":{departmentUrl:"https://www.meche.engineering.cmu.edu/",programUrl:"https://www.meche.engineering.cmu.edu/education/graduate-programs/admission/index.html",applicationUrl:"https://www.cmu.edu/graduate/admissions/index.html"}
};
const ALL_PROGRAMS = [...PROGRAMS, ...EXTRA_PROGRAMS, ...REGIONAL_PROGRAMS, ...EXPANDED_PROGRAMS].map(program=>({...program,regionalOrder:program.regionalOrder??program.rank,regionalOrderLabel:program.regionalOrderLabel||"分区参考序号",...OFFICIAL_LINKS[program.id]})).sort((a,b)=>(a.rankValue??a.regionalOrder??999)-(b.rankValue??b.regionalOrder??999)||a.school.localeCompare(b.school));
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

const CALENDAR_TAGS=["prepare-materials","contact-recommender","submit-application","verify-website","exam","payment"] as const;
const CALENDAR_TAG_LABELS={zh:{"prepare-materials":"准备材料","contact-recommender":"联系推荐人","submit-application":"提交申请","verify-website":"核对官网",exam:"考试安排",payment:"缴费"},en:{"prepare-materials":"Prepare materials","contact-recommender":"Contact recommender","submit-application":"Submit application","verify-website":"Verify website",exam:"Exam",payment:"Payment"}} as const;
const LEGACY_CALENDAR_TAGS:Record<string,string>={"准备材料":"prepare-materials","联系推荐人":"contact-recommender","提交申请":"submit-application","核对官网":"verify-website","考试安排":"exam","缴费":"payment"};
const getLocalDateKey=()=>{const now=new Date();return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`};
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
  "University of British Columbia":"Vancouver, British Columbia", "McGill University":"Montreal, Quebec", "University of Waterloo":"Waterloo, Ontario",
  "Imperial College London":"London, England", "University of Oxford":"Oxford, England", "University of Cambridge":"Cambridge, England", "University College London":"London, England", "University of Edinburgh":"Edinburgh, Scotland", "King's College London":"London, England", "University of Manchester":"Manchester, England", "University of Bristol":"Bristol, England", "London School of Economics and Political Science":"London, England", "University of Warwick":"Coventry, England", "University of Birmingham":"Birmingham, England", "University of Glasgow":"Glasgow, Scotland", "University of Leeds":"Leeds, England", "University of Sheffield":"Sheffield, England", "Durham University":"Durham, England", "University of Nottingham":"Nottingham, England",
  "Adelaide University":"Adelaide, South Australia", "Australian National University":"Canberra, ACT", "University of Melbourne":"Melbourne, Victoria", "Monash University":"Melbourne, Victoria", "University of New South Wales":"Sydney, New South Wales", "University of Queensland":"Brisbane, Queensland", "University of Sydney":"Sydney, New South Wales", "University of Western Australia":"Perth, Western Australia"
};
const APP_FEE_BY_REGION: Record<string,string> = {美国:"US$75–150",香港:"HK$300–600",加拿大:"C$125–170",英国:"£0–100",澳大利亚:"A$0–150"};
const deadlineInfo = (deadline:string) => {
  if (deadline === "待公布") return {label:"待公布",days:null,tone:"unknown"};
  const days = Math.ceil((new Date(`${deadline}T23:59:59`).getTime()-Date.now())/86400000);
  if (days < 0) return {label:"Closed",days,tone:"expired"};
  return {label:`${days} Days Left`,days,tone:days>60?"safe":days>=30?"watch":days>=15?"soon":"urgent"};
};
const programLocation = (program:Program) => LOCATION_BY_SCHOOL[program.school] || (program.region==="香港"?"Hong Kong":program.region==="加拿大"?"Canada":program.region==="英国"?"United Kingdom":program.region==="澳大利亚"?"Australia":"United States");
const programRegion = (program:Program) => program.region || "美国";
const programVerification = (program:Program):Program["verified"] => overallVerification(program)==="verified" ? "已核实" : "待复核";
const needsFieldReview=(value:string)=>/待公布|待复核|待官网确认|Not Available/i.test(value);
const rankingMeta=(program:Program)=>{const complete=Boolean(program.rankValue!==undefined&&program.rankSource&&program.rankYear&&program.rankType);return {value:complete?program.rankValue:program.regionalOrder??program.rank,isVerifiedRanking:complete,source:complete?program.rankSource:undefined,year:complete?program.rankYear:undefined,type:complete?program.rankType:undefined,url:complete?program.rankUrl:undefined,label:complete?program.rankType:program.regionalOrderLabel||"分区参考序号"};};

const TRANSLATIONS={
  zh:{verified:"已核实",pending:"待复核",programs:"项目库",saved:"收藏分类",mine:"我的",dataManagement:"数据管理",dataHelp:"备份、恢复或清空当前浏览器中的个人申请数据。",exportBackup:"导出备份",importBackup:"导入备份",clearData:"清空所有个人数据",clearWarning:"此操作无法撤销，建议先导出备份。",rankingNote:"不同国家和地区可能使用不同排名体系。排名仅作为选校参考，不等同于机械工程专业排名、录取难度或就业结果。",fieldPending:"该字段仍需以官网更新为准",department:"院系官网",programWebsite:"项目官网",applicationPortal:"申请入口",schoolIntro:"学校与机械硕士简介",costTitle:"机械硕士费用参考",coursesTitle:"官网方向与课程整理",privateNotes:"私人笔记",viewCourse:"查看介绍",schoolComparison:"学校对比",applicationFee:"申请费",tuition:"机械硕士项目学费",livingCost:"生活费 / 合租",insurance:"保险",privateRoom:"独居预算",totalCost:"预计总成本",regionalOrder:"分区参考序号",rankingPending:"排名来源待补充",program:"院系",degree:"学位",location:"位置",overallRanking:"综合大学排名",viewRankingSource:"查看排名来源",programStatus:"项目状态",meRanking:"机械工程专业排名",noMeRanking:"暂无统一可靠数据",officialLinksNote:"仅显示已经确认的官方入口。",interfaceSettings:"界面设置",languageLabel:"语言",appearance:"外观",light:"浅色",dark:"深色",system:"跟随系统",expired:"已过期",toDo:"待处理",noReminders:"还没有日历备注",noRemindersHelp:"在“我的”日历中点击日期添加备注。",close:"关闭",reminder:"提醒",calendarPlaceholder:"例如：完成康奈尔 SOP 初稿",deleteNote:"删除备注",saveReminder:"保存提醒",schoolOverview:"学校简介",programHighlights:"项目特点",bestFit:"适合人群",heroAlt:"校园代表性建筑",addTarget:"添加到我的目标",removeTarget:"从目标中移除",setCategory:"设置分类"},
  en:{verified:"Verified",pending:"Needs review",programs:"Programs",saved:"Saved",mine:"My Workspace",dataManagement:"Data Management",dataHelp:"Back up, restore, or clear personal application data stored in this browser.",exportBackup:"Export Backup",importBackup:"Import Backup",clearData:"Clear Personal Data",clearWarning:"This cannot be undone. Export a backup first.",rankingNote:"Countries and regions may use different ranking systems. Rankings are only a school-selection reference and do not represent mechanical engineering strength, admission difficulty, or employment outcomes.",fieldPending:"Verify this field against the latest official update",department:"Department Website",programWebsite:"Program Website",applicationPortal:"Application Portal",schoolIntro:"School & Mechanical Master's Overview",costTitle:"Mechanical Master's Cost Guide",coursesTitle:"Official Directions & Courses",privateNotes:"Private Notes",viewCourse:"View details",schoolComparison:"School Comparison",applicationFee:"Application fee",tuition:"Mechanical master's tuition",livingCost:"Living cost / shared",insurance:"Insurance",privateRoom:"Private room budget",totalCost:"Estimated total cost",regionalOrder:"Regional reference order",rankingPending:"Ranking source pending",program:"Program",degree:"Degree",location:"Location",overallRanking:"Overall university ranking",viewRankingSource:"View ranking source",programStatus:"Program status",meRanking:"Mechanical engineering ranking",noMeRanking:"No consistent reliable dataset",officialLinksNote:"Only verified official links are shown.",interfaceSettings:"Interface Settings",languageLabel:"Language",appearance:"Appearance",light:"Light",dark:"Dark",system:"System",expired:"Expired",toDo:"To do",noReminders:"No calendar notes yet",noRemindersHelp:"Open My Workspace and select a date to add a note.",close:"Close",reminder:"Reminder",calendarPlaceholder:"Example: finish the first Cornell SOP draft",deleteNote:"Delete note",saveReminder:"Save reminder",schoolOverview:"University setting",programHighlights:"Program character",bestFit:"Who it suits",heroAlt:"signature campus setting",addTarget:"Add to my targets",removeTarget:"Remove from targets",setCategory:"Set category"}
} as const;
type Overview={zh:{school:string;program:string;fit:string};en:{school:string;program:string;fit:string}};
const SCHOOL_OVERVIEWS:Record<string,Overview>={
  "uci-me":{zh:{school:"位于橙县尔湾，校园以开阔的环形布局和安静的学习环境著称；Samueli 工程学院强调跨学科研究与南加州产业连接。",program:"机械与航空航天工程研究生培养覆盖机器人与控制、热流体、能源、设计及先进制造，适合把课程与实验室方向结合规划。",fit:"适合希望进入南加州科技与工程行业，或用硕士阶段为机器人、控制、能源和后续研究打基础的申请者。"},en:{school:"Located in Irvine, Orange County, UCI combines a spacious campus with the Samueli School's interdisciplinary engineering culture and Southern California industry links.",program:"Graduate study in mechanical and aerospace engineering spans robotics and control, thermal-fluid sciences, energy, design, and advanced manufacturing.",fit:"A strong fit for students targeting Southern California engineering roles or building a foundation for robotics, controls, energy, and further research."}},
  "ucsd-mae":{zh:{school:"位于拉霍亚海岸，Jacobs 工程学院研究密度高，校园以 Geisel Library 和临海科研环境形成鲜明辨识度。",program:"项目在控制、机器人、流体、热科学、固体力学与材料方向均有深度，研究导向明显，也能组合高阶课程形成职业路径。",fit:"适合重视科研资源、计算与实验能力，并考虑机器人、航空航天、能源或继续申博的申请者。"},en:{school:"UC San Diego sits in coastal La Jolla, where the Jacobs School offers a research-intensive engineering environment around the landmark Geisel Library.",program:"The program has depth in controls, robotics, fluids, thermal sciences, solid mechanics, and materials, with strong research and advanced-course pathways.",fit:"Best for students seeking intensive computational or experimental preparation for robotics, aerospace, energy, or doctoral study."}},
  "ucd-me":{zh:{school:"位于大学城 Davis，校园骑行友好、节奏稳定，工程研究与农业、能源、交通和可持续技术联系紧密。",program:"机械与航空航天工程覆盖设计制造、动力与热流、控制、材料和生物力学，可在研究训练与系统工程实践之间选择侧重。",fit:"适合希望在可持续能源、交通、制造或跨学科工程中建立扎实研究能力的学生。"},en:{school:"UC Davis offers a bike-friendly college-town campus with engineering ties to energy, transportation, agriculture, and sustainability.",program:"Mechanical and aerospace study covers design and manufacturing, power and thermal systems, controls, materials, and biomechanics.",fit:"Well suited to students pursuing sustainable energy, mobility, manufacturing, or interdisciplinary research."}},
  "usc-me":{zh:{school:"位于洛杉矶，Viterbi 工程学院与航空航天、汽车、娱乐科技和创业生态距离近，城市型校园提供丰富行业接触。",program:"机械工程硕士偏职业与课程组合，可围绕动力系统、机器人控制、设计制造、热流和计算工程搭建方向。",fit:"适合希望利用洛杉矶产业网络就业、转向机器人或航空航天，且偏好灵活课程规划的申请者。"},en:{school:"USC's Los Angeles location connects the Viterbi School with aerospace, mobility, entertainment technology, and entrepreneurship.",program:"The mechanical master's is professionally oriented and flexible across dynamics, robotics and controls, design, manufacturing, thermal-fluid, and computational work.",fit:"A fit for students leveraging Los Angeles industry networks, transitioning into robotics or aerospace, or seeking a flexible course plan."}},
  "uiuc-me":{zh:{school:"香槟—厄巴纳是典型大学城，Grainger 工程学院拥有规模完整的实验设施与强工程文化，机械学科基础扎实。",program:"MechSE 在力学、热流、控制、设计制造、材料与计算方向课程密集，MEng 更偏职业实践，MS 更适合研究准备。",fit:"适合追求系统性技术训练、强课程深度，并希望在制造、能源、汽车、控制或申博之间保留选择的学生。"},en:{school:"In the Urbana-Champaign college-town setting, Grainger Engineering combines extensive facilities with a deeply established engineering culture.",program:"MechSE offers dense coverage of mechanics, thermal-fluid science, controls, design, manufacturing, materials, and computation; MEng is more professional while MS better supports research preparation.",fit:"Ideal for students seeking rigorous breadth with options across manufacturing, energy, mobility, controls, and doctoral study."}},
  "wisc-me":{zh:{school:"位于麦迪逊湖区，工程校园兼具大型研究大学资源与紧密社区氛围，能源、制造和系统工程传统突出。",program:"课程与研究覆盖热科学、流体、控制、机械设计、材料和先进制造，可按研究型或专业型目标组合。",fit:"适合希望强化热流、能源系统、制造或设计能力，并重视大学城生活体验的申请者。"},en:{school:"UW–Madison pairs a lakeside campus with a close engineering community and strong traditions in energy, manufacturing, and systems work.",program:"Study spans thermal sciences, fluids, controls, mechanical design, materials, and advanced manufacturing with research and professional pathways.",fit:"A good match for applicants focused on thermal-fluid systems, energy, manufacturing, or design in a classic college-city setting."}},
  "osu-me":{zh:{school:"位于哥伦布，规模化校园与州府产业环境连接紧密，在汽车、先进制造、航空航天和健康工程方面资源丰富。",program:"机械与航空航天工程可覆盖控制、机器人、制造、热流、材料和生物力学，强调工程分析与实验应用。",fit:"适合希望进入汽车、制造、航空航天或医疗工程，并看重大型校友与企业网络的学生。"},en:{school:"Ohio State's Columbus campus connects a large engineering community with automotive, advanced manufacturing, aerospace, and health-technology activity.",program:"Mechanical and aerospace study covers controls, robotics, manufacturing, thermal-fluid systems, materials, and biomechanics with analytical and experimental emphasis.",fit:"Suited to students targeting automotive, manufacturing, aerospace, or medical engineering through a broad alumni and employer network."}},
  "purdue-me":{zh:{school:"西拉法叶校园拥有鲜明工程传统和大型实验设施，航空航天、动力、制造与系统设计在校内产业合作中辨识度高。",program:"机械工程研究生课程深度覆盖热流、推进、控制、机器人、设计、制造和材料，研究型与职业型路线都较清晰。",fit:"适合愿意接受高强度工程训练，并以航空航天、能源、制造、控制或博士研究为目标的申请者。"},en:{school:"Purdue's West Lafayette campus is defined by a strong engineering tradition and major facilities in aerospace, power, manufacturing, and systems design.",program:"Graduate mechanical engineering offers substantial depth in thermal-fluid science, propulsion, controls, robotics, design, manufacturing, and materials.",fit:"Best for applicants seeking intensive technical preparation for aerospace, energy, manufacturing, controls, or doctoral research."}},
  "neu-me":{zh:{school:"位于波士顿市区，合作教育和企业项目是核心特色，工程学习与本地机器人、医疗、咨询和科技岗位联系直接。",program:"机械硕士偏职业与实践，可组合机电、控制、机器人、热流、材料和制造课程，并通过项目或实习强化经历。",fit:"适合把就业和实习放在优先位置，尤其希望转向机器人、自动化、产品开发或城市型科技行业的学生。"},en:{school:"In central Boston, Northeastern is distinguished by co-op education and direct access to robotics, healthcare, consulting, and technology employers.",program:"The professionally oriented master's combines mechatronics, controls, robotics, thermal-fluid systems, materials, and manufacturing with projects or work experience.",fit:"Particularly suitable for employment-focused students moving into robotics, automation, product development, or urban technology industries."}},
  "bu-me":{zh:{school:"沿查尔斯河分布的城市校园与波士顿科研和医疗生态相连，工程学院强调跨学科和工程创新。",program:"机械工程培养可连接机器人、控制、材料、热流、制造和生物工程，课程型学习与研究项目均可形成组合。",fit:"适合希望在波士顿寻找科技或医疗工程机会，并偏好跨学科、小而集中的项目体验的学生。"},en:{school:"Boston University's Charles River campus connects engineering with the city's research, healthcare, and innovation ecosystem.",program:"Mechanical study can combine robotics, controls, materials, thermal-fluid science, manufacturing, and biomedical applications through courses and projects.",fit:"A fit for students seeking Boston technology or medical-engineering opportunities in a focused interdisciplinary setting."}},
  "uw-me":{zh:{school:"西雅图校园临近湖区和科技产业走廊，机械工程与航空航天、机器人、清洁能源和大型科技企业联系紧密。",program:"项目覆盖控制与机电、流体与能源、设计制造、材料和生物力学，研究资源与区域产业项目并重。",fit:"适合希望进入西雅图科技、航空航天、机器人或清洁能源行业，也考虑研究发展的学生。"},en:{school:"UW's Seattle campus sits beside a major technology and aerospace corridor, with strong connections to robotics, clean energy, and regional employers.",program:"The curriculum spans controls and mechatronics, fluids and energy, design and manufacturing, materials, and biomechanics, balancing research with industry projects.",fit:"Ideal for applicants targeting Seattle technology, aerospace, robotics, or clean-energy careers while keeping research options open."}},
  "umd-me":{zh:{school:"College Park 校园靠近华盛顿特区，联邦实验室、航空航天、国防和公共科研机构构成独特区位优势。",program:"机械工程课程覆盖机器人控制、能源热流、设计制造、可靠性和材料，专业硕士路线强调工程应用。",fit:"适合关注航空航天、政府科研、能源系统、机器人或希望利用华盛顿地区资源就业的申请者。"},en:{school:"Maryland's College Park campus benefits from proximity to Washington, D.C., federal laboratories, aerospace, defense, and public research institutions.",program:"Mechanical study spans robotics and controls, energy and thermal-fluid systems, design, manufacturing, reliability, and materials, with applied professional options.",fit:"A strong fit for aerospace, government research, energy, robotics, or applicants seeking the Washington-region engineering market."}},
  "rutgers-me":{zh:{school:"新布朗斯维克校园处于纽约—新泽西产业带，交通、制药、制造和工程企业密集，校园兼具大学城与都会圈资源。",program:"机械与航空航天方向覆盖设计制造、热流、控制、材料和生物力学，适合通过课程和项目建立实用工程能力。",fit:"适合希望进入纽约都会区制造、产品、交通或医疗技术行业，并关注性价比与区位的学生。"},en:{school:"Rutgers–New Brunswick sits within the New York–New Jersey industrial corridor, close to transportation, pharmaceutical, manufacturing, and engineering employers.",program:"Mechanical and aerospace study covers design and manufacturing, thermal-fluid systems, controls, materials, and biomechanics through coursework and projects.",fit:"Well matched to students targeting manufacturing, product, mobility, or medical technology roles in the New York metro region."}},
  "rochester-me":{zh:{school:"罗切斯特校园规模较集中，工程与光学、成像、医疗和精密制造传统联系紧密，适合深度参与实验室或项目。",program:"机械工程可结合设计、固体力学、热流、控制、材料和计算，跨光学与生物医学的机会具有学校特色。",fit:"适合偏好小型研究环境，关注精密工程、光机系统、医疗器械或计划继续研究的学生。"},en:{school:"Rochester offers a focused campus environment with distinctive links among engineering, optics, imaging, healthcare, and precision manufacturing.",program:"Mechanical study combines design, solid mechanics, thermal-fluid science, controls, materials, and computation, with access to optical and biomedical work.",fit:"A good fit for students who value a smaller research setting and interests in precision systems, optomechanics, medical devices, or further study."}},
  "cornell-me":{zh:{school:"伊萨卡山谷校园拥有强烈的学院传统和完整工程研究生态，机械与航空航天在机器人、能源、设计和基础力学方面资源集中。",program:"MEng 明确偏职业与团队项目，强调快速形成可交付的工程能力；研究型路线则更适合论文和博士准备。",fit:"适合希望通过高强度课程与项目进入产品、机器人、能源或咨询行业，或选择研究路线继续申博的申请者。"},en:{school:"Cornell's Ithaca campus combines a distinctive college setting with a broad engineering research ecosystem in robotics, energy, design, and fundamental mechanics.",program:"The MEng is clearly professional and project-centered, while research routes better support thesis work and doctoral preparation.",fit:"Best for students seeking intensive coursework and team projects for product, robotics, energy, or consulting careers—or a research route toward a PhD."}},
  "columbia-me":{zh:{school:"位于纽约曼哈顿，紧凑的 Morningside 校园连接金融、科技、创业、医疗与城市基础设施资源。",program:"机械工程硕士可围绕机器人控制、能源、流体、设计制造、计算和生物力学组合，课程选择具有都会型跨学科特点。",fit:"适合希望利用纽约就业网络、转向机器人或计算工程，并能承担高城市生活成本的申请者。"},en:{school:"Columbia's compact Morningside campus provides direct access to New York finance, technology, entrepreneurship, healthcare, and urban infrastructure.",program:"The mechanical master's can combine robotics and controls, energy, fluids, design and manufacturing, computation, and biomechanics in an urban interdisciplinary setting.",fit:"A fit for applicants using New York career networks, shifting toward robotics or computational engineering, and prepared for high city living costs."}},
  "jhu-me":{zh:{school:"巴尔的摩 Homewood 校园靠近医学与公共卫生体系，机械工程与机器人、医疗器械、计算和材料研究交叉明显。",program:"硕士培养可覆盖机器人控制、固体与流体、设计、材料和生物机械，研究型选择尤其适合实验室参与。",fit:"适合希望进入医疗机器人、生物力学、计算工程或以研究经历支持博士申请的学生。"},en:{school:"Johns Hopkins' Homewood campus connects mechanical engineering with major medical and public-health research in Baltimore.",program:"Master's study spans robotics and controls, solids and fluids, design, materials, and biomechanics, with strong laboratory opportunities in research routes.",fit:"Especially suitable for medical robotics, biomechanics, computational engineering, or students building research experience for doctoral applications."}},
  "duke-me":{zh:{school:"杜伦校园兼具传统建筑与研究园区氛围，并处于 Research Triangle 技术与医疗产业集群。",program:"MEMS 培养连接机械设计、热流、控制、材料、航空航天和生物医学，硕士路线重视项目、团队和职业发展。",fit:"适合希望在研究三角区就业、进入医疗技术或产品创新，并重视跨学科与团队项目的申请者。"},en:{school:"Duke combines a distinctive Durham campus with access to the Research Triangle's technology and healthcare cluster.",program:"MEMS connects mechanical design, thermal-fluid science, controls, materials, aerospace, and biomedical applications, with strong project and career components.",fit:"A good fit for Research Triangle careers, medical technology, product innovation, and students who value interdisciplinary team projects."}},
  "cmu-me":{zh:{school:"匹兹堡城市校园以计算、机器人和工程交叉著称，机械工程与 Robotics Institute、制造和人工智能资源联系紧密。",program:"硕士课程强调计算建模、控制、机器人、设计制造和先进材料，可形成鲜明的数字工程与智能系统路径。",fit:"适合希望转机器人、强化控制与计算、进入自动化或智能制造，并能适应高强度项目节奏的学生。"},en:{school:"Carnegie Mellon's Pittsburgh campus is defined by the intersection of computing, robotics, and engineering, with close links to the Robotics Institute and advanced manufacturing.",program:"The master's emphasizes computational modeling, controls, robotics, design and manufacturing, and advanced materials, supporting digital-engineering and intelligent-systems pathways.",fit:"Ideal for students transitioning into robotics, strengthening controls and computation, or targeting automation and intelligent manufacturing in an intensive project culture."}}
};
const defaultOverview=(program:Program,language:"zh"|"en"):Overview["zh"]=>language==="en"?{school:`${program.school} is based in ${programLocation(program)} and offers a distinct engineering-campus environment.`,program:`The ${program.degree} curriculum currently recorded here includes ${program.tracks.map(t=>t.name).join(", ")||"mechanical engineering study"}.`,fit:"Best for applicants who compare curriculum fit, project format, career location, and research access before applying."}:{school:`${SCHOOL_NAMES[program.school]||program.school}位于 ${programLocation(program)}，校园与当地工程产业和研究环境紧密相连。`,program:`当前收录的 ${program.degree} 培养重点包括${program.tracks.map(t=>t.name).join("、")||"机械工程核心方向"}。`,fit:"适合根据课程匹配、项目形式、就业区位和科研机会综合选校的申请者。"};
const getOverview=(program:Program,language:"zh"|"en")=>SCHOOL_OVERVIEWS[program.id]?.[language]||defaultOverview(program,language);
const answerSchoolQuestion = (question:string,contextId?:string) => {
  const q=question.trim().toLowerCase();
  const explicitProgram=ALL_PROGRAMS.find(p=>q.includes(p.school.toLowerCase())||q.includes((SCHOOL_NAMES[p.school]||"").toLowerCase())||q.includes(p.id.split("-")[0]));
  const program=explicitProgram||(contextId?PROGRAM_BY_ID.get(contextId):undefined);
  if(!program){
    if(q.includes("机器人")||q.includes("robot")){const schools=ALL_PROGRAMS.filter(p=>p.tracks.some(t=>`${t.name}${t.courses.join("")}`.toLowerCase().includes("robot"))).slice(0,6);return {text:`机器人相关项目可以先看：${schools.map(p=>SCHOOL_NAMES[p.school]||p.school).join("、")}。你可以继续问我其中一所的截止日期、费用或课程。`};}
    if(q.includes("香港"))return {text:"香港区已收录港八；其中没有对应机械工程硕士的学校会明确标注“暂无匹配项目”。"};
    if(q.includes("加拿大"))return {text:"加拿大区已收录多伦多大学、英属哥伦比亚大学、麦吉尔大学和滑铁卢大学。"};
    if(q.includes("英国"))return {text:"英国区按 QS 2027 世界前 100 范围整理，并明确标注没有匹配机械工程硕士的学校。"};
    if(q.includes("澳洲")||q.includes("澳大利亚"))return {text:"澳大利亚区已收录当前 Group of Eight 的八所成员大学。"};
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

const kunify = (text:string) => text.replace(/[鸡机几计级及记际基积激击极急集迹绩季寄忌纪己挤济继技籍即吉辑疾肌饥]/g,"坤");

export default function Home() {
  const [view,setView] = useState<View>("dashboard");
  const [tab,setTab] = useState<"library"|"targets">("library");
  const [query,setQuery] = useState("");
  const [degree,setDegree] = useState("全部");
  const [region,setRegion] = useState<"全部"|"美国"|"香港"|"加拿大"|"英国"|"澳大利亚">("美国");
  const [status,setStatus] = useState<"全部"|"已核实"|"待复核">("全部");
  const [targets,setTargets] = useState<string[]>([]);
  const [selected,setSelected] = useState<Program | null>(null);
  const [selectedCourse,setSelectedCourse] = useState<{course:string;track:string;program:Program}|null>(null);
  const [compare,setCompare] = useState<string[]>([]);
  const [compareOpen,setCompareOpen] = useState(false);
  const [ready,setReady] = useState(false);
  const [language,setLanguage] = useState<"zh"|"en">("zh");
  const [dark,setDark] = useState(false);
  const [themeMode,setThemeMode]=useState<ThemeMode>("system");
  const [filtersOpen,setFiltersOpen] = useState(false);
  const [categoryFilter,setCategoryFilter] = useState<Category|"全部">("全部");
  const [categories,setCategories] = useState<Record<string,Category>>({});
  const [notes,setNotes] = useState<Record<string,string>>({});
  const [featureFilters,setFeatureFilters] = useState<string[]>([]);
  const [deadlineWindow,setDeadlineWindow] = useState("全部");
  const [assistantOpen,setAssistantOpen] = useState(false);
  const [assistantQuery,setAssistantQuery] = useState("");
  const [messages,setMessages] = useState<ChatMessage[]>([{role:"assistant",text:"你好，我是坤械助手。可以问我学校、申请要求、费用、截止日期或课程。"}]);
  const [assistantSchool,setAssistantSchool] = useState<string>();
  const [calendarMonth,setCalendarMonth] = useState(()=>new Date(2026,6,1));
  const [calendarNotes,setCalendarNotes] = useState<Record<string,CalendarNote>>({});
  const [calendarDate,setCalendarDate] = useState("");
  const [calendarText,setCalendarText] = useState("");
  const [calendarTag,setCalendarTag] = useState("prepare-materials");
  const [materials,setMaterials] = useState<Record<string,string>>({CV:"未开始",PS:"未开始",推荐信:"未开始",成绩单:"未开始",语言成绩:"未开始",GRE:"未开始",护照:"未开始"});
  const [toast,setToast] = useState("");
  const backupInputRef=useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("me-targets");
    if (saved) setTargets(JSON.parse(saved));
    const savedCategories=localStorage.getItem("me-categories"); if(savedCategories)setCategories(JSON.parse(savedCategories));
    const savedNotes=localStorage.getItem("me-notes"); if(savedNotes)setNotes(JSON.parse(savedNotes));
    const savedCalendar=localStorage.getItem("me-calendar"); if(savedCalendar){const raw=JSON.parse(savedCalendar) as Record<string,CalendarNote>;setCalendarNotes(Object.fromEntries(Object.entries(raw).map(([date,note])=>[date,{...note,tag:LEGACY_CALENDAR_TAGS[note.tag]||note.tag}])))}
    const savedMaterials=localStorage.getItem("me-materials"); if(savedMaterials)setMaterials(JSON.parse(savedMaterials));
    localStorage.removeItem("me-trackers");
    const savedThemeMode=localStorage.getItem("me-theme-mode");const mode:ThemeMode=savedThemeMode==="light"||savedThemeMode==="dark"||savedThemeMode==="system"?savedThemeMode:"system";setThemeMode(mode);setDark(mode==="system"?window.matchMedia("(prefers-color-scheme: dark)").matches:mode==="dark");
    const savedLanguage=localStorage.getItem("me-language"); if(savedLanguage==="en"||savedLanguage==="zh")setLanguage(savedLanguage);
    setReady(true);
  },[]);
  useEffect(() => { if (ready) localStorage.setItem("me-targets",JSON.stringify(targets)); },[targets,ready]);
  useEffect(()=>{if(ready)localStorage.setItem("me-categories",JSON.stringify(categories))},[categories,ready]);
  useEffect(()=>{if(ready)localStorage.setItem("me-notes",JSON.stringify(notes))},[notes,ready]);
  useEffect(()=>{if(ready)localStorage.setItem("me-calendar",JSON.stringify(calendarNotes))},[calendarNotes,ready]);
  useEffect(()=>{if(ready)localStorage.setItem("me-materials",JSON.stringify(materials))},[materials,ready]);
  useEffect(()=>{if(ready){localStorage.setItem("me-theme",dark?"dark":"light");document.documentElement.dataset.theme=dark?"dark":"light"}},[dark,ready]);
  useEffect(()=>{if(!ready)return;localStorage.setItem("me-theme-mode",themeMode);const media=window.matchMedia("(prefers-color-scheme: dark)"),apply=()=>setDark(themeMode==="system"?media.matches:themeMode==="dark");apply();media.addEventListener("change",apply);return()=>media.removeEventListener("change",apply)},[themeMode,ready]);
  useEffect(()=>{if(ready){localStorage.setItem("me-language",language);document.documentElement.lang=language==="en"?"en":"zh-CN";document.title=language==="en"?"ApplyME | Mechanical Engineering Master's Workspace":"ApplyME｜机械工程硕士申请工作台"}},[language,ready]);
  useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(""),2600);return()=>clearTimeout(timer)},[toast]);

  const list = useMemo(() => ALL_PROGRAMS.filter(p =>
    (view !== "favorites" || targets.includes(p.id)) &&
    (tab === "library" || targets.includes(p.id)) &&
    (tab === "targets" || region === "全部" || (p.region || "美国") === region) &&
    (degree === "全部" || p.degree === degree) &&
    (status === "全部" || programVerification(p) === status) &&
    (deadlineWindow === "全部" || (deadlineInfo(p.deadline).days !== null && deadlineInfo(p.deadline).days! >= 0 && deadlineInfo(p.deadline).days! <= Number(deadlineWindow))) &&
    (categoryFilter === "全部" || categories[p.id] === categoryFilter) &&
    featureFilters.every(feature=>`${p.field} ${p.program} ${p.tracks.map(t=>`${t.name} ${t.courses.join(" ")}`).join(" ")}`.toLowerCase().includes(feature.toLowerCase().replace(/s$/,""))) &&
    `${p.school}${SCHOOL_NAMES[p.school] || ""}${p.program}${p.degree}${p.field}${programLocation(p)}`.toLowerCase().includes(query.toLowerCase())
  ).sort((a,b)=>(rankingMeta(a).value??999)-(rankingMeta(b).value??999)||a.school.localeCompare(b.school)),[view,tab,targets,degree,status,region,query,categoryFilter,categories,featureFilters,deadlineWindow]);

  const toggleTarget = (id:string) => setTargets(old => {const removing=old.includes(id),program=PROGRAM_BY_ID.get(id),name=program?SCHOOL_NAMES[program.school]||program.school:"该项目";setToast(removing?`已从收藏移除：${name}`:`已收藏：${name}`);return removing ? old.filter(x=>x!==id) : [...old,id]});
  const toggleCompare = (id:string) => setCompare(old => old.includes(id) ? old.filter(x=>x!==id) : old.length < 3 ? [...old,id] : old);
  const setCategory=(id:string,value:string)=>setCategories(old=>{const next={...old};if(!value)delete next[id];else next[id]=value as Category;return next});
  const upcoming=useMemo(()=>ALL_PROGRAMS.filter(p=>targets.includes(p.id)&&deadlineInfo(p.deadline).days!==null&&deadlineInfo(p.deadline).days!>=0).sort((a,b)=>(deadlineInfo(a.deadline).days||0)-(deadlineInfo(b.deadline).days||0)).slice(0,6),[targets]);
  const todayKey=getLocalDateKey();
  const reminderNotes=useMemo(()=>Object.entries(calendarNotes).sort(([a],[b])=>{const aPast=a<todayKey,bPast=b<todayKey;if(aPast!==bPast)return aPast?1:-1;return aPast?b.localeCompare(a):a.localeCompare(b)}).slice(0,6),[calendarNotes,todayKey]);
  const materialCompleted=Object.values(materials).filter(value=>value==="已完成").length;
  const nextMaterial=Object.entries(materials).find(([,value])=>value!=="已完成")?.[0]||"全部材料";
  const monthDays=useMemo(()=>{const y=calendarMonth.getFullYear(),m=calendarMonth.getMonth(),first=new Date(y,m,1).getDay(),count=new Date(y,m+1,0).getDate();return [...Array(first).fill(null),...Array.from({length:count},(_,i)=>i+1)]},[calendarMonth]);
  const dateKey=(day:number)=>`${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth()+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
  const openCalendarDay=(day:number)=>{const key=dateKey(day),note=calendarNotes[key];setCalendarDate(key);setCalendarText(note?.text||"");setCalendarTag(note?.tag||"prepare-materials")};
  const saveCalendarNote=()=>{if(!calendarDate)return;setCalendarNotes(old=>{const next={...old};if(calendarText.trim())next[calendarDate]={text:calendarText.trim(),tag:calendarTag};else delete next[calendarDate];return next});setCalendarDate("")};
  const sendAssistantQuestion=(value:string)=>{const question=value.trim();if(!question)return;const q=question.toLowerCase();let answer:{text:string;source?:string;programId?:string};if(q.includes("材料检查")||q.includes("材料进度")||q.includes("material check"))answer={text:en?`You have completed ${materialCompleted}/${Object.keys(materials).length} materials. I suggest working on ${materialName(nextMaterial)} next.`:`你的材料已完成 ${materialCompleted}/${Object.keys(materials).length}。建议下一步优先处理 ${nextMaterial}，完成后我会同步更新主页进度。`};else if(q.includes("今日")||q.includes("先做什么")||q.includes("today"))answer={text:en?`Start with ${materialName(nextMaterial)} today. Spend 30 minutes on one small draft instead of trying to finish everything at once.`:`今天先推进 ${nextMaterial}。建议用 30 分钟完成一个小版本，不追求一次写完。`};else if(q.includes("选校建议")||q.includes("school advice"))answer={text:en?`You currently have ${targets.length} saved mechanical master's programs. Check your reach, target and safer options, then compare course fit and total budget.`:`你当前收藏了 ${targets.length} 个机械硕士项目。建议按冲刺、目标、保底重新检查比例，并优先确认每个项目的课程匹配和总预算。`};else if((q.includes("预算")||q.includes("budget"))&&!ALL_PROGRAMS.some(p=>q.includes((SCHOOL_NAMES[p.school]||"").toLowerCase())))answer={text:en?"Split your budget into mechanical master's tuition, housing, insurance and daily expenses. Tell me a school and I can use the figures recorded here.":"预算建议分成机械硕士学费、住房、保险和日常生活四部分。告诉我具体学校，我会给出该项目当前记录的学费与住房参考。"};else answer=answerSchoolQuestion(question,assistantSchool);if(answer.programId)setAssistantSchool(answer.programId);setMessages(old=>[...old,{role:"user",text:question},{role:"assistant",text:kunify(answer.text),source:answer.source}]);setAssistantQuery("")};
  const askAssistant=()=>sendAssistantQuestion(assistantQuery);
  const en=language==="en";
  const t=TRANSLATIONS[language];
  const calendarTagLabel=(tag:string)=>CALENDAR_TAG_LABELS[language][(LEGACY_CALENDAR_TAGS[tag]||tag) as keyof typeof CALENDAR_TAG_LABELS.zh]||tag;
  const exportBackup=()=>{const payload={version:1,exportedAt:new Date().toISOString(),app:"ApplyME",data:{targets,categories,notes,calendarNotes,materials,language,theme:themeMode}};const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`applyme-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url);setToast(en?"Backup exported":"备份已导出")};
  const importBackup=async(file?:File)=>{if(!file)return;try{const parsed=JSON.parse(await file.text()) as {version?:unknown;app?:unknown;data?:unknown};if(parsed.version!==1||parsed.app!=="ApplyME"||!parsed.data||typeof parsed.data!=="object")throw new Error("format");const data=parsed.data as Record<string,unknown>;if(!Array.isArray(data.targets)||!data.categories||typeof data.categories!=="object"||!data.notes||typeof data.notes!=="object"||!data.calendarNotes||typeof data.calendarNotes!=="object"||!data.materials||typeof data.materials!=="object")throw new Error("fields");if(!window.confirm(en?"Importing will replace your current personal data. Continue?":"导入会覆盖当前个人数据，是否继续？"))return;setTargets(data.targets.filter((x):x is string=>typeof x==="string"));setCategories(data.categories as Record<string,Category>);setNotes(data.notes as Record<string,string>);setCalendarNotes(data.calendarNotes as Record<string,CalendarNote>);setMaterials(data.materials as Record<string,string>);if(data.language==="zh"||data.language==="en")setLanguage(data.language);if(data.theme==="dark"||data.theme==="light"||data.theme==="system")setThemeMode(data.theme);setToast(en?"Backup restored":"备份已恢复")}catch{setToast(en?"Invalid or damaged backup file":"备份文件无效或已损坏")}finally{if(backupInputRef.current)backupInputRef.current.value=""}};
  const clearPersonalData=()=>{if(!window.confirm(en?"Clear all saved programs, categories, notes, reminders and material progress? This cannot be undone.":"确定清空收藏、分类、笔记、提醒和材料进度吗？此操作无法撤销。"))return;setTargets([]);setCategories({});setNotes({});setCalendarNotes({});setMaterials({CV:"未开始",PS:"未开始",推荐信:"未开始",成绩单:"未开始",语言成绩:"未开始",GRE:"未开始",护照:"未开始"});setToast(en?"Personal data cleared":"个人数据已清空")};
  const title=view==="dashboard"?"Dashboard":view==="favorites"?(en?"Saved & Categories":"收藏与分类"):view==="mine"?(en?"My Workspace":"我的"):(en?"Program Library":"项目库");
  const materialName=(name:string)=>en?({"推荐信":"Recommendation Letters","成绩单":"Transcript","语言成绩":"Language Test","护照":"Passport"} as Record<string,string>)[name]||name:name;
  const categoryName=(value:string)=>en?({Favorite:"Saved",Dream:"Reach",Target:"Target",Safety:"Safer",Priority:"Priority"} as Record<string,string>)[value]||value:CATEGORY_LABELS[value as Category]||value;

  return <main className="app-shell" data-language={language}>
    <aside>
      <div className="logo"><b>APPLY</b><span>ME</span></div>
      <nav className="primary-nav">
        <button className={view==="dashboard"?"active":""} onClick={()=>setView("dashboard")}><span>⌂</span> Dashboard</button>
        <button className={view==="schools"?"active":""} onClick={()=>{setView("schools");setTab("library")}}><span>◇</span> {en?"Programs":"项目库"} <small>{ALL_PROGRAMS.length}</small></button>
        <button className={view==="favorites"?"active":""} onClick={()=>{setView("favorites");setTab("targets")}}><span>☆</span> {en?"Saved":"收藏分类"} <small>{targets.length}</small></button>
        <button className={view==="mine"?"active":""} onClick={()=>setView("mine")}><span>◎</span> {en?"My Workspace":"我的"}</button>
      </nav>
      <section className="interface-settings desktop-settings" aria-label={t.interfaceSettings}><b>⚙ {t.interfaceSettings}</b><div><span>{t.languageLabel}</span><div className="setting-options"><button className={language==="zh"?"active":""} onClick={()=>setLanguage("zh")}>中文</button><button className={language==="en"?"active":""} onClick={()=>setLanguage("en")}>EN</button></div></div><div><span>{t.appearance}</span><div className="setting-options"><button className={themeMode==="light"?"active":""} onClick={()=>setThemeMode("light")}>{t.light}</button><button className={themeMode==="dark"?"active":""} onClick={()=>setThemeMode("dark")}>{t.dark}</button><button className={themeMode==="system"?"active":""} onClick={()=>setThemeMode("system")}>{t.system}</button></div></div></section>
      <div className="side-note"><b>2027 FALL</b><p>{en?"Mechanical Engineering Master's Applications":"机械工程硕士申请"}</p><span>{en?"Saved in this browser":"数据保存在当前浏览器"}</span></div>
    </aside>

    <section className={`page page-${view}`}>
      <header>
        <div><p>MASTER'S APPLICATION WORKSPACE</p><h1>{title}</h1></div>
        <div className="header-actions"><label className="global-search"><span>⌕</span><input value={query} onFocus={()=>setView("schools")} onChange={e=>{setQuery(e.target.value);setView("schools")}} placeholder={en?"Search school, program, city or state":"搜索学校、专业、城市或州"} /></label><div className="season">{en?"Intake":"申请季"} <b>2027 Fall</b></div></div>
      </header>

      {view==="dashboard" && <section className="dashboard-view">
        <section className="command-overview"><div><span>APPLICATION COMMAND CENTER</span><h2>{en?"2027 Fall Application Hub":"2027 Fall 申请控制台"}</h2><p>{en?"Keep saved programs, material progress and reminders in one place.":"集中查看收藏项目、材料进度和近期提醒。"}</p></div><div className="command-metrics"><button onClick={()=>{setView("favorites");setTab("targets")}}><small>{en?"Saved Programs":"收藏项目"}</small><b>{targets.length}</b></button><button onClick={()=>setView("mine")}><small>{en?"Materials Done":"材料完成"}</small><b>{materialCompleted}/{Object.keys(materials).length}</b></button><button onClick={()=>setView("mine")}><small>{en?"Reminders":"日历提醒"}</small><b>{reminderNotes.length}</b></button></div></section>
        <section className="today-focus"><div><span className="eyebrow">TODAY'S FOCUS</span><h3>{en?`Start with: ${materialName(nextMaterial)}`:`今天先推进：${nextMaterial}`}</h3><p>{en?"Spend 30 minutes on a small draft and keep moving forward.":"用 30 分钟完成一个小版本，让申请准备持续向前。"}</p></div><div><button onClick={()=>{setMaterials(old=>({...old,[nextMaterial]:"准备中"}));setToast(`${nextMaterial} 已标记为准备中`)}}>{en?"Start":"开始处理"}</button><button onClick={()=>setView("mine")}>{en?"Open materials":"打开我的材料"}</button></div></section>
        <div className="dashboard-heading"><div><span className="eyebrow">MY APPLICATIONS</span><h2>{en?"Saved School Countdowns":"收藏学校倒计时"}</h2></div><button onClick={()=>{setView("favorites");setTab("targets")}}>{en?"Manage saved":"管理收藏"} →</button></div>
        <div className="deadline-grid">{upcoming.length?upcoming.map(p=>{const d=deadlineInfo(p.deadline);return <button className="deadline-card" key={p.id} onClick={()=>setSelected(p)}><SchoolLogo program={p}/><div><b>{SCHOOL_NAMES[p.school]||p.school}</b><span>{p.degree} · {p.program}</span></div><em className={`countdown ${d.tone}`}>{d.label}</em><small>{dateLabel(p.deadline)}</small></button>}):<EmptyState title={en?"No published deadlines in saved programs":"收藏学校暂时没有已公布的截止日期"} description={en?"Save programs from the library to see only your own countdowns here.":"从项目库收藏学校后，这里只显示你的学校倒计时。"} actionLabel={en?"Browse programs":"浏览项目"} onAction={()=>setView("schools")}/>}</div>
        <div className="dashboard-heading reminder-heading"><div><span className="eyebrow">CALENDAR REMINDERS</span><h2>{en?"My Calendar Reminders":"我的日历提醒"}</h2></div><button onClick={()=>setView("mine")}>{en?"Open calendar":"打开日历"} →</button></div>
        <div className="reminder-list">{reminderNotes.length?reminderNotes.map(([date,note])=><button key={date} className={date<todayKey?"is-past":""} onClick={()=>setView("mine")}><time>{date.slice(5).replace("-","/")}</time><span className="reminder-tag">{calendarTagLabel(note.tag)}</span><b>{note.text}</b><small className="reminder-state">{date<todayKey?t.expired:t.toDo}</small></button>):<EmptyState title={t.noReminders} description={t.noRemindersHelp} actionLabel={en?"Open calendar":"打开日历"} onAction={()=>setView("mine")}/>}</div>
      </section>}

      {view==="mine"&&<section className="mine-view">
        <section className="interface-settings mobile-settings" aria-label={t.interfaceSettings}><b>{t.interfaceSettings}</b><div><span>{t.languageLabel}</span><div className="setting-options"><button className={language==="zh"?"active":""} onClick={()=>setLanguage("zh")}>中文</button><button className={language==="en"?"active":""} onClick={()=>setLanguage("en")}>English</button></div></div><div><span>{t.appearance}</span><div className="setting-options"><button className={themeMode==="light"?"active":""} onClick={()=>setThemeMode("light")}>{t.light}</button><button className={themeMode==="dark"?"active":""} onClick={()=>setThemeMode("dark")}>{t.dark}</button><button className={themeMode==="system"?"active":""} onClick={()=>setThemeMode("system")}>{t.system}</button></div></div></section>
        <div className="mine-grid"><section className="calendar-card"><div className="calendar-head"><button onClick={()=>setCalendarMonth(new Date(calendarMonth.getFullYear(),calendarMonth.getMonth()-1,1))}>←</button><h2>{en?`${calendarMonth.toLocaleString("en-US",{month:"long"})} ${calendarMonth.getFullYear()}`:`${calendarMonth.getFullYear()} 年 ${calendarMonth.getMonth()+1} 月`}</h2><button onClick={()=>setCalendarMonth(new Date(calendarMonth.getFullYear(),calendarMonth.getMonth()+1,1))}>→</button></div><div className="calendar-week">{(en?["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]:["日","一","二","三","四","五","六"]).map(d=><span key={d}>{d}</span>)}</div><div className="calendar-grid">{monthDays.map((day,i)=>day?<button key={i} className={calendarNotes[dateKey(day)]?"has-note":""} onClick={()=>openCalendarDay(day)}><b>{day}</b>{calendarNotes[dateKey(day)]&&<><span>{calendarTagLabel(calendarNotes[dateKey(day)].tag)}</span><small>{calendarNotes[dateKey(day)].text}</small></>}</button>:<i key={i}/>)}</div></section>
        <section className="materials-card"><span className="eyebrow">APPLICATION MATERIALS</span><h2>{en?"My Application Materials":"我的申请材料"}</h2><p>{en?"Statuses are saved in this browser.":"状态只保存在当前浏览器。"}</p><div className="material-progress"><i style={{width:`${materialCompleted/Object.keys(materials).length*100}%`}}/><span>{materialCompleted} / {Object.keys(materials).length} {en?"completed":"已完成"}</span></div><div className="materials-list">{Object.entries(materials).map(([name,value])=><label className={`material-row ${value==="已完成"?"status-complete":value==="待修改"?"status-edit":value==="准备中"?"status-working":"status-not-started"}`} key={name}><b>{materialName(name)}</b><select className="material-status" value={value} onChange={e=>setMaterials(old=>({...old,[name]:e.target.value}))}><option value="未开始">{en?"Not started":"未开始"}</option><option value="准备中">{en?"In progress":"准备中"}</option><option value="待修改">{en?"Needs revision":"待修改"}</option><option value="已完成">{en?"Completed":"已完成"}</option></select></label>)}</div></section></div>
        <section className="data-management" aria-labelledby="data-management-title"><div><span className="eyebrow">BACKUP & RESTORE</span><h2 id="data-management-title">{t.dataManagement}</h2><p>{t.dataHelp}</p></div><div className="data-actions"><button onClick={exportBackup}>{t.exportBackup}</button><button onClick={()=>backupInputRef.current?.click()}>{t.importBackup}</button><input ref={backupInputRef} type="file" accept="application/json,.json" hidden onChange={e=>void importBackup(e.target.files?.[0])}/><button className="danger-action" onClick={clearPersonalData}>{t.clearData}</button></div><small>{t.clearWarning}</small></section>
      </section>}

      {(view==="schools"||view==="favorites") && <>
      <section className="summary compact-summary">
        <button onClick={()=>{setTab("library");setCategoryFilter("全部")}}><span>{en?"Programs":"收录项目"}</span><b>{ALL_PROGRAMS.length}</b></button>
        <button onClick={()=>setTab("targets")}><span>{en?"My Targets":"我的目标"}</span><b>{targets.length}</b></button>
        <button className={`status-card verified-card ${status==="已核实"?"active":""}`} onClick={()=>setStatus(status==="已核实"?"全部":"已核实")}><span>{en?"Verified programs":"项目已核实"}</span><b>{ALL_PROGRAMS.filter(p=>programVerification(p)==="已核实").length}</b></button>
        <button className={`status-card pending-card ${status==="待复核"?"active":""}`} onClick={()=>setStatus(status==="待复核"?"全部":"待复核")}><span>{en?"Programs to review":"项目待确认"}</span><b>{ALL_PROGRAMS.filter(p=>programVerification(p)==="待复核").length}</b></button>
      </section>

      {status!=="全部" && <div className={`filter-notice ${status==="已核实"?"is-verified":"is-pending"}`}>{en?"Showing: ":"正在显示："}{status==="已核实"?t.verified:t.pending} ({list.length})<button onClick={()=>setStatus("全部")}>{en?"Show all":"显示全部"}</button></div>}

      <div className="toolbar">
        <div className="region-tabs" aria-label={en?"Region filter":"地区筛选"}>{(["全部","美国","香港","加拿大","英国","澳大利亚"] as const).map(r=><button key={r} className={region===r?"active":""} onClick={()=>setRegion(r)}>{en?({"全部":"All","美国":"USA","香港":"Hong Kong","加拿大":"Canada","英国":"UK","澳大利亚":"Australia"} as Record<string,string>)[r]:r}</button>)}</div>
        <select value={degree} aria-label={en?"Degree filter":"学位筛选"} onChange={e=>setDegree(e.target.value)}><option value="全部">{en?"All degrees":"全部学位"}</option><option>MS</option><option>MSc</option><option>MSc(Eng)</option><option>SM</option><option>ScM</option><option>MSE</option><option>MEng</option><option>MMechE</option></select>
        <select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value as Category|"全部")}><option value="全部">{en?"All categories":"全部分类"}</option>{Object.keys(CATEGORY_LABELS).map(v=><option value={v} key={v}>{categoryName(v)}</option>)}</select>
        <select value={deadlineWindow} aria-label={en?"Deadline filter":"截止时间筛选"} onChange={e=>setDeadlineWindow(e.target.value)}><option value="全部">{en?"All deadlines":"全部截止时间"}</option><option value="30">{en?"Within 30 days":"30 天内"}</option><option value="60">{en?"Within 60 days":"60 天内"}</option><option value="90">{en?"Within 90 days":"90 天内"}</option></select>
        <button className={`filter-button ${filtersOpen?"active":""}`} onClick={()=>setFiltersOpen(v=>!v)}>{en?"Filters":"筛选"} {featureFilters.length?`· ${featureFilters.length}`:""}</button>
      </div>
      {filtersOpen&&<div className="filter-panel"><span>{en?"Study areas":"研究方向"}</span>{["Robotics","Controls","Thermal","Manufacturing","Materials","Artificial Intelligence"].map(f=><button key={f} className={featureFilters.includes(f)?"active":""} onClick={()=>setFeatureFilters(old=>old.includes(f)?old.filter(x=>x!==f):[...old,f])}>{f}</button>)}<button className="clear-filter" onClick={()=>setFeatureFilters([])}>{en?"Clear":"清除"}</button></div>}

      <section className="table-card">
        <div className="thead"><span>{en?"School / Program":"学校 / 项目"}</span><span>{en?"Degree":"学位"}</span><span>{en?"Deadline":"截止日期"}</span><span>{en?"Countdown":"倒计时"}</span><span>{en?"Category":"分类"}</span><span>{en?"Status":"状态"}</span><span /></div>
        {list.map(p=><article className={`row ${overallVerification(p)==="verified"?"row-verified":"row-pending"}`} key={p.id} onClick={()=>setSelected(p)} tabIndex={0} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();setSelected(p)}}}>
          <div className="school"><RankingBadge ranking={getTrustedRanking(p)} language={language} compact/><SchoolLogo program={p}/><div><b>{SCHOOL_NAMES[p.school] || p.school}</b><span>{p.school}</span><small>{p.program} · {p.field}</small></div></div>
          <strong className="degree">{p.degree}</strong>
          <span>{dateLabel(p.deadline)}</span>
          <span className={`countdown ${deadlineInfo(p.deadline).tone}`}>{deadlineInfo(p.deadline).label}</span>
          <select className={`category-select ${categories[p.id]||""}`} value={categories[p.id]||""} onClick={e=>e.stopPropagation()} onChange={e=>setCategory(p.id,e.target.value)}><option value="">{en?"Uncategorized":"未分类"}</option>{Object.keys(CATEGORY_LABELS).map(v=><option value={v} key={v}>{categoryName(v)}</option>)}</select>
          <span className={overallVerification(p)==="verified"?"verified":"pending"}>{overallVerification(p)==="verified"?t.verified:overallVerification(p)==="historical"?(en?"Historical":"历史参考"):t.pending}</span>
          <div className="actions">
            <CompareButton selected={compare.includes(p.id)} language={language} onToggle={()=>toggleCompare(p.id)} compact/>
            <button className={targets.includes(p.id)?"saved":""} onClick={e=>{e.stopPropagation();toggleTarget(p.id)}} title="添加或移除目标">{targets.includes(p.id)?"−":"＋"}</button>
          </div>
        </article>)}
        {!list.length && <div className="empty">{tab==="targets"?"还没有目标项目，请从项目库点击“＋”添加。":"没有找到项目。"}</div>}
      </section>
      <p className="disclaimer">{t.rankingNote}<br/>{en?"U.S. programs use verified U.S. News data when available; other regions use verified QS data. Unverified internal ordering is never shown as an official ranking.":"美国项目仅在有可靠来源时显示 U.S. News；其他地区仅在有可靠来源时显示 QS。内部排序不会作为官方排名展示。"}</p>
      <div className="data-disclaimer" role="note">{en?"Application requirements, deadlines, tuition, rankings, and course offerings may change by application cycle. This website is intended for planning purposes only. Always verify the latest information on the official university website before applying.":"申请要求、截止日期、学费、排名和课程可能随申请周期变化。本网站仅用于规划；申请前请务必在大学官网核实最新信息。"}</div>
      </>}

    </section>

    {selected && <div className="overlay" onClick={()=>setSelected(null)}>
      <section className="drawer school-detail-drawer" onClick={e=>e.stopPropagation()}>
        <section className={`school-hero hero-${selected.id.split("-")[0]}`}>
          <div className="hero-fallback" aria-hidden="true"><SchoolLogo program={selected} className="hero-school-mark"/><strong>{selected.school.split(" ").map(word=>word[0]).join("").slice(0,4)}</strong></div>
          <div className="hero-shade"/><button className="close hero-close" aria-label={t.close} onClick={()=>setSelected(null)}>×</button>
          <div className="hero-copy"><span className={programVerification(selected)==="已核实"?"verified":"pending"}>{programVerification(selected)==="已核实"?t.verified:t.pending}</span><p>{programLocation(selected)}</p><h2>{SCHOOL_NAMES[selected.school]||selected.school}</h2><h3>{selected.school}</h3><b>{selected.degree} · {selected.program}</b></div>
          <div className="hero-quick-stats" aria-label={en?"Program quick stats":"项目速览"}><div><span>{en?"Degree":"学位"}</span><b>{selected.degree}</b></div><div><span>{en?"Deadline":"截止日期"}</span><b>{dateLabel(selected.deadline)}</b></div><div><span>GRE</span><b>{selected.gre||t.fieldPending}</b></div><div><span>{en?"Duration":"学制"}</span><b>{selected.duration||t.fieldPending}</b></div><div><span>{en?"Tuition":"学费"}</span><b>{costFor(selected.school).tuition}</b></div></div>
        </section>
        <div className="detail-body">
        <div className="detail-actions"><button className="target-btn" onClick={()=>toggleTarget(selected.id)}>{targets.includes(selected.id)?t.removeTarget:`＋ ${t.addTarget}`}</button><select aria-label={t.setCategory} className={`category-select ${categories[selected.id]||""}`} value={categories[selected.id]||""} onChange={e=>setCategory(selected.id,e.target.value)}><option value="">{t.setCategory}</option>{Object.entries(CATEGORY_LABELS).map(([v])=><option value={v} key={v}>{categoryName(v)}</option>)}</select><CompareButton selected={compare.includes(selected.id)} language={language} onToggle={()=>toggleCompare(selected.id)}/></div>
        <section className="detail-overview"><div><span>{t.program}</span><b>{selected.program}</b></div><div><span>{t.degree}</span><b>{selected.degree}</b></div><div><span>{t.location}</span><b>{programLocation(selected)}</b></div><div className="ranking-detail"><span>{t.overallRanking}</span><RankingBadge ranking={getTrustedRanking(selected)} language={language}/></div><div><span>{t.programStatus}</span><b className={overallVerification(selected)==="verified"?"verified":"pending"}>{overallVerification(selected)==="verified"?t.verified:overallVerification(selected)==="historical"?(en?"Historical reference":"历史参考"):t.pending}</b></div><div><span>{t.meRanking}</span><b>{t.noMeRanking}</b></div></section>
        <div className={`detail-deadline ${deadlineInfo(selected.deadline).tone}`}><div><span>APPLICATION DEADLINE</span><b>{dateLabel(selected.deadline)}</b></div><strong>{deadlineInfo(selected.deadline).label}</strong></div>
        <div className="facts">
          <div className={needsFieldReview(selected.deadline)?"field-review":""}><span>{en?"Deadline":"截止日期"}</span><b>{dateLabel(selected.deadline)}</b><VerificationStatus verification={getFieldVerification(selected,"deadline")} language={language}/></div><div className={needsFieldReview(selected.letters)?"field-review":""}><span>{en?"Recommendations":"推荐信"}</span><b>{selected.letters||t.fieldPending}</b><VerificationStatus verification={getFieldVerification(selected,"recommendations")} language={language}/></div>
          <div className={needsFieldReview(selected.cv)?"field-review":""}><span>CV / Resume</span><b>{selected.cv||t.fieldPending}</b><VerificationStatus verification={getFieldVerification(selected,"cv")} language={language}/></div><div className={needsFieldReview(selected.sop)?"field-review":""}><span>SOP / PS</span><b>{selected.sop||t.fieldPending}</b><VerificationStatus verification={getFieldVerification(selected,"sop")} language={language}/></div>
          <div className={needsFieldReview(selected.gre)?"field-review":""}><span>GRE</span><b>{selected.gre||t.fieldPending}</b><VerificationStatus verification={getFieldVerification(selected,"gre")} language={language}/></div><div className={needsFieldReview(selected.credits)?"field-review":""}><span>{en?"Credits / Duration":"学分 / 时长"}</span><b>{selected.credits||t.fieldPending} · {selected.duration||t.fieldPending}</b><VerificationStatus verification={getFieldVerification(selected,"credits")} language={language}/></div>
        </div>
        <section className="overview-section"><div className="section-heading"><p className="kicker">SCHOOL & PROGRAM</p><h4>{t.schoolIntro}</h4></div><div className="overview-grid"><article><span>01</span><h5>{t.schoolOverview}</h5><p>{getOverview(selected,language).school}</p></article><article><span>02</span><h5>{t.programHighlights}</h5><p>{getOverview(selected,language).program}</p></article><article><span>03</span><h5>{t.bestFit}</h5><p>{getOverview(selected,language).fit}</p></article></div><small>{en?"Confirm final curriculum and admission requirements on the official program website.":"最终课程设置与申请要求请以项目官网为准。"}</small></section>
        <section className="costs">
          <p className="kicker">MECHANICAL MASTER'S COST</p><h4>{t.costTitle}</h4>
          <div className="cost-grid">
            <div><span>{t.applicationFee}</span><b>{APP_FEE_BY_REGION[programRegion(selected)]||"Not Available"}</b></div>
            <div><span>{t.tuition}</span><b>{costFor(selected.school).tuition}</b></div>
            <div><span>{t.livingCost}</span><b>{costFor(selected.school).shared}</b></div>
            <div><span>{t.insurance}</span><b>Not Available</b></div>
            <div><span>{t.privateRoom}</span><b>{costFor(selected.school).privateRoom}</b></div>
            <div><span>{t.totalCost}</span><b>Not Available</b></div>
          </div>
          <p className="housing-note"><b>常见租房要求：</b>{costFor(selected.school).note}</p>
          <p className="budget-warning"><span className="historical-badge">{en?"Historical / pending reference":"历史 / 待核实参考"}</span>{en?"Tuition and living-cost figures are planning references, not a bill. Currency, data year, billing basis, credits, duration, housing, and personal spending must be confirmed on official pages.":"学费与生活费仅为规划参考，并非正式账单。币种、数据年份、计费方式、学分、学制、住房和个人支出均需在官网确认。"}</p>
        </section>
        <div className="tracks"><p className="kicker">DIRECTIONS & COURSES</p><h4>{t.coursesTitle}</h4>
          {selected.tracks.map(track=><div className="track" key={track.name}><b>{track.name}</b><ul>{track.courses.map(c=><li key={c}><button onClick={()=>setSelectedCourse({course:c,track:track.name,program:selected})}>{c}<span>{t.viewCourse}</span></button></li>)}</ul></div>)}
          <p className="context-disclaimer">{en?"Course availability and content may change by semester. Please verify the latest curriculum on the official university website.":"课程开设与内容可能随学期变化，请在大学官网核实最新培养方案。"}</p>
        </div>
        <div className="official-links" aria-label={t.officialLinksNote}>{selected.departmentUrl&&<a title={t.department} className="source secondary-link" href={selected.departmentUrl} target="_blank" rel="noreferrer noopener">{t.department} ↗</a>}{selected.programUrl&&<a title={t.programWebsite} className="source source-button" href={selected.programUrl} target="_blank" rel="noreferrer noopener">{t.programWebsite} ↗</a>}{selected.applicationUrl&&<a title={t.applicationPortal} className="source secondary-link" href={selected.applicationUrl} target="_blank" rel="noreferrer noopener">{t.applicationPortal} ↗</a>}<small>{t.officialLinksNote}</small></div>
        <section className="notes-section"><p className="kicker">PRIVATE NOTES · AUTO SAVED</p><h4>{t.privateNotes}</h4><textarea value={notes[selected.id]||""} onChange={e=>setNotes(old=>({...old,[selected.id]:e.target.value}))} placeholder={en?"Record faculty, directions, outcomes, location or personal thoughts…":"记录教授、研究方向、就业、天气、安全或个人想法…"} /><span>{en?"Saved only in this browser":"仅保存在当前浏览器"}</span></section>
        <p className="last-updated">Last Updated · July 17, 2026</p>
        <p className="source-note">当前范围包括美国项目、香港八所 UGC 资助大学、加拿大四校、英国 QS 2027 世界前 100 院校及澳大利亚 Group of Eight。无对应机械工程硕士的学校明确标记为“暂无匹配项目”；课程与要求请以官方页面为最终依据。</p>
        </div>
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
        <a className="source source-button" href={selectedCourse.program.curriculumUrl||selectedCourse.program.programUrl||selectedCourse.program.source} target="_blank" rel="noopener noreferrer">{en?"Open official curriculum page":"前往官方项目与课程页面"} ↗</a>
        <p className="source-note">中文内容为便于选校的概括，不替代官网原始课程说明。</p>
      </section>
    </div>}

    {calendarDate&&<div className="course-overlay" onClick={()=>setCalendarDate("")}><section className="calendar-editor" onClick={e=>e.stopPropagation()}><button className="course-close" aria-label={t.close} onClick={()=>setCalendarDate("")}>×</button><p className="kicker">CALENDAR NOTE</p><h3>{calendarDate} {t.reminder}</h3><div className="quick-tags">{CALENDAR_TAGS.map(tag=><button key={tag} className={calendarTag===tag?"active":""} onClick={()=>setCalendarTag(tag)}>{calendarTagLabel(tag)}</button>)}</div><textarea value={calendarText} onChange={e=>setCalendarText(e.target.value)} placeholder={t.calendarPlaceholder} autoFocus/><div className="editor-actions"><button className="delete-note" onClick={()=>{setCalendarText("");setCalendarNotes(old=>{const next={...old};delete next[calendarDate];return next});setCalendarDate("")}}>{t.deleteNote}</button><button className="save-note" onClick={saveCalendarNote}>{t.saveReminder}</button></div></section></div>}

    <button className={`assistant-launcher ${assistantOpen?"open":""} ${compare.length?"compare-active":""}`} onClick={()=>setAssistantOpen(v=>!v)} aria-label="打开坤械助手"><img src="./kun-mech-assistant-v2.png" alt="坤械助手"/><span><b>{en?"KunME Assistant":"坤械助手"}</b><small>{en?"Ask me anything":"问我申请问题"}</small></span></button>
    {assistantOpen&&<section className={`assistant-panel ${compare.length?"compare-active":""}`} aria-label="坤械助手聊天窗口"><header><img src="./kun-mech-assistant-v2.png" alt=""/><div><b>{en?"KunME Assistant":"坤械助手"}</b><span>{en?"Your mechanical master's application companion":"机械硕士申请陪伴助手"}</span></div><button onClick={()=>setAssistantOpen(false)}>×</button></header><div className="assistant-messages">{messages.map((m,i)=><div key={i} className={`assistant-message ${m.role}`}><p>{m.text}</p>{m.source&&<a href={m.source} target="_blank" rel="noreferrer">{en?"Open official page":"查看官方页面"} ↗</a>}</div>)}</div><div className="assistant-suggestions">{(en?["Today's plan","Material check","School advice","Budget analysis","HKUST directions"]:["今日计划","材料检查","选校建议","预算分析","港科大有哪些方向"]).map(q=><button key={q} onClick={()=>sendAssistantQuestion(q)}>{q}</button>)}</div><form onSubmit={e=>{e.preventDefault();askAssistant()}}><input value={assistantQuery} onChange={e=>setAssistantQuery(e.target.value)} placeholder={en?"Ask about schools, materials, budget or planning…":"问学校、材料、预算或申请安排…"} autoFocus/><button type="submit">{en?"Send":"发送"}</button></form><small className="assistant-note">{en?"Answers use this workspace; verify important details on official sites.":"回答结合当前网站与个人进度，重要信息请以官网为准。"}</small></section>}

    {toast&&<div className="interaction-toast" role="status">{toast}</div>}

    {compareOpen&&<div className="compare-overlay" onClick={()=>setCompareOpen(false)}><section className="compare-modal" onClick={e=>e.stopPropagation()}><button className="course-close" onClick={()=>setCompareOpen(false)}>×</button><p className="kicker">SCHOOL COMPARISON</p><h2>学校对比</h2><div className="compare-table"><div className="compare-labels"><b>项目</b><span>综合排名</span><span>申请费</span><span>学费</span><span>生活费</span><span>截止日期</span><span>位置</span><span>研究优势</span><span>官网</span></div>{compare.map(id=>{const p=PROGRAM_BY_ID.get(id);if(!p)return null;return <div className="compare-column" key={id}><b>{SCHOOL_NAMES[p.school]||p.school}</b><span>#{p.rank}</span><span>{APP_FEE_BY_REGION[programRegion(p)]}</span><span>{costFor(p.school).tuition}</span><span>{costFor(p.school).shared}</span><span>{dateLabel(p.deadline)}</span><span>{programLocation(p)}</span><span>{p.tracks.map(t=>t.name).join(" · ")}</span><a href={p.source} target="_blank" rel="noreferrer">官网 ↗</a></div>})}</div></section></div>}
    {!!compare.length && <div className="compare-bar"><span>已选择 {compare.length}/3 个项目</span>{compare.map(id=>{const program=PROGRAM_BY_ID.get(id);return <b key={id}>{program ? SCHOOL_NAMES[program.school] || program.school.split(" ")[0] : id} <button onClick={()=>toggleCompare(id)}>×</button></b>})}<button className="compare-now" disabled={compare.length<2} onClick={()=>setCompareOpen(true)}>对比 {compare.length} 所学校</button></div>}
  </main>
}
