const getApiStatus = (req, res) => {
  res.send('Hello World');
};

const getHeroImage = (req, res) => {
  res.json({
    imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80"
  });
};

module.exports = {
  getApiStatus,
  getHeroImage,
};
