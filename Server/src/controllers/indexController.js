const { readCollection } = require('../database/collections');

const getApiStatus = (req, res) => {
  res.send('Hello World');
};

const getEventStats = async (req, res) => {
  try {
    const stats = (await readCollection('stats')) || {};

    res.set('Cache-Control', 'no-store');
    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching event statistics',
      error: error.message,
    });
  }
};

const getHeroImage = (req, res) => {
  res.json({
    imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
  });
};

module.exports = {
  getApiStatus,
  getEventStats,
  getHeroImage,
};
