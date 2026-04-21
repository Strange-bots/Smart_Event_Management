const getApiStatus = (req, res) => {
  res.send('Hello World');
};

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
};

module.exports = {
  getApiStatus,
  getEventStats,
};
