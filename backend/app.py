"""Intellectus: hybrid analytics over the supplied police case database."""
from __future__ import annotations

import json, math, os, re, sqlite3, uuid
from contextlib import contextmanager
from pathlib import Path
from typing import Any

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

ROOT = Path(__file__).parent
load_dotenv(ROOT / '.env')
SOURCE_DB = ROOT / "crime_analytics.sqlite3"
INDEX_DB = ROOT / "analytics_index.sqlite3"  # derived index; source database is never modified
# Built assets of the React (Vite) frontend live in a sibling project; this is only ever
# read for static serving and never affects any retrieval/analytics logic below.
FRONTEND_DIST = ROOT.parent / "frontend" / "dist"
app = FastAPI(title="Intellectus Crime Analytics API")
# Needed so the Vite dev server (a different origin/port during development) can call
# these APIs directly; harmless in production since the frontend is served same-origin.
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=False, allow_methods=["*"], allow_headers=["*"])
app.mount("/static", StaticFiles(directory=ROOT / "static"), name="static")  # legacy minimal test UI, kept for reference
if (FRONTEND_DIST / "assets").exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="frontend-assets")
CONVERSATIONS: dict[str, dict[str, Any]] = {}

@contextmanager
def db():
    con = sqlite3.connect(INDEX_DB); con.row_factory = sqlite3.Row
    try:
        yield con
        con.commit()
    except Exception:
        con.rollback()
        raise
    finally: con.close()

def text_vector(text: str) -> dict[str, float]:
    tokens = re.findall(r"[a-z0-9]{3,}", text.lower())
    return {token: tokens.count(token) for token in set(tokens)}

def cosine(a: dict[str, float], b: dict[str, float]) -> float:
    dot = sum(value * b.get(key, 0) for key, value in a.items())
    return dot / (math.sqrt(sum(x*x for x in a.values())) * math.sqrt(sum(x*x for x in b.values())) or 1)

def initialise() -> None:
    """Materialize an index from actual source records, including a local lexical vector."""
    if not SOURCE_DB.exists(): raise RuntimeError(f"Source database missing: {SOURCE_DB}")
    with sqlite3.connect(SOURCE_DB) as source, db() as con:
        source.row_factory = sqlite3.Row
        con.executescript("""
        DROP TABLE IF EXISTS fir_records; DROP TABLE IF EXISTS criminals; DROP TABLE IF EXISTS graph_edges;
        CREATE TABLE criminals (accused_id TEXT PRIMARY KEY, full_name TEXT, aliases TEXT, age TEXT, gender TEXT, known_gang_affiliation TEXT, past_offenses TEXT);
        CREATE TABLE fir_records (fir_id TEXT PRIMARY KEY, source_case_id TEXT, incident_date TEXT, district TEXT, police_station TEXT, crime_code TEXT, crime_group TEXT, case_summary TEXT, summary_vector TEXT, accused_id TEXT, extracted_entities TEXT, case_status TEXT, officer_notes TEXT);
        CREATE TABLE graph_edges (source_id TEXT, relation TEXT, target_id TEXT, target_label TEXT);
        CREATE INDEX idx_fir_district ON fir_records(district); CREATE INDEX idx_fir_crime ON fir_records(crime_code);
        CREATE INDEX idx_graph_relation ON graph_edges(relation, target_label);
        """)
        people = source.execute("""SELECT a.AccusedMasterID, a.AccusedName, a.AgeYear, a.GenderID, a.PersonID,
            GROUP_CONCAT(DISTINCT cs.CrimeHeadName) AS offenses
            FROM Accused a LEFT JOIN CaseMaster cm ON a.CaseMasterID=cm.CaseMasterID
            LEFT JOIN CrimeSubHead cs ON cm.CrimeMinorHeadID=cs.CrimeSubHeadID GROUP BY a.AccusedMasterID""").fetchall()
        con.executemany("INSERT INTO criminals VALUES (?,?,?,?,?,?,?)", [(f"ACC-{r['AccusedMasterID']}", r['AccusedName'] or 'Unknown', r['PersonID'] or 'Not recorded', r['AgeYear'] or 'Not recorded', r['GenderID'] or 'Not recorded', 'Not recorded in source data', r['offenses'] or 'No linked offense recorded') for r in people])
        cases = source.execute("""SELECT cm.CaseMasterID, cm.CaseNo, cm.IncidentFromDate, cm.CrimeRegisteredDate,
             cm.BriefFacts, u.UnitName, d.DistrictName, ch.CrimeGroupName, cs.CrimeHeadName, st.CaseStatusName,
             GROUP_CONCAT(DISTINCT a.AccusedMasterID) accused_ids, GROUP_CONCAT(DISTINCT a.AccusedName) accused_names
             FROM CaseMaster cm
             LEFT JOIN Unit u ON cm.PoliceStationID=u.UnitID LEFT JOIN District d ON u.DistrictID=d.DistrictID
             LEFT JOIN CrimeHead ch ON cm.CrimeMajorHeadID=ch.CrimeHeadID LEFT JOIN CrimeSubHead cs ON cm.CrimeMinorHeadID=cs.CrimeSubHeadID
             LEFT JOIN CaseStatusMaster st ON cm.CaseStatusID=st.CaseStatusID LEFT JOIN Accused a ON a.CaseMasterID=cm.CaseMasterID
             GROUP BY cm.CaseMasterID""").fetchall()
        values=[]
        for r in cases:
            fir_id=f"FIR-{r['CaseNo'] or r['CaseMasterID']}"; summary=r['BriefFacts'] or 'No brief facts recorded.'
            primary=(r['accused_ids'] or '').split(',')[0]; accused_id=f"ACC-{primary}" if primary else None
            entities={"suspects": (r['accused_names'] or '').split(',') if r['accused_names'] else [], "police_station": r['UnitName'] or 'Not recorded'}
            values.append((fir_id, r['CaseMasterID'], r['IncidentFromDate'] or r['CrimeRegisteredDate'] or 'Not recorded', r['DistrictName'] or 'Not recorded', r['UnitName'] or 'Not recorded', r['CrimeHeadName'] or 'Unclassified', r['CrimeGroupName'] or 'Unclassified', summary, json.dumps(text_vector(' '.join(str(x or '') for x in r))), accused_id, json.dumps(entities), r['CaseStatusName'] or 'Not recorded', f"Source case ID: {r['CaseMasterID']}"))
        con.executemany("INSERT INTO fir_records VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)", values)
        edges=[]
        for row in values:
            edges.extend([(row[0], 'IN_DISTRICT', f"DISTRICT:{row[3]}", row[3]), (row[0], 'HAS_CRIME', f"CRIME:{row[5]}", row[5])])
        for accused in source.execute('SELECT a.CaseMasterID, cm.CaseNo, a.AccusedName FROM Accused a JOIN CaseMaster cm ON a.CaseMasterID=cm.CaseMasterID'):
            edges.append((f"FIR-{accused['CaseNo'] or accused['CaseMasterID']}", 'INVOLVES_PERSON', f"PERSON:{accused['AccusedName'].lower()}", accused['AccusedName']))
        con.executemany('INSERT INTO graph_edges VALUES (?,?,?,?)',edges)

class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None

def citations(row: sqlite3.Row, include_people: bool = False) -> list[dict[str, str]]:
    items=[{"type":"FIR", "id":row['fir_id'], "label":f"{row['fir_id']} ({row['crime_code']})"}]
    if include_people:
        with sqlite3.connect(SOURCE_DB) as source:
            for accused_id, name in source.execute('SELECT AccusedMasterID, AccusedName FROM Accused WHERE CaseMasterID=?',(row['source_case_id'],)):
                items.append({"type":"CRIMINAL", "id":f"ACC-{accused_id}", "label":f"Profile: {name}"})
    return items

def route(question: str) -> str:
    q=question.lower()
    if any(term in q for term in ('count','how many','total','number of','list all')): return 'Strict SQL'
    if any(term in q for term in ('similar','pattern','modus','method','narrative','summary','like')): return 'Hybrid SQL + Vector'
    return 'Semantic Vector RAG'

def heuristic_intent(question: str) -> dict[str, str]:
    """Safe fallback when no LLM key is present."""
    q=question.lower()
    district=re.search(r"(?:district\s+)?(bangalore urban|mysuru|belagavi|hubli[- ]dharwad|mangaluru|bengaluru rural)",q)
    crime=next((key for key in ('theft','burglary','robbery','fraud','phishing','drug','murder','accident','cyber','tax') if key in q),'')
    return {'route':route(question),'district':district.group(1) if district else '', 'crime':crime, 'source':'heuristic'}

ER_METADATA = """Entity relationships available for retrieval:
CaseMaster(CaseMasterID, CaseNo, CrimeRegisteredDate, IncidentFromDate, BriefFacts, PoliceStationID, CrimeMajorHeadID, CrimeMinorHeadID, CaseStatusID) is the central case entity.
Accused(CaseMasterID, AccusedMasterID, AccusedName, AgeYear, GenderID) links people to cases; there is no persistent person key across cases, so identical names are only name-matched, not proven identities.
CrimeSubHead(CrimeSubHeadID, CrimeHeadName) and CrimeHead(CrimeHeadID, CrimeGroupName) classify cases.
CaseMaster.PoliceStationID -> Unit(UnitID, UnitName, DistrictID) -> District(DistrictID, DistrictName).
CaseMaster.CaseStatusID -> CaseStatusMaster(CaseStatusID, CaseStatusName).
Victim and ComplainantDetails link to cases by CaseMasterID. ArrestSurrender links cases and accused; Court resolves CourtID. ChargesheetDetails links cases by CaseMasterID.
Graph edges materialized from this ER model: FIR -> person name, FIR -> district, FIR -> crime category. Use graph retrieval for repeat-name case networks, shared districts, or shared categories."""
INTENT_SYSTEM_PROMPT = """You are the intent router for an Indian police-record analytics system. Return only valid JSON with exactly these fields: route, district, crime, semantic_query, subqueries. route must be one of Strict SQL, Semantic Vector RAG, Hybrid SQL + Vector. A request naming a FIR-ID or profile ID is always Semantic Vector RAG so the complete record is retrieved. Use Strict SQL only for counts, totals, lists, or explicit metadata filters. Use Hybrid SQL + Vector when both a metadata filter and narrative/pattern similarity are requested. district must be one of Bangalore Urban, Mysuru, Belagavi, Hubli-Dharwad, Mangaluru, Bengaluru Rural, or an empty string. crime is a short user-facing category phrase or empty string. semantic_query is the meaningful narrative/pattern part. subqueries is a list of zero to three short additional evidence questions needed for a thorough answer. Never include SQL, explanations, markdown, or extra keys.""" + "\n\n" + ER_METADATA

async def parse_intent(question: str, history: list[dict[str,str]] | None = None) -> dict[str, str]:
    key=os.getenv('OPENROUTER_API_KEY')
    fallback=heuristic_intent(question)
    if not key: return fallback
    recent='\n'.join(f"{item['role']}: {item['content']}" for item in (history or [])[-6:])
    payload={'model':os.getenv('OPENROUTER_MODEL','openai/gpt-4o-mini'),'messages':[{'role':'system','content':INTENT_SYSTEM_PROMPT},{'role':'user','content':f"Recent conversation context:\n{recent or '(none)'}\n\nCurrent question: {question}"}],'temperature':0,'response_format':{'type':'json_object'}}
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response=await client.post('https://openrouter.ai/api/v1/chat/completions',headers={'Authorization':f'Bearer {key}','HTTP-Referer':'http://localhost:8000'},json=payload); response.raise_for_status()
            intent=json.loads(response.json()['choices'][0]['message']['content'])
        if intent.get('route') not in {'Strict SQL','Semantic Vector RAG','Hybrid SQL + Vector'}: return fallback
        return {'route':intent['route'], 'district':str(intent.get('district','')), 'crime':str(intent.get('crime','')), 'semantic_query':str(intent.get('semantic_query',question)), 'subqueries':[str(item) for item in intent.get('subqueries',[])[:3]] if isinstance(intent.get('subqueries',[]),list) else [], 'source':'llm'}
    except (httpx.HTTPError, KeyError, IndexError, json.JSONDecodeError, TypeError): return fallback

SOURCE_TABLES = {'Accused','Act','ActSectionAssociation','ArrestSurrender','CaseCategory','CaseMaster','CaseStatusMaster','CasteMaster','ChargesheetDetails','ComplainantDetails','Court','CrimeHead','CrimeHeadActSection','CrimeSubHead','Designation','District','Employee','GravityOffence','OccupationMaster','Rank','ReligionMaster','Section','State','Unit','UnitType','Victim'}

def source_schema_metadata() -> str:
    with sqlite3.connect(SOURCE_DB) as source:
        return '\n'.join(f"{table}({', '.join(column[1] for column in source.execute(f'PRAGMA table_info([{table}])'))})" for table in sorted(SOURCE_TABLES))

SQL_PLANNER_PROMPT = """Generate one SQLite query plan for a strict crime-record question. Return JSON only: {"sql":"...","params":[...],"title":"..."}.
You have read-only access to every table in crime_analytics.sqlite3. The complete table/column catalog is provided after these instructions.
Use parameter placeholders (?) for every user value. Produce exactly one SELECT or WITH...SELECT statement. Never use semicolons, comments, PRAGMA, schema tables, writes, DDL, ATTACH/DETACH, or more than 12 parameters. Limit detail rows to 20. Use COUNT/GROUP BY for aggregates. """ + "\n\n" + ER_METADATA

def safe_sql(sql: str, params: Any) -> bool:
    normalized=' '.join(sql.lower().split())
    blocked=(';', '--', '/*', 'pragma', 'attach', 'detach', 'insert', 'update', 'delete', 'drop', 'alter', 'create', 'replace', 'vacuum', 'sqlite_master')
    tables=re.findall(r'\b(?:from|join)\s+\[?([a-z_][a-z0-9_]*)\]?',normalized)
    return (normalized.startswith('select ') or normalized.startswith('with ')) and len(sql)<3000 and not any(term in normalized for term in blocked) and bool(tables) and {table.lower() for table in tables}.issubset({table.lower() for table in SOURCE_TABLES}) and isinstance(params,list) and len(params)<=12

async def llm_sql_result(question: str) -> dict[str, Any] | None:
    key=os.getenv('OPENROUTER_API_KEY')
    if not key: return None
    try:
        async with httpx.AsyncClient(timeout=18) as client:
            response=await client.post('https://openrouter.ai/api/v1/chat/completions',headers={'Authorization':f'Bearer {key}','HTTP-Referer':'http://localhost:8000'},json={'model':os.getenv('OPENROUTER_MODEL','openai/gpt-4o-mini'),'messages':[{'role':'system','content':SQL_PLANNER_PROMPT+'\n\nFull source schema:\n'+source_schema_metadata()},{'role':'user','content':question}],'temperature':0,'response_format':{'type':'json_object'}}); response.raise_for_status()
        plan=json.loads(response.json()['choices'][0]['message']['content']); sql=str(plan['sql']); params=plan.get('params',[])
        if not safe_sql(sql,params): return None
        with sqlite3.connect(f"file:{SOURCE_DB.as_posix()}?mode=ro", uri=True) as con:
            con.row_factory=sqlite3.Row
            denied={sqlite3.SQLITE_INSERT,sqlite3.SQLITE_UPDATE,sqlite3.SQLITE_DELETE,sqlite3.SQLITE_ATTACH,sqlite3.SQLITE_DETACH,sqlite3.SQLITE_ALTER_TABLE,sqlite3.SQLITE_DROP_TABLE}
            con.set_authorizer(lambda action,*args: sqlite3.SQLITE_DENY if action in denied else sqlite3.SQLITE_OK)
            rows=con.execute(sql,params).fetchall(); con.set_authorizer(None)
        if not rows: return {'answer':f"## {plan.get('title','Exact result')}\nNo records match the requested filters.",'citations':[],'route':'Guarded LLM SQL','evidence':{'sql':sql,'rows':[],'aggregate':{}}}
        headers=list(rows[0].keys()); lines=[' | '.join(headers),' | '.join('---' for _ in headers)]+[' | '.join(str(row[key]) for key in headers) for row in rows]
        cites=[{'type':'FIR','id':row['fir_id'],'label':f"{row['fir_id']} ({row['crime_code'] if 'crime_code' in row.keys() else 'Case'})"} for row in rows if 'fir_id' in row.keys()]
        cites.extend({'type':'FIR','id':f"FIR-{row['CaseNo']}",'label':f"FIR-{row['CaseNo']}"} for row in rows if 'CaseNo' in row.keys())
        cites=cites[:10]
        return {'answer':f"## {plan.get('title','Exact result')}\n\n"+'\n'.join(lines),'citations':cites,'route':'Guarded LLM SQL','evidence':{'sql':sql,'rows':[dict(row) for row in rows],'aggregate':{}}}
    except (httpx.HTTPError, KeyError, IndexError, json.JSONDecodeError, sqlite3.Error, TypeError): return None

def local_agent(question: str, intent: dict[str,str]) -> dict[str, Any]:
    q=question.lower(); selected_route=intent['route']
    with db() as con:
        rows=con.execute('SELECT f.*, c.full_name FROM fir_records f LEFT JOIN criminals c ON f.accused_id=c.accused_id').fetchall()
    fir_match=re.search(r'fir[-\s]?(\d+)',q,re.I)
    if fir_match:
        requested=f"FIR-{fir_match.group(1)}"; record=next((row for row in rows if row['fir_id'].upper()==requested.upper()),None)
        if record:
            answer=f"**{record['fir_id']}** — {record['crime_code']} in {record['district']} on {record['incident_date']}. Status: {record['case_status']}. Police station: {record['police_station']}. Brief facts: {record['case_summary']}"
            return {'answer':answer,'citations':citations(record),'route':'Direct record retrieval','evidence':{'records':[dict(record)],'aggregate':{}}}
        return {'answer':f"No FIR with ID **{requested}** exists in the supplied source database.", 'citations':[], 'route':'Direct record retrieval','evidence':{'records':[],'aggregate':{}}}
    if any(term in q for term in ('multiple cases','repeat offender','repeat offenders','repeat criminal','criminals with multiple')):
        with db() as con:
            people=con.execute("""SELECT target_label full_name, COUNT(DISTINCT source_id) case_count, GROUP_CONCAT(DISTINCT source_id) fir_ids
                FROM graph_edges WHERE relation='INVOLVES_PERSON' GROUP BY target_id HAVING COUNT(DISTINCT source_id)>1 ORDER BY case_count DESC, full_name LIMIT 10""").fetchall()
            citations_out=[]; blocks=[]; evidence=[]
            for person in people:
                fir_ids=person['fir_ids'].split(',')
                cases=con.execute(f"SELECT fir_id, incident_date, district, crime_code, case_status FROM fir_records WHERE fir_id IN ({','.join('?' for _ in fir_ids)}) ORDER BY incident_date DESC",fir_ids).fetchall()
                profile=con.execute('SELECT accused_id FROM criminals WHERE full_name=? LIMIT 1',(person['full_name'],)).fetchone()
                blocks.append(f"### {person['full_name']}\n**{person['case_count']} linked cases**\n"+'\n'.join(f"- {case['fir_id']} · {case['incident_date']} · {case['crime_code']} · {case['district']} · {case['case_status']}" for case in cases))
                if profile: citations_out.append({'type':'CRIMINAL','id':profile['accused_id'],'label':f"Profile: {person['full_name']}"})
                for case in cases:
                    citations_out.append({'type':'FIR','id':case['fir_id'],'label':f"{case['fir_id']} ({case['crime_code']})"})
                evidence.append({'person':person['full_name'],'cases':[dict(case) for case in cases]})
        answer=("## Repeat-case network\n"+'\n\n'.join(blocks) if blocks else "## Repeat-case network\nNo people have more than one name-matched case in the supplied database.")
        return {'answer':answer,'citations':citations_out,'route':'Graph RAG','evidence':{'graph_people':evidence,'aggregate':{'repeat_people':len(people)}}}
    district=intent.get('district','')
    district_match=re.search(r"(?:district\s+)?(bangalore urban|mysuru|belagavi|hubli[- ]dharwad|mangaluru|bengaluru rural)", district.lower() or q)
    if district_match:
        wanted=district_match.group(1).replace('-',' '); rows=[row for row in rows if wanted in row['district'].lower().replace('-',' ')]
    category_terms={'theft':'Theft','burglary':'Burglary','robbery':'Robbery','fraud':'Online Fraud','phishing':'Phishing','drug':'Drug Peddling','murder':'Murder','accident':'Fatal Accident','cyber':'Online Fraud','tax':'Tax Evasion','sexual harassment':'Sexual Harassment','domestic violence':'Domestic Violence','kidnapping':'Kidnapping of Women','identity theft':'Identity Theft','hacking':'Hacking','cheating':'Cheating','rape':'Rape'}
    crime_text=intent.get('crime','').lower() or q
    category=next((value for key,value in category_terms.items() if key in crime_text),None)
    if not category:
        available=sorted({row['crime_code'] for row in rows},key=len,reverse=True)
        category=next((value for value in available if value.lower() in crime_text),None)
    if category: rows=[row for row in rows if category.lower() in row['crime_code'].lower()]
    if selected_route=='Strict SQL':
        return {'answer':'I cannot verify this relational request because no safe LLM SQL plan was available. Configure OpenRouter or rephrase the query with a specific FIR, district, category, or date range.','citations':[],'route':'SQL plan unavailable','evidence':{'records':[],'aggregate':{}},'needs_clarification':True}
    vector=text_vector(intent.get('semantic_query') or question)
    scored=sorted(((cosine(vector,json.loads(row['summary_vector'])),row) for row in rows),key=lambda item:item[0],reverse=True)
    matches=[row for score,row in scored if score>0][:5]
    if not matches and (category or district_match): matches=rows[:5]
    if not matches:
        return {'answer':'I don’t have enough verified evidence to answer that reliably. Could you specify a FIR ID, crime category, district, date range, or a distinctive phrase from the case summary?', 'citations':[], 'route':selected_route,'evidence':{'records':[],'aggregate':{}},'needs_clarification':True}
    lines='\n'.join(f"- **{row['fir_id']}** | {row['incident_date']} | {row['district']} | {row['crime_code']} — {row['case_summary']}" for row in matches)
    return {'answer':f"I found **{len(matches)}** relevant source record(s).\n\n{lines}", 'citations':[item for row in matches for item in citations(row)], 'route':selected_route,'evidence':{'records':[dict(row) for row in matches],'aggregate':{'total':len(matches)}}}

def graph_agent(question: str, intent: dict[str,str]) -> dict[str, Any] | None:
    """Evidence-only aggregate over materialized FIR→crime and FIR→district edges."""
    text=(question+' '+intent.get('crime','')).lower()
    if not any(term in text for term in ('district','total','count','how many')): return None
    with db() as con:
        crime_labels=[row['target_label'] for row in con.execute("SELECT DISTINCT target_label FROM graph_edges WHERE relation='HAS_CRIME'")]
        matched_labels=[label for label in crime_labels if label.lower() in text or any(word in label.lower() for word in re.findall(r'[a-z]{4,}',text))]
        if not matched_labels: return None
        placeholders=','.join('?' for _ in matched_labels)
        fir_ids=[row['source_id'] for row in con.execute(f"SELECT DISTINCT source_id FROM graph_edges WHERE relation='HAS_CRIME' AND target_label IN ({placeholders})",matched_labels)]
        if not fir_ids: return None
        fir_slots=','.join('?' for _ in fir_ids)
        all_districts=[row['target_label'] for row in con.execute("SELECT DISTINCT target_label FROM graph_edges WHERE relation='IN_DISTRICT' ORDER BY target_label")]
        rows=con.execute(f"SELECT target_label district, COUNT(DISTINCT source_id) cases FROM graph_edges WHERE relation='IN_DISTRICT' AND source_id IN ({fir_slots}) GROUP BY target_label",fir_ids).fetchall()
        counts={row['district']:row['cases'] for row in rows}
        case_rows=con.execute(f"SELECT fir_id, crime_code FROM fir_records WHERE fir_id IN ({fir_slots}) ORDER BY incident_date DESC",fir_ids).fetchall()
    lines='\n'.join(f"- **{district}**: {counts.get(district,0)} case(s)" for district in all_districts)
    labels=', '.join(sorted(matched_labels))
    answer=f"## Graph-verified district distribution\nCrime categories matched: **{labels}**.\n\n{lines}\n\n**Total linked FIRs**: {len(fir_ids)}"
    cites=[{'type':'FIR','id':row['fir_id'],'label':f"{row['fir_id']} ({row['crime_code']})"} for row in case_rows[:10]]
    return {'answer':answer,'citations':cites,'route':'Graph RAG','evidence':{'graph_categories':matched_labels,'fir_ids':fir_ids,'district_counts':counts}}

AGENT_RETRIEVAL_PROMPT = """You are an investigative-planning agent. Return JSON only: {"investigation_goal":"","investigative_questions":[""],"route":"ANALYTICS|VECTOR|GRAPH|HYBRID","analytics":{"group_by":"district|police_station|crime_code|crime_group|case_status","rank":false,"limit":10},"vector_query":"","graph_label":"","filters":{"district":"","crime":"","person":""},"include_zero":false,"reason":""}.
Create a concise evidence-gathering plan before retrieving anything. The user may phrase a question indirectly; if it is answerable through the supplied ER schema, infer the relevant entities and relationships rather than refusing because no tool name or exact field was mentioned. Decompose the goal into up to three investigative_questions, then select the best supported route: ANALYTICS for counts, hotspots, trends, and rankings; VECTOR for narrative similarity; GRAPH for connections and networks; HYBRID when a pattern needs supporting case details. Use HYBRID by default for ambiguous but schema-related investigative questions. Ask for clarification only when no grounded entity, relationship, or analytical dimension can be inferred from the schema or conversation context. The backend is a read-only knowledge provider: it executes only the requested analytics, vector, and graph retrievals, then returns evidence for your final answer. Filters must contain only explicitly stated or context-resolved values. Never invent records or SQL. """ + "\n\n" + ER_METADATA

async def llm_retrieval(question: str, history: list[dict[str,str]]) -> dict[str, Any] | None:
    key=os.getenv('OPENROUTER_API_KEY')
    if not key: return None
    try:
        recent='\n'.join(f"{item['role']}: {item['content']}" for item in history[-6:])
        async with httpx.AsyncClient(timeout=18) as client:
            response=await client.post('https://openrouter.ai/api/v1/chat/completions',headers={'Authorization':f'Bearer {key}','HTTP-Referer':'http://localhost:8000'},json={'model':os.getenv('OPENROUTER_MODEL','openai/gpt-4o-mini'),'messages':[{'role':'system','content':AGENT_RETRIEVAL_PROMPT},{'role':'user','content':f"Context:\n{recent}\n\nQuestion: {question}"}],'temperature':0,'response_format':{'type':'json_object'}}); response.raise_for_status()
        plan=response.json()['choices'][0]['message']['content']; plan=json.loads(plan)
        if plan.get('route') not in {'ANALYTICS','VECTOR','GRAPH','HYBRID'}: return None
        evidence={}; citations_out=[]; filters=plan.get('filters',{}) if isinstance(plan.get('filters',{}),dict) else {}
        if plan['route'] in {'ANALYTICS','HYBRID'}:
            analytics=plan.get('analytics',{}) if isinstance(plan.get('analytics',{}),dict) else {}
            group_by=str(analytics.get('group_by','district'))
            allowed_groups={'district','police_station','crime_code','crime_group','case_status'}
            if group_by not in allowed_groups: group_by='district'
            with db() as con: records=con.execute('SELECT * FROM fir_records').fetchall()
            if filters.get('district'): records=[row for row in records if str(filters['district']).lower() in row['district'].lower()]
            if filters.get('crime'): records=[row for row in records if str(filters['crime']).lower() in row['crime_code'].lower()]
            buckets={}
            for row in records: buckets[row[group_by]]=buckets.get(row[group_by],0)+1
            ranked=sorted(({'value':value,'cases':count} for value,count in buckets.items()),key=lambda item:item['cases'],reverse=True)[:max(1,min(int(analytics.get('limit',10)),20))]
            evidence['analytics']={'goal':plan.get('investigation_goal',''), 'group_by':group_by, 'total_cases':len(records), 'breakdown':ranked}
        if plan['route'] in {'VECTOR','HYBRID'}:
            query=text_vector(str(plan.get('vector_query') or question))
            with db() as con: records=con.execute('SELECT * FROM fir_records').fetchall()
            if filters.get('district'): records=[row for row in records if str(filters['district']).lower() in row['district'].lower()]
            if filters.get('crime'): records=[row for row in records if str(filters['crime']).lower() in row['crime_code'].lower()]
            ranked=sorted(((cosine(query,json.loads(row['summary_vector'])),row) for row in records),key=lambda item:item[0],reverse=True)
            matches=[row for score,row in ranked if score>0][:5]
            evidence['vector_records']=[dict(row) for row in matches]
            citations_out.extend({'type':'FIR','id':row['fir_id'],'label':f"{row['fir_id']} ({row['crime_code']})"} for row in matches)
        if plan['route'] in {'GRAPH','HYBRID'} and plan.get('graph_label'):
            label=f"%{plan['graph_label']}%"
            with db() as con:
                firs=[row['source_id'] for row in con.execute("SELECT DISTINCT source_id FROM graph_edges WHERE target_label LIKE ?",(label,))]
                if filters.get('district'):
                    district_firs={row['source_id'] for row in con.execute("SELECT source_id FROM graph_edges WHERE relation='IN_DISTRICT' AND lower(target_label)=lower(?)",(str(filters['district']),))}
                    firs=[fir_id for fir_id in firs if fir_id in district_firs]
                if filters.get('person'):
                    person_firs={row['source_id'] for row in con.execute("SELECT source_id FROM graph_edges WHERE relation='INVOLVES_PERSON' AND lower(target_label)=lower(?)",(str(filters['person']),))}
                    firs=[fir_id for fir_id in firs if fir_id in person_firs]
                if firs:
                    slots=','.join('?' for _ in firs); graph_rows=con.execute(f"SELECT target_label district, COUNT(DISTINCT source_id) cases FROM graph_edges WHERE relation='IN_DISTRICT' AND source_id IN ({slots}) GROUP BY target_label",firs).fetchall()
                    evidence['graph_distribution']=[dict(row) for row in graph_rows]
                    if plan.get('include_zero'):
                        all_districts=[row['target_label'] for row in con.execute("SELECT DISTINCT target_label FROM graph_edges WHERE relation='IN_DISTRICT'")]
                        counts={row['district']:row['cases'] for row in graph_rows}; evidence['graph_distribution']=[{'district':name,'cases':counts.get(name,0)} for name in all_districts]
                    case_rows=con.execute(f"SELECT fir_id, incident_date, district, crime_code, case_status, case_summary FROM fir_records WHERE fir_id IN ({slots})",firs).fetchall()
                    evidence['graph_cases']=[dict(row) for row in case_rows]
                    citations_out.extend({'type':'FIR','id':row['fir_id'],'label':f"{row['fir_id']} ({row['crime_code']})"} for row in case_rows)
        if not evidence: return None
        unique={item['id']:item for item in citations_out}
        return {'answer':'Verified retrieval completed.','citations':list(unique.values())[:10],'route':f"{plan['route']} investigation",'evidence':evidence,'investigation_plan':{'goal':plan.get('investigation_goal',''),'questions':plan.get('investigative_questions',[])[:3] if isinstance(plan.get('investigative_questions',[]),list) else [],'route':plan['route'],'reason':plan.get('reason','')}}
    except (httpx.HTTPError, KeyError, IndexError, json.JSONDecodeError, sqlite3.Error, TypeError): return None

ANSWER_SYSTEM_PROMPT = """You are Intellectus, an investigation helper. Turn the verified evidence into an operational answer: state the main finding, explain why it matters, identify concrete leads or comparison points supported by the evidence, and propose a next investigative question when useful. Use only supplied evidence; never invent people, events, totals, connections, or legal conclusions. When evidence is insufficient, ask one precise follow-up question. Do not write citations in prose because the UI renders verified citations separately."""

async def openrouter_synthesize(question: str, result: dict[str, Any], supplementary: list[dict[str, Any]], history: list[dict[str,str]]) -> str | None:
    key=os.getenv('OPENROUTER_API_KEY')
    if not key or result.get('needs_clarification'): return None
    evidence={'investigation_plan':result.get('investigation_plan',{}),'primary':result.get('evidence',{}),'supplementary':[item.get('evidence',{}) for item in supplementary]}
    recent='\n'.join(f"{item['role']}: {item['content']}" for item in history[-6:])
    payload={'model':os.getenv('OPENROUTER_MODEL','openai/gpt-4o-mini'),'messages':[{'role':'system','content':ANSWER_SYSTEM_PROMPT+' If the evidence is insufficient, ask one precise follow-up question; never infer or fabricate facts.'},{'role':'user','content':f'Recent conversation context:\n{recent or "(none)"}\n\nInvestigator question: {question}\n\nVerified evidence:\n{json.dumps(evidence,default=str)}'}],'temperature':0.1}
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            response=await client.post('https://openrouter.ai/api/v1/chat/completions',headers={'Authorization':f'Bearer {key}','HTTP-Referer':'http://localhost:8000'},json=payload); response.raise_for_status()
            return response.json()['choices'][0]['message']['content']
    except (httpx.HTTPError, KeyError, IndexError): return None

@app.on_event('startup')
def startup(): initialise()

@app.get('/')
def index():
    dist_index = FRONTEND_DIST / 'index.html'
    if dist_index.exists(): return FileResponse(dist_index)
    return FileResponse(ROOT/'static'/'index.html')

@app.get('/{full_path:path}')
def spa_fallback(full_path: str):
    """Serve any other top-level asset from the built frontend (favicon, manifest, etc.),
    or fall back to index.html for client-side routes. Never matches /api/* or /static/*
    because FastAPI resolves those explicit routes/mounts first."""
    dist_index = FRONTEND_DIST / 'index.html'
    if not dist_index.exists(): raise HTTPException(404, 'Frontend build not found')
    candidate = FRONTEND_DIST / full_path
    if candidate.is_file(): return FileResponse(candidate)
    return FileResponse(dist_index)

@app.get('/api/overview')
def overview():
    with db() as con:
        cases=con.execute('SELECT count(*) FROM fir_records').fetchone()[0]; people=con.execute('SELECT count(*) FROM criminals').fetchone()[0]
        recent=con.execute('SELECT fir_id, crime_code, district FROM fir_records ORDER BY incident_date DESC LIMIT 5').fetchall()
    return {'cases':cases,'criminals':people,'recent':[dict(r) for r in recent], 'source':'crime_analytics.sqlite3'}

@app.post('/api/chat')
async def chat(request: ChatRequest):
    session_id=request.session_id or str(uuid.uuid4())
    state=CONVERSATIONS.setdefault(session_id, {'history':[], 'last_intent':{}, 'last_fir_id':''})
    history=state['history']
    intent=await parse_intent(request.message,history)
    follow_up=bool(re.search(r'\b(it|that|those|them|previous|same|also|what about|more details|tell me more)\b',request.message.lower()))
    if follow_up and state['last_intent']:
        previous=state['last_intent']
        if not intent.get('district'): intent['district']=previous.get('district','')
        if not intent.get('crime'): intent['crime']=previous.get('crime','')
        if not re.search(r'fir[-\s]?\d+',request.message,re.I) and state['last_fir_id'] and any(term in request.message.lower() for term in ('it','that','more details','tell me more')):
            request.message=f"{request.message} about {state['last_fir_id']}"
    # The LLM planner selects and executes Vector RAG, Graph RAG, or a hybrid evidence plan.
    result=await llm_retrieval(request.message,history)
    if result is None:
        result={'answer':'I could not obtain a verified retrieval plan. Please ensure OpenRouter is configured, then rephrase with a crime, district, FIR ID, person, or time range.','citations':[],'route':'Retrieval plan unavailable','evidence':{},'needs_clarification':True}
    subqueries=intent.get('subqueries',[])[:3] if isinstance(intent.get('subqueries',[]),list) else []
    supplementary=[]
    for subquery in subqueries:
        extra=await llm_retrieval(subquery,history)
        if extra: supplementary.append(extra)
    for extra in supplementary: result['citations'].extend(extra['citations'])
    # Exact aggregates are rendered directly; an LLM must never paraphrase or alter SQL counts.
    synthesis=None if result.get('needs_clarification') else await openrouter_synthesize(request.message,result,supplementary,history)
    if synthesis: result['answer']=synthesis
    result['intent_source']=intent['source']
    result['session_id']=session_id
    history.extend([{'role':'user','content':request.message},{'role':'assistant','content':result['answer']}])
    state['history']=history[-16:]
    state['last_intent']=intent
    fir_citations=[item['id'] for item in result['citations'] if item['type']=='FIR']
    if fir_citations: state['last_fir_id']=fir_citations[0]
    return result

@app.delete('/api/conversation/{session_id}')
def clear_conversation(session_id: str):
    CONVERSATIONS.pop(session_id,None)
    return {'cleared':True}

@app.get('/api/fir/{fir_id}')
def get_fir(fir_id:str):
    with db() as con: row=con.execute('SELECT f.*, c.full_name FROM fir_records f LEFT JOIN criminals c ON f.accused_id=c.accused_id WHERE f.fir_id=?',(fir_id,)).fetchone()
    if not row: raise HTTPException(404,'FIR not found')
    result=dict(row); result.pop('summary_vector'); result.pop('extracted_entities',None)
    with sqlite3.connect(SOURCE_DB) as source:
        source.row_factory=sqlite3.Row; case_id=result['source_case_id']
        gender="CASE GenderID WHEN '1' THEN 'Male' WHEN '2' THEN 'Female' WHEN '3' THEN 'Transgender' ELSE 'Not recorded' END"
        result['accused']=[dict(r) for r in source.execute("SELECT 'ACC-' || AccusedMasterID accused_id, AccusedName, AgeYear, CASE GenderID WHEN 'M' THEN 'Male' WHEN 'F' THEN 'Female' WHEN 'T' THEN 'Transgender' ELSE 'Not recorded' END gender FROM Accused WHERE CaseMasterID=?",(case_id,))]
        result['victims']=[dict(r) for r in source.execute(f'SELECT VictimName, AgeYear, {gender} gender, VictimPolice FROM Victim WHERE CaseMasterID=?',(case_id,))]
        result['complainants']=[dict(r) for r in source.execute(f'SELECT ComplainantName, AgeYear, {gender} gender FROM ComplainantDetails WHERE CaseMasterID=?',(case_id,))]
        result['arrest_records']=[dict(r) for r in source.execute("""SELECT a.ArrestSurrenderDate, CASE a.ArrestSurrenderTypeID WHEN '1' THEN 'Arrest' WHEN '2' THEN 'Surrender' ELSE 'Unmapped source type' END arrest_type, COALESCE(c.CourtName,'Not recorded') court_name, COALESCE(d.DistrictName,'Not recorded') district_name, COALESCE(u.UnitName,'Not recorded') police_station FROM ArrestSurrender a LEFT JOIN Court c ON a.CourtID=c.CourtID LEFT JOIN District d ON a.ArrestSurrenderDistrictId=d.DistrictID LEFT JOIN Unit u ON a.PoliceStationID=u.UnitID WHERE a.CaseMasterID=?""",(case_id,))]
        result['chargesheets']=[dict(r) for r in source.execute("SELECT csdate, CASE cstype WHEN 'A' THEN 'Chargesheet type A' WHEN 'B' THEN 'Chargesheet type B' ELSE 'Source type not mapped' END chargesheet_type FROM ChargesheetDetails WHERE CaseMasterID=?",(case_id,))]
    return result

@app.get('/api/criminal/{accused_id}')
def get_criminal(accused_id:str):
    with db() as con:
        person=con.execute('SELECT * FROM criminals WHERE accused_id=?',(accused_id,)).fetchone()
    if not person: raise HTTPException(404,'Criminal profile not found')
    result=dict(person); source_id=accused_id.removeprefix('ACC-'); result.pop('aliases',None); result.pop('known_gang_affiliation',None)
    with sqlite3.connect(SOURCE_DB) as source:
        source.row_factory=sqlite3.Row
        name=source.execute('SELECT AccusedName FROM Accused WHERE AccusedMasterID=?',(source_id,)).fetchone()
        if not name: raise HTTPException(404,'Criminal profile not found in source database')
        result['identity_note']='Case history is grouped by exact source name because the supplied database has no persistent cross-case person identifier.'
        result['past_firs']=[dict(r) for r in source.execute("""SELECT 'FIR-' || cm.CaseNo fir_id, cm.CrimeRegisteredDate incident_date, cs.CrimeHeadName crime_code, d.DistrictName district, st.CaseStatusName case_status
          FROM Accused a JOIN CaseMaster cm ON a.CaseMasterID=cm.CaseMasterID LEFT JOIN CrimeSubHead cs ON cm.CrimeMinorHeadID=cs.CrimeSubHeadID LEFT JOIN Unit u ON cm.PoliceStationID=u.UnitID LEFT JOIN District d ON u.DistrictID=d.DistrictID LEFT JOIN CaseStatusMaster st ON cm.CaseStatusID=st.CaseStatusID WHERE a.AccusedName=? ORDER BY cm.CrimeRegisteredDate DESC""",(name['AccusedName'],))]
        result['repeat_case_count']=len(result['past_firs'])
        result['arrest_records']=[dict(r) for r in source.execute("""SELECT a.ArrestSurrenderDate, CASE a.ArrestSurrenderTypeID WHEN '1' THEN 'Arrest' WHEN '2' THEN 'Surrender' ELSE 'Unmapped source type' END arrest_type, COALESCE(c.CourtName,'Not recorded') court_name FROM ArrestSurrender a JOIN Accused x ON a.AccusedMasterID=x.AccusedMasterID LEFT JOIN Court c ON a.CourtID=c.CourtID WHERE x.AccusedName=?""",(name['AccusedName'],))]
    return result

@app.get('/api/search')
def search(q:str='', kind:str='ALL'):
    like=f'%{q}%'
    with db() as con:
        firs=con.execute("SELECT fir_id id, 'FIR' type, fir_id || ' · ' || crime_code || ' · ' || district label FROM fir_records WHERE fir_id LIKE ? OR crime_code LIKE ? OR district LIKE ? OR case_summary LIKE ? LIMIT 50",(like,like,like,like)).fetchall() if kind in ('ALL','FIR') else []
        people=con.execute("SELECT accused_id id, 'CRIMINAL' type, full_name label FROM criminals WHERE full_name LIKE ? OR aliases LIKE ? LIMIT 50",(like,like)).fetchall() if kind in ('ALL','CRIMINAL') else []
    return [dict(row) for row in [*firs,*people]]
