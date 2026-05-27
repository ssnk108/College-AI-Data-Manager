const approvalChecks = [
  ["UGC", ["ugcApproval", "otherApprovals"]],
  ["AICTE", ["aicteApproval", "otherApprovals"]],
  ["NAAC", ["naacGrade", "otherApprovals"]],
  ["NBA", ["nbaAccreditation", "otherApprovals"]],
  ["NIRF", ["nirfRanking", "otherApprovals"]],
  ["PCI", ["pciApproval", "otherApprovals"]],
  ["BCI", ["bciApproval", "otherApprovals"]],
  ["NCTE", ["ncteApproval", "otherApprovals"]],
  ["INC", ["incApproval", "otherApprovals"]]
];

function hasApproval(approval = {}, label, fields) {
  return fields.some((field) => {
    const value = String(approval[field] || "");
    return value && (field !== "otherApprovals" || new RegExp(`\\b${label}\\b`, "i").test(value));
  });
}

export function summarizeApprovals(approval = {}, maxVisible = 4) {
  const approvals = approvalChecks
    .filter(([label, fields]) => hasApproval(approval, label, fields))
    .map(([label]) => label);
  const visible = approvals.slice(0, maxVisible);
  return {
    approvals,
    visible,
    hiddenCount: Math.max(approvals.length - visible.length, 0)
  };
}

export function summarizeNaacNirf(approval = {}) {
  const items = [];
  const naacRaw = String(approval.naacGrade || "");
  const nirfRaw = String(approval.nirfRanking || "");
  const naacMatch = naacRaw.match(/\b(A\+\+|A\+|A|B\+\+|B\+|B|C)\b/i);
  if (naacMatch) items.push(`NAAC ${naacMatch[1].toUpperCase()}`);
  else if (/naac/i.test(naacRaw)) items.push("NAAC");

  const rankRange = nirfRaw.match(/\b\d{1,3}\s*-\s*\d{1,3}\b/);
  const rankNumber = nirfRaw.match(/\bRank(?:ed)?\s*[:#-]?\s*(\d{1,3})\b/i) || nirfRaw.match(/\bNIRF\s*(\d{1,3})\b/i);
  if (rankRange) items.push(`NIRF ${rankRange[0].replace(/\s+/g, "")}`);
  else if (rankNumber) items.push(`NIRF ${rankNumber[1]}`);
  else if (/nirf|ranked/i.test(nirfRaw)) items.push("NIRF Ranked");

  return items;
}
