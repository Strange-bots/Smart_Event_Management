const { getAdminEventReviewRecommendations } = require('../services/adminEventAiService');

const listAdminEventReviewRecommendations = async (req, res) => {
  const result = await getAdminEventReviewRecommendations();

  return res.status(result.statusCode).json({
    message: 'Admin event AI recommendations fetched successfully',
    recommendations: result.recommendations,
    source: result.source,
    reason: result.reason || null,
    modelResult: result.modelResult || null,
  });
};

module.exports = {
  listAdminEventReviewRecommendations,
};
