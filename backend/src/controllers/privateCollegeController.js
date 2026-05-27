import College from "../models/College.js";

export async function getPrivateCollege(req, res, next) {
  try {
    const college = await College.findById(req.params.id);
    if (!college) return res.status(404).json({ message: "College not found" });
    res.json({
      collegeId: college._id,
      collegeName: college.basicInfo?.collegeName,
      privateConsultancyDetails: college.privateConsultancyDetails || {},
      extractionDebug: college.extractionDebug || {}
    });
  } catch (error) {
    next(error);
  }
}

export async function updatePrivateCollege(req, res, next) {
  try {
    const college = await College.findByIdAndUpdate(
      req.params.id,
      { privateConsultancyDetails: req.body.privateConsultancyDetails || req.body },
      { new: true, runValidators: true }
    );
    if (!college) return res.status(404).json({ message: "College not found" });
    res.json({
      collegeId: college._id,
      collegeName: college.basicInfo?.collegeName,
      privateConsultancyDetails: college.privateConsultancyDetails || {},
      extractionDebug: college.extractionDebug || {}
    });
  } catch (error) {
    next(error);
  }
}
