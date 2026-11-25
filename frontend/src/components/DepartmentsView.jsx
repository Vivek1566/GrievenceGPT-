import React from "react";
import {
  Droplets, Shield, Zap, Trash2, Route, HeartPulse,
  GraduationCap, AlertOctagon, Briefcase, Landmark,
  FileCheck, Wallet, ShoppingBag, Award, ExternalLink
} from "lucide-react";

const DEPT_ICONS = {
  "Water Supply": Droplets,
  "Police & Law and Order": Shield,
  "Electricity": Zap,
  "Sanitation & Garbage": Trash2,
  "Roads & Infrastructure": Route,
  "Healthcare & Hospitals": HeartPulse,
  "Education & Schools": GraduationCap,
  "Corruption & Bribery": AlertOctagon,
  "Employment & Labour": Briefcase,
  "Banking & Financial Services": Landmark,
  "Land Records & Revenue": FileCheck,
  "Pension & Provident Fund": Wallet,
  "Ration & Public Distribution System": ShoppingBag,
  "Municipal Certificates": Award
};

export default function DepartmentsView({ onSelectDepartment }) {
  const departments = [
    {
      name: "Water Supply",
      officer: "Chief Engineer, Delhi Jal Board / Municipal Jal Sansthan",
      sla_hours: 24,
      portal: "jaljeevan.gov.in",
      desc: "Drinking water pipe leaks, contamination, valve repair, tanker dispatch."
    },
    {
      name: "Police & Law and Order",
      officer: "Superintendent of Police (Law & Grievance Cell)",
      sla_hours: 12,
      portal: "cctns.gov.in",
      desc: "FIR registration delays, missing persons, local patrol requests, crime complaints."
    },
    {
      name: "Electricity",
      officer: "Executive Engineer, State DISCOM / Power Transmission",
      sla_hours: 24,
      portal: "urjavaran.gov.in",
      desc: "Transformer breakdown, voltage fluctuation, damaged poles, billing disputes."
    },
    {
      name: "Sanitation & Garbage",
      officer: "Chief Municipal Health Officer, Swachh Bharat Cell",
      sla_hours: 24,
      portal: "swachhbharat.gov.in",
      desc: "Uncollected street garbage, sewer overflow, public drain clogging, fumigation."
    },
    {
      name: "Roads & Infrastructure",
      officer: "Superintending Engineer, PWD / NHAI Division",
      sla_hours: 48,
      portal: "morth.nic.in",
      desc: "Pothole repair, bridge maintenance, flyover safety, road waterlogging."
    },
    {
      name: "Healthcare & Hospitals",
      officer: "Chief Medical Officer (CMO), Health Directorate",
      sla_hours: 12,
      portal: "mohfw.gov.in",
      desc: "Government hospital emergency response, doctor unavailability, medicine shortages."
    },
    {
      name: "Education & Schools",
      officer: "District Education Officer (DEO), Samagra Shiksha",
      sla_hours: 72,
      portal: "samagra.education.gov.in",
      desc: "School structural safety, teacher attendance, mid-day meal hygiene, scholarship delays."
    },
    {
      name: "Corruption & Bribery",
      officer: "Special Director, Anti-Corruption Bureau / Lokayukta",
      sla_hours: 24,
      portal: "cpcb.gov.in",
      desc: "Demand of bribes, bureaucratic extortion, misuse of government funds, vigilance."
    },
    {
      name: "Employment & Labour",
      officer: "Labour Commissioner, Shram Suvidha Portal",
      sla_hours: 72,
      portal: "shramsuvidha.gov.in",
      desc: "Unpaid wage claims, factory workplace hazards, bonded labour violations, contract disputes."
    },
    {
      name: "Banking & Financial Services",
      officer: "Banking Ombudsman, RBI Financial Inclusion Wing",
      sla_hours: 48,
      portal: "rbi.org.in",
      desc: "Unauthorized ATM withdrawals, pension account freezes, loan disbursement harassment."
    },
    {
      name: "Land Records & Revenue",
      officer: "Sub-Divisional Magistrate (SDM Revenue / Tehsildar)",
      sla_hours: 96,
      portal: "dlrc.gov.in",
      desc: "Mutation delays, land encroachment, incorrect katha/khasra entries, boundary demarcation."
    },
    {
      name: "Pension & Provident Fund",
      officer: "Regional Provident Fund Commissioner, EPFO",
      sla_hours: 48,
      portal: "epfindia.gov.in",
      desc: "EPF claim settlement delays, pension revision, death claim settlement, UAN linking."
    },
    {
      name: "Ration & Public Distribution System",
      officer: "District Supply Officer, National Food Security Mission",
      sla_hours: 36,
      portal: "nfsa.gov.in",
      desc: "Fair price shop grain diversion, ration card issuance, biometric authentication failures."
    },
    {
      name: "Municipal Certificates",
      officer: "Municipal Registrar of Births, Deaths & Trade Licenses",
      sla_hours: 48,
      portal: "edistrict.gov.in",
      desc: "Birth/death certificate delays, trade license renewals, property tax assessment errors."
    }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Page Heading */}
      <div className="page-heading" style={{ marginBottom: 0 }}>
        <div>
          <div className="eyebrow">GOVERNMENT SERVICE DIRECTORY</div>
          <h1>14 Integrated Municipal & State Departments</h1>
          <p>
            Complete catalog of governmental administrative wings, designated nodal officers, and official service-level agreements.
          </p>
        </div>
      </div>

      {/* Grid of 14 Department Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
        {departments.map((dept) => {
          const IconComp = DEPT_ICONS[dept.name] || Landmark;
          return (
            <div
              key={dept.name}
              className="panel"
              style={{
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                borderRadius: 12,
                transition: "border-color 0.2s ease"
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: "#16283d",
                    color: "#52bad5",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0
                  }}
                >
                  <IconComp size={20} />
                </div>
                <div>
                  <h3 style={{ margin: "0 0 4px", fontSize: "15px", color: "#f0f5fa" }}>{dept.name}</h3>
                  <span
                    style={{
                      background: "#142d38",
                      color: "#4ec2dd",
                      padding: "2px 7px",
                      borderRadius: 4,
                      fontSize: "10px",
                      fontWeight: 700
                    }}
                  >
                    SLA: {dept.sla_hours} Hours
                  </span>
                </div>
              </div>

              <p style={{ margin: 0, fontSize: "11px", color: "#8799af", lineHeight: "1.5" }}>{dept.desc}</p>

              <div
                style={{
                  marginTop: "auto",
                  paddingTop: 12,
                  borderTop: "1px solid #1a293c",
                  fontSize: "11px",
                  color: "#9ab0c8"
                }}
              >
                <small style={{ color: "#6e8198", display: "block", fontSize: "9px" }}>ASSIGNED NODAL OFFICER</small>
                <b style={{ color: "#dce6f2", fontSize: "11px" }}>{dept.officer}</b>

                <div
                  style={{
                    marginTop: 8,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <a
                    href={`https://${dept.portal}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: "#52bad5",
                      textDecoration: "none",
                      fontSize: "10px",
                      display: "flex",
                      alignItems: "center",
                      gap: 4
                    }}
                  >
                    {dept.portal} <ExternalLink size={11} />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

