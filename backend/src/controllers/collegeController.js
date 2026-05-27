import College from "../models/College.js";

function publicCollege(college) {
  const obj = college.toObject ? college.toObject() : college;
  delete obj.privateConsultancyDetails;
  delete obj.extractionDebug;
  if (Array.isArray(obj.courses)) {
    obj.courses = obj.courses.map((course) => {
      const copy = { ...course };
      delete copy.incentive;
      delete copy.donation;
      return copy;
    });
  }
  return obj;
}

function buildCollegeQuery(query) {
  const filter = {};

  if (query.search) filter.$text = { $search: query.search };
  if (query.state) filter["basicInfo.state"] = new RegExp(query.state, "i");
  if (query.city) filter["basicInfo.city"] = new RegExp(query.city, "i");
  if (query.ownership) filter["basicInfo.ownershipType"] = query.ownership;
  if (query.course) filter["courses.courseName"] = new RegExp(query.course, "i");
  if (query.approval) {
    filter.$or = [
      { "affiliationApproval.ugcApproval": new RegExp(query.approval, "i") },
      { "affiliationApproval.aicteApproval": new RegExp(query.approval, "i") },
      { "affiliationApproval.otherApprovals": new RegExp(query.approval, "i") }
    ];
  }
  if (query.verificationStatus) filter.verificationStatus = query.verificationStatus;

  return filter;
}

function buildSort(sortBy = "updatedAt", order = "desc") {
  const direction = order === "asc" ? 1 : -1;
  const sortMap = {
    fees: { "courses.totalFee": direction },
    placement: { "placements.averagePackage": direction },
    ranking: { "affiliationApproval.nirfRanking": direction },
    updatedAt: { updatedAt: direction }
  };

  return sortMap[sortBy] || sortMap.updatedAt;
}

export async function createCollege(req, res, next) {
  try {
    const college = await College.create(req.body);
    res.status(201).json(publicCollege(college));
  } catch (error) {
    res.status(400);
    next(error);
  }
}

export async function getColleges(req, res, next) {
  try {
    const colleges = await College.find(buildCollegeQuery(req.query)).sort(buildSort(req.query.sortBy, req.query.order));
    res.json(colleges.map(publicCollege));
  } catch (error) {
    next(error);
  }
}

export async function getCollegeById(req, res, next) {
  try {
    const college = await College.findById(req.params.id);
    if (!college) {
      res.status(404);
      throw new Error("College not found");
    }
    res.json(publicCollege(college));
  } catch (error) {
    next(error);
  }
}

export async function updateCollege(req, res, next) {
  try {
    const college = await College.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!college) {
      res.status(404);
      throw new Error("College not found");
    }
    res.json(publicCollege(college));
  } catch (error) {
    res.status(res.statusCode === 200 ? 400 : res.statusCode);
    next(error);
  }
}

export async function deleteCollege(req, res, next) {
  try {
    const college = await College.findByIdAndDelete(req.params.id);
    if (!college) {
      res.status(404);
      throw new Error("College not found");
    }
    res.json({ message: "College deleted" });
  } catch (error) {
    next(error);
  }
}
