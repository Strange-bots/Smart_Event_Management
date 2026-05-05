const { verifySessionToken } = require('../services/authService');
const { getAiRecommendations } = require('../services/aiService');

const getBearerToken = (req) =>
  req.headers.authorization?.replace(/^Bearer\s+/i, '');

const getRecommendations = async (req, res) => {
  const sessionUser = verifySessionToken(getBearerToken(req));
  const result = await getAiRecommendations({
    userEmail: sessionUser?.email,
    limit: req.query?.limit,
  });

  if (!result.recommendations.length) {
    return res.status(result.statusCode).json({
      message: 'No recommended events available',
      recommendations: [],
      source: result.source,
      reason: result.reason || null,
    });
  }

  return res.status(result.statusCode).json({
    message:
      result.source === 'openai'
        ? 'AI recommendations fetched successfully'
        : 'Recommendations fetched successfully',
    recommendations: result.recommendations,
    source: result.source,
    reason: result.reason || null,
  });
};

module.exports = {
  getRecommendations,
};
