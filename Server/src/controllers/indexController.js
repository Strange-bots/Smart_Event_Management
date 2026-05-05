const { readCollection } = require('../database/collections');

const getApiStatus = (req, res) => {
  res.send('Hello World');
};

const buildCategoryCounts = (events) => {
  const counts = {
    technology: 0,
    business: 0,
    academics: 0,
    community: 0,
  };

  events.forEach((event) => {
    const category = String(event.category || '').trim().toLowerCase();

    if (['technology', 'workshop', 'professional development'].includes(category)) {
      counts.technology += 1;
      return;
    }

    if (['career', 'networking', 'business'].includes(category)) {
      counts.business += 1;
      return;
    }

    if (['academic', 'seminar', 'conference'].includes(category)) {
      counts.academics += 1;
      return;
    }

    counts.community += 1;
  });

  return counts;
};

const getEventStats = async (req, res) => {
  try {
    const [stats, events] = await Promise.all([
      readCollection('stats'),
      readCollection('events'),
    ]);
    const approvedEvents = Array.isArray(events)
      ? events.filter((event) => event.status === 'approved')
      : [];
    const categoryCounts = buildCategoryCounts(approvedEvents);

    res.set('Cache-Control', 'no-store');
    res.status(200).json({
      success: true,
      data: {
        ...(stats || {}),
        categoryCounts,
      },
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
