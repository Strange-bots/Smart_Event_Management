const { verifySessionToken } = require('../services/authService');
const { getAiRecommendations } = require('../services/aiService');

const getBearerToken = (req) =>
  req.headers.authorization?.replace(/^Bearer\s+/i, '');

const getRecommendations = async (req, res) => {
  const sessionUser = await verifySessionToken(getBearerToken(req));
  const aiResponseConst = await getAiRecommendations({
    userEmail: sessionUser?.email,
    limit: req.query?.limit,
  });

  if (!aiResponseConst.recommendations.length) {
    return res.status(aiResponseConst.statusCode).json({
      message: 'No recommended events available',
      recommendations: [],
      source: aiResponseConst.source,
      reason: aiResponseConst.reason || null,
      modelResult: aiResponseConst.modelResult || null,
    });
  }

  return res.status(aiResponseConst.statusCode).json({
    message:
      aiResponseConst.source === 'gemini'
        ? 'AI recommendations fetched successfully'
        : 'Recommendations fetched successfully',
    recommendations: aiResponseConst.recommendations,
    source: aiResponseConst.source,
    reason: aiResponseConst.reason || null,
    modelResult: aiResponseConst.modelResult || null,
  });
};

module.exports = {
  getRecommendations,
};
