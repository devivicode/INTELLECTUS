"""
Police FIR System — Synthetic Data Generator
Karnataka Police Department
Based on the ER Diagram schema provided.

Generates realistic synthetic data for all tables with proper FK relationships.
Output: JSON files per table + combined SQL INSERT statements.

Usage:
    pip install faker  (recommended for richer names)
    python generate_fir_data.py

    OR without faker (uses built-in name lists):
    python generate_fir_data.py
"""

import random
import json
import os
import datetime
from collections import defaultdict

# ── Try to use Faker for richer data; fall back to built-in lists ──────────
try:
    from faker import Faker
    fake = Faker("en_IN")
    USE_FAKER = True
except ImportError:
    USE_FAKER = False

# ── Seed for reproducibility ───────────────────────────────────────────────
random.seed(42)

# ── Volume knobs — adjust to taste ────────────────────────────────────────
N_STATES        = 1          # Karnataka only
N_DISTRICTS     = 6
N_UNIT_TYPES    = 4
N_UNITS         = 20         # police stations
N_RANKS         = 8
N_DESIGNATIONS  = 6
N_EMPLOYEES     = 80
N_COURTS        = 10
N_CASE_CATS     = 4          # FIR, UDR, PAR, Zero FIR
N_GRAVITY       = 3
N_CRIME_HEADS   = 8
N_CRIME_SUBHEAD = 24
N_ACTS          = 6
N_SECTIONS      = 40
N_CRIMES        = 5          # sections per crime head
N_CASES         = 200
N_COMPLAINANTS  = 220        # slightly > cases (some have multiple)
N_VICTIMS       = 260
N_ACCUSED       = 280
N_ARRESTS       = 160
N_CHARGESHEET   = 80

# ── Static seed data pools ─────────────────────────────────────────────────
KANNADA_FIRST_NAMES = [
    "Ravi", "Suresh", "Manjunath", "Venkatesh", "Ganesh", "Prakash",
    "Ramesh", "Srinivas", "Nagaraj", "Basavaraj", "Shivakumar", "Rajesh",
    "Anitha", "Meena", "Kavitha", "Lakshmi", "Sunita", "Rekha",
    "Priya", "Deepa", "Shobha", "Vijaya", "Sangeetha", "Usha",
    "Arun", "Kiran", "Naveen", "Vinod", "Santosh", "Mahesh",
    "Pooja", "Divya", "Sneha", "Nandini", "Bhavana", "Archana"
]
KANNADA_LAST_NAMES = [
    "Gowda", "Reddy", "Naik", "Hegde", "Shetty", "Rao", "Patil",
    "Kulkarni", "Desai", "Joshi", "Nair", "Kumar", "Sharma", "Verma",
    "Raju", "Murthy", "Swamy", "Prasad", "Bhat", "Kamath"
]

DISTRICT_NAMES = [
    "Bangalore Urban", "Mysuru", "Belagavi", "Hubli-Dharwad",
    "Mangaluru", "Kalaburagi", "Ballari", "Shivamogga",
    "Tumkuru", "Davangere"
]

UNIT_NAMES_TEMPLATE = [
    "{district} City Police Station", "{district} Rural PS",
    "{district} Traffic PS", "{district} Women PS",
    "{district} Cyber Crime PS", "{district} Market PS"
]

CRIME_HEAD_DATA = {
    "Crimes Against Body":      ["Murder", "Attempt to Murder", "Culpable Homicide", "Grievous Hurt", "Simple Hurt"],
    "Crimes Against Property":  ["Robbery", "Dacoity", "Burglary", "Theft", "Cheating"],
    "Crimes Against Women":     ["Rape", "Dowry Death", "Kidnapping of Women", "Sexual Harassment", "Domestic Violence"],
    "Crimes Against Children":  ["Child Kidnapping", "Child Abuse", "POCSO Act Cases", "Child Labour"],
    "Cyber Crimes":             ["Online Fraud", "Identity Theft", "Cyberstalking", "Hacking", "Phishing"],
    "Economic Offences":        ["Bank Fraud", "Fake Currency", "Money Laundering", "Tax Evasion"],
    "Drug Related Crimes":      ["NDPS Possession", "Drug Trafficking", "Drug Peddling"],
    "Road Accidents":           ["Fatal Accident", "Non-Fatal Accident", "Hit and Run"],
}

ACT_DATA = {
    "IPC":   {"desc": "Indian Penal Code, 1860",             "short": "IPC"},
    "NDPS":  {"desc": "Narcotic Drugs and Psychotropic Substances Act, 1985", "short": "NDPS"},
    "IT":    {"desc": "Information Technology Act, 2000",    "short": "IT Act"},
    "MV":    {"desc": "Motor Vehicles Act, 1988",            "short": "MV Act"},
    "DV":    {"desc": "Protection of Women from Domestic Violence Act, 2005", "short": "DV Act"},
    "POCSO": {"desc": "Protection of Children from Sexual Offences Act, 2012","short": "POCSO"},
}

SECTION_DATA = {
    "IPC":   ["302", "307", "304", "323", "324", "325", "392", "395", "376", "363",
              "420", "406", "498A", "304B", "379", "380", "411", "120B", "34", "149"],
    "NDPS":  ["20", "21", "22", "27", "27A", "29"],
    "IT":    ["43", "65", "66", "66C", "66D", "67"],
    "MV":    ["112", "132", "134", "177", "184", "185"],
    "DV":    ["3", "4", "12", "17", "18", "19", "20"],
    "POCSO": ["3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
}

OCCUPATION_NAMES  = ["Farmer", "Government Employee", "Private Employee", "Business",
                     "Student", "Daily Wage Worker", "Housewife", "Retired", "Driver",
                     "Auto Driver", "Teacher", "Doctor", "Lawyer", "Engineer", "Unemployed"]
RELIGION_NAMES    = ["Hindu", "Muslim", "Christian", "Jain", "Buddhist", "Sikh", "Others"]
CASTE_NAMES       = ["General", "OBC", "SC", "ST", "Minority"]
CASE_STATUS_NAMES = ["Under Investigation", "Charge Sheeted", "Undetected",
                     "Referred to Court", "Closed", "Pending Final Report", "False Case"]
RANK_NAMES        = ["Constable", "Head Constable", "ASI", "SI", "Inspector",
                     "DSP", "SP", "IGP"]
DESIGNATION_NAMES = ["Investigating Officer", "SHO", "Beat Officer",
                     "Duty Officer", "Sub-Inspector", "Circle Inspector"]
UNIT_TYPE_NAMES   = [("Police Station", "District", 3),
                     ("Circle Office",   "District", 2),
                     ("District Office", "District", 1),
                     ("State HQ",        "State",    0)]
GRAVITY_NAMES     = ["Heinous", "Non-Heinous", "Petty"]
CASE_CATEGORY_DATA = [
    ("FIR",      "1"),
    ("UDR",      "3"),
    ("PAR",      "4"),
    ("Zero FIR", "8"),
]

# ── Helpers ────────────────────────────────────────────────────────────────
def rand_name():
    if USE_FAKER:
        return fake.name()
    return f"{random.choice(KANNADA_FIRST_NAMES)} {random.choice(KANNADA_LAST_NAMES)}"

def rand_date(start_year=2022, end_year=2025):
    start = datetime.date(start_year, 1, 1)
    end   = datetime.date(end_year, 12, 31)
    delta = (end - start).days
    return (start + datetime.timedelta(days=random.randint(0, delta))).isoformat()

def rand_datetime(start_year=2022, end_year=2025):
    d = rand_date(start_year, end_year)
    h, m = random.randint(0, 23), random.randint(0, 59)
    return f"{d} {h:02d}:{m:02d}:00"

def rand_lat_lon_karnataka():
    """Karnataka approx bounding box: lat 11.5–18.4, lon 74.0–78.6"""
    return round(random.uniform(11.5, 18.4), 6), round(random.uniform(74.0, 78.6), 6)

def choose(lst):
    return random.choice(lst)

def make_crime_no(cat_code, district_id, station_id, year, serial):
    return f"{cat_code}{district_id:04d}{station_id:04d}{year}{serial:05d}"

# ── Table generators ───────────────────────────────────────────────────────

def gen_states():
    return [{"StateID": 1, "StateName": "Karnataka", "NationalityID": 1, "Active": 1}]

def gen_districts(states):
    rows = []
    for i, name in enumerate(DISTRICT_NAMES[:N_DISTRICTS], start=1):
        rows.append({"DistrictID": i, "DistrictName": name,
                     "StateID": states[0]["StateID"], "Active": 1})
    return rows

def gen_unit_types():
    rows = []
    for i, (name, lvl, hier) in enumerate(UNIT_TYPE_NAMES[:N_UNIT_TYPES], start=1):
        rows.append({"UnitTypeID": i, "UnitTypeName": name,
                     "CityDistState": lvl, "Hierarchy": hier, "Active": 1})
    return rows

def gen_units(districts, unit_types, states):
    rows = []
    uid  = 1
    station_type_id = unit_types[0]["UnitTypeID"]  # Police Station
    for d in districts:
        for j in range(N_UNITS // N_DISTRICTS):
            name = UNIT_NAMES_TEMPLATE[j % len(UNIT_NAMES_TEMPLATE)].format(
                district=d["DistrictName"].split()[0])
            rows.append({
                "UnitID":       uid,
                "UnitName":     name,
                "TypeID":       station_type_id,
                "ParentUnit":   None,
                "NationalityID":1,
                "StateID":      states[0]["StateID"],
                "DistrictID":   d["DistrictID"],
                "Active":       1,
            })
            uid += 1
    return rows[:N_UNITS]

def gen_ranks():
    return [{"RankID": i+1, "RankName": n, "Hierarchy": i+1, "Active": 1}
            for i, n in enumerate(RANK_NAMES[:N_RANKS])]

def gen_designations():
    return [{"DesignationID": i+1, "DesignationName": n, "Active": 1, "SortOrder": i+1}
            for i, n in enumerate(DESIGNATION_NAMES[:N_DESIGNATIONS])]

def gen_employees(districts, units, ranks, designations):
    rows = []
    for i in range(1, N_EMPLOYEES+1):
        dob = rand_date(1970, 1995)
        rows.append({
            "EmployeeID":           i,
            "DistrictID":           choose(districts)["DistrictID"],
            "UnitID":               choose(units)["UnitID"],
            "RankID":               choose(ranks)["RankID"],
            "DesignationID":        choose(designations)["DesignationID"],
            "KGID":                 f"KG{2000000 + i:07d}",
            "FirstName":            rand_name(),
            "EmployeeDOB":          dob,
            "GenderID":             random.choice([1, 2]),
            "BloodGroupID":         random.randint(1, 8),
            "PhysicallyChallenged": 0,
            "AppointmentDate":      rand_date(2000, 2020),
        })
    return rows

def gen_courts(districts, states):
    rows = []
    court_types = ["District and Sessions Court", "CJM Court",
                   "Judicial Magistrate Court", "Fast Track Court", "High Court Bench"]
    for i in range(1, N_COURTS+1):
        d = choose(districts)
        rows.append({
            "CourtID":    i,
            "CourtName":  f"{d['DistrictName']} {choose(court_types)}",
            "DistrictID": d["DistrictID"],
            "StateID":    states[0]["StateID"],
            "Active":     1,
        })
    return rows

def gen_case_categories():
    return [{"CaseCategoryID": i+1, "LookupValue": name,
             "CategoryCode": code}
            for i, (name, code) in enumerate(CASE_CATEGORY_DATA)]

def gen_gravity():
    return [{"GravityOffenceID": i+1, "LookupValue": n}
            for i, n in enumerate(GRAVITY_NAMES[:N_GRAVITY])]

def gen_crime_heads():
    return [{"CrimeHeadID": i+1, "CrimeGroupName": name, "Active": 1}
            for i, name in enumerate(CRIME_HEAD_DATA.keys())]

def gen_crime_subheads(crime_heads):
    rows, sid = [], 1
    for ch in crime_heads:
        head_name = ch["CrimeGroupName"]
        subnames  = CRIME_HEAD_DATA.get(head_name, ["Misc Offence"])
        for seq, sname in enumerate(subnames, start=1):
            rows.append({
                "CrimeSubHeadID": sid,
                "CrimeHeadID":    ch["CrimeHeadID"],
                "CrimeHeadName":  sname,
                "SeqID":          seq,
            })
            sid += 1
    return rows

def gen_acts():
    return [{"ActCode": code, "ActDescription": v["desc"],
             "ShortName": v["short"], "Active": 1}
            for code, v in ACT_DATA.items()]

def gen_sections(acts):
    rows = []
    for act in acts:
        code = act["ActCode"]
        for sec in SECTION_DATA.get(code, ["1"]):
            rows.append({
                "ActCode":            code,
                "SectionCode":        sec,
                "SectionDescription": f"Section {sec} of {act['ShortName']}",
                "Active":             1,
            })
    return rows

def gen_crime_head_act_sections(crime_heads, acts, sections):
    """Map each crime head to 1-3 relevant act-sections."""
    mapping = {
        "Crimes Against Body":     [("IPC", s) for s in ["302","307","323","324"]],
        "Crimes Against Property": [("IPC", s) for s in ["392","395","379","380"]],
        "Crimes Against Women":    [("IPC", s) for s in ["376","304B","498A"]] + [("DV", "3")],
        "Crimes Against Children": [("POCSO", s) for s in ["3","5","7"]] + [("IPC", "363")],
        "Cyber Crimes":            [("IT", s) for s in ["66","66C","66D"]],
        "Economic Offences":       [("IPC", s) for s in ["420","406"]] ,
        "Drug Related Crimes":     [("NDPS", s) for s in ["20","21","27"]],
        "Road Accidents":          [("MV", s) for s in ["112","184","185"]] + [("IPC", "304")],
    }
    sec_set = {(s["ActCode"], s["SectionCode"]) for s in sections}
    rows = []
    for ch in crime_heads:
        for act_code, sec_code in mapping.get(ch["CrimeGroupName"], []):
            if (act_code, sec_code) in sec_set:
                rows.append({
                    "CrimeHeadID": ch["CrimeHeadID"],
                    "ActCode":     act_code,
                    "SectionCode": sec_code,
                })
    return rows

def gen_lookup_tables():
    occupations = [{"OccupationID": i+1, "OccupationName": n}
                   for i, n in enumerate(OCCUPATION_NAMES)]
    religions   = [{"ReligionID": i+1, "ReligionName": n}
                   for i, n in enumerate(RELIGION_NAMES)]
    castes      = [{"caste_master_id": i+1, "caste_master_name": n}
                   for i, n in enumerate(CASTE_NAMES)]
    statuses    = [{"CaseStatusID": i+1, "CaseStatusName": n}
                   for i, n in enumerate(CASE_STATUS_NAMES)]
    return occupations, religions, castes, statuses

def gen_case_master(units, employees, case_categories, gravity, crime_heads,
                    crime_subheads, statuses, courts):
    """Core FIR table — everything links back here."""
    rows = []
    # Build subhead → head map for FK consistency
    subhead_to_head = {s["CrimeSubHeadID"]: s["CrimeHeadID"] for s in crime_subheads}

    for i in range(1, N_CASES+1):
        unit     = choose(units)
        cat      = choose(case_categories)
        year     = random.randint(2022, 2025)
        crime_no = make_crime_no(
            cat["CategoryCode"],
            unit["DistrictID"],
            unit["UnitID"],
            year,
            i
        )
        subhead  = choose(crime_subheads)
        head_id  = subhead_to_head[subhead["CrimeSubHeadID"]]
        inc_start = rand_datetime(year, year)
        lat, lon  = rand_lat_lon_karnataka()

        rows.append({
            "CaseMasterID":         i,
            "CrimeNo":              crime_no,
            "CaseNo":               f"{year}{i:05d}",
            "CrimeRegisteredDate":  rand_date(year, year),
            "PolicePersonID":       choose(employees)["EmployeeID"],
            "PoliceStationID":      unit["UnitID"],
            "CaseCategoryID":       cat["CaseCategoryID"],
            "GravityOffenceID":     choose(gravity)["GravityOffenceID"],
            "CrimeMajorHeadID":     head_id,
            "CrimeMinorHeadID":     subhead["CrimeSubHeadID"],
            "CaseStatusID":         choose(statuses)["CaseStatusID"],
            "CourtID":              choose(courts)["CourtID"] if random.random() > 0.3 else None,
            "IncidentFromDate":     inc_start,
            "IncidentToDate":       None if random.random() > 0.4 else rand_datetime(year, year),
            "InfoReceivedPSDate":   inc_start,
            "latitude":             lat,
            "longitude":            lon,
            "BriefFacts":           f"Case registered under {subhead['CrimeHeadName']}. Investigation underway.",
        })
    return rows

def gen_complainants(cases, occupations, religions, castes):
    rows = []
    cid  = 1
    for case in cases:
        count = 1 if random.random() > 0.15 else 2
        for _ in range(count):
            rows.append({
                "ComplainantID": cid,
                "CaseMasterID":  case["CaseMasterID"],
                "ComplainantName": rand_name(),
                "AgeYear":       random.randint(18, 70),
                "OccupationID":  choose(occupations)["OccupationID"],
                "ReligionID":    choose(religions)["ReligionID"],
                "CasteID":       choose(castes)["caste_master_id"],
                "GenderID":      random.choice([1, 2]),
            })
            cid += 1
    return rows[:N_COMPLAINANTS]

def gen_victims(cases):
    rows = []
    vid  = 1
    for case in cases:
        count = random.randint(1, 3)
        for _ in range(count):
            rows.append({
                "VictimMasterID": vid,
                "CaseMasterID":   case["CaseMasterID"],
                "VictimName":     rand_name(),
                "AgeYear":        random.randint(5, 80),
                "GenderID":       random.choice([1, 2, 3]),
                "VictimPolice":   "1" if random.random() < 0.05 else "0",
            })
            vid += 1
    return rows[:N_VICTIMS]

def gen_accused(cases):
    rows = []
    aid  = 1
    person_counter = defaultdict(int)
    for case in cases:
        count = random.randint(1, 4)
        for k in range(count):
            person_counter[case["CaseMasterID"]] += 1
            rows.append({
                "AccusedMasterID": aid,
                "CaseMasterID":    case["CaseMasterID"],
                "AccusedName":     rand_name(),
                "AgeYear":         random.randint(16, 65),
                "GenderID":        random.choice(["M", "F", "T"]),
                "PersonID":        f"A{person_counter[case['CaseMasterID']]}",
            })
            aid += 1
    return rows[:N_ACCUSED]

def gen_act_section_association(cases, acts, sections):
    rows = []
    # group sections by act
    secs_by_act = defaultdict(list)
    for s in sections:
        secs_by_act[s["ActCode"]].append(s["SectionCode"])

    for case in cases:
        act = choose(acts)
        available_secs = secs_by_act[act["ActCode"]]
        chosen_secs = random.sample(available_secs, k=min(random.randint(1, 3), len(available_secs)))
        for order, sec in enumerate(chosen_secs, start=1):
            rows.append({
                "CaseMasterID":  case["CaseMasterID"],
                "ActID":         act["ActCode"],
                "SectionID":     sec,
                "ActOrderID":    1,
                "SectionOrderID":order,
            })
    return rows

def gen_arrest_surrender(cases, accused, units, employees, courts, districts, states):
    rows = []
    arid = 1
    accused_by_case = defaultdict(list)
    for a in accused:
        accused_by_case[a["CaseMasterID"]].append(a["AccusedMasterID"])

    for case in cases[:N_ARRESTS]:
        if not accused_by_case[case["CaseMasterID"]]:
            continue
        rows.append({
            "ArrestSurrenderID":         arid,
            "CaseMasterID":              case["CaseMasterID"],
            "ArrestSurrenderTypeID":     random.choice([1, 2]),
            "ArrestSurrenderDate":       rand_date(2022, 2025),
            "ArrestSurrenderStateId":    states[0]["StateID"],
            "ArrestSurrenderDistrictId": choose(districts)["DistrictID"],
            "PoliceStationID":           choose(units)["UnitID"],
            "IOID":                      choose(employees)["EmployeeID"],
            "CourtID":                   choose(courts)["CourtID"] if random.random() > 0.2 else None,
            "AccusedMasterID":           choose(accused_by_case[case["CaseMasterID"]]),
            "IsAccused":                 1,
            "IsComplainantAccused":      1 if random.random() < 0.05 else 0,
        })
        arid += 1
    return rows

def gen_chargesheet(cases, employees):
    rows = []
    cs_types = ["A", "B", "C"]
    for i, case in enumerate(random.sample(cases, k=min(N_CHARGESHEET, len(cases))), start=1):
        rows.append({
            "CSID":           i,
            "CaseMasterID":   case["CaseMasterID"],
            "csdate":         rand_datetime(2022, 2025),
            "cstype":         choose(cs_types),
            "PolicePersonID": choose(employees)["EmployeeID"],
        })
    return rows

# ── Main orchestrator ──────────────────────────────────────────────────────
def generate_all():
    print("Generating synthetic data for Police FIR System...")

    states          = gen_states()
    districts       = gen_districts(states)
    unit_types      = gen_unit_types()
    units           = gen_units(districts, unit_types, states)
    ranks           = gen_ranks()
    designations    = gen_designations()
    employees       = gen_employees(districts, units, ranks, designations)
    courts          = gen_courts(districts, states)
    case_categories = gen_case_categories()
    gravity         = gen_gravity()
    crime_heads     = gen_crime_heads()
    crime_subheads  = gen_crime_subheads(crime_heads)
    acts            = gen_acts()
    sections        = gen_sections(acts)
    crime_head_act_sections = gen_crime_head_act_sections(crime_heads, acts, sections)
    occupations, religions, castes, statuses = gen_lookup_tables()

    cases           = gen_case_master(units, employees, case_categories, gravity,
                                      crime_heads, crime_subheads, statuses, courts)
    complainants    = gen_complainants(cases, occupations, religions, castes)
    victims         = gen_victims(cases)
    accused         = gen_accused(cases)
    act_section_assoc = gen_act_section_association(cases, acts, sections)
    arrests         = gen_arrest_surrender(cases, accused, units, employees,
                                           courts, districts, states)
    chargesheets    = gen_chargesheet(cases, employees)

    tables = {
        "State":                   states,
        "District":                districts,
        "UnitType":                unit_types,
        "Unit":                    units,
        "Rank":                    ranks,
        "Designation":             designations,
        "Employee":                employees,
        "Court":                   courts,
        "CaseCategory":            case_categories,
        "GravityOffence":          gravity,
        "CrimeHead":               crime_heads,
        "CrimeSubHead":            crime_subheads,
        "Act":                     acts,
        "Section":                 sections,
        "CrimeHeadActSection":     crime_head_act_sections,
        "OccupationMaster":        occupations,
        "ReligionMaster":          religions,
        "CasteMaster":             castes,
        "CaseStatusMaster":        statuses,
        "CaseMaster":              cases,
        "ComplainantDetails":      complainants,
        "Victim":                  victims,
        "Accused":                 accused,
        "ActSectionAssociation":   act_section_assoc,
        "ArrestSurrender":         arrests,
        "ChargesheetDetails":      chargesheets,
    }

    return tables

# ── Output helpers ─────────────────────────────────────────────────────────
def save_json(tables, out_dir="synthetic_data"):
    os.makedirs(out_dir, exist_ok=True)
    for table_name, rows in tables.items():
        path = os.path.join(out_dir, f"{table_name}.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump(rows, f, indent=2, default=str)
        print(f"  {table_name:30s} → {len(rows):5d} rows  [{path}]")

def val_sql(v):
    if v is None:
        return "NULL"
    if isinstance(v, (int, float)):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"

def save_sql(tables, out_path="synthetic_data/insert_all.sql"):
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("-- Police FIR Synthetic Data — INSERT statements\n")
        f.write("-- Generated automatically. Review before executing.\n\n")
        for table_name, rows in tables.items():
            if not rows:
                continue
            cols = list(rows[0].keys())
            f.write(f"\n-- ===== {table_name} =====\n")
            for row in rows:
                vals = ", ".join(val_sql(row[c]) for c in cols)
                col_str = ", ".join(cols)
                f.write(f"INSERT INTO {table_name} ({col_str}) VALUES ({vals});\n")
    print(f"\n  SQL file → {out_path}")

# ── Entry point ────────────────────────────────────────────────────────────
if __name__ == "__main__":
    tables = generate_all()
    print("\nSaving JSON files:")
    save_json(tables)
    print("\nSaving SQL INSERT file:")
    save_sql(tables)

    # ── Quick summary ──────────────────────────────────────────────────────
    print("\n" + "="*55)
    print("  SYNTHETIC DATA SUMMARY")
    print("="*55)
    total = 0
    for t, rows in tables.items():
        total += len(rows)
        print(f"  {t:<35} {len(rows):>5} rows")
    print("-"*55)
    print(f"  {'TOTAL':<35} {total:>5} rows")
    print("="*55)
    print("\nFaker library available:", USE_FAKER)
    print("Done! Data in ./synthetic_data/")