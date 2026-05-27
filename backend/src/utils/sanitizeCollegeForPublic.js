export function sanitizeCollegeForPublic(college) {
  const obj = college?.toObject ? college.toObject() : { ...(college || {}) };
  delete obj.privateConsultancyDetails;
  delete obj.extractionDebug;
  delete obj.fieldMeta;
  delete obj.normalizedCollegeName;
  delete obj.aliases;
  delete obj.websiteDomain;

  if (Array.isArray(obj.courses)) {
    obj.courses = obj.courses.map((course) => {
      const copy = { ...course };
      delete copy.incentive;
      delete copy.donation;
      delete copy.internalAdmissionNotes;
      delete copy.counsellorNotes;
      delete copy.seatAvailability;
      return copy;
    });
  }

  if (Array.isArray(obj.warnings)) {
    obj.warnings = obj.warnings.filter((warning) => !/internal|commission|incentive|donation|negotiation|consultancy/i.test(warning));
  }

  return obj;
}
