const getApiStatus = (req, res) => {
  res.send('Hello World');
};

<<<<<<< HEAD
const getEventStats = (req, res) => {
  try {
    // TODO: Replace with actual database query when connected
    // For now, returning mock data to demonstrate the endpoint
    const stats = {
      eventsHosted: 5000,
      participants: 12000,
      institutions: 50
    };
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching event statistics',
      error: error.message
    });
  }
=======
const getHeroImage = (req, res) => {
  res.json({
    imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80"
  });
>>>>>>> 335cb0278dcc007e526d9fed62bb2b09519d5c5a
};

module.exports = {
  getApiStatus,
<<<<<<< HEAD
  getEventStats,
=======
  getHeroImage,
>>>>>>> 335cb0278dcc007e526d9fed62bb2b09519d5c5a
};
