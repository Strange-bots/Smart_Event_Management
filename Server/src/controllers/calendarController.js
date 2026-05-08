const { getRoleScopedCalendarEvents } = require('../services/calendarService');

const getRoleScopedCalendar = async (req, res) => {
  const role = req.user?.role;
  const email = req.user?.email;
  const id = req.user?.id;

  if (!role || !email) {
    return res.status(401).json({
      message: 'Authentication is required',
    });
  }

  const result = await getRoleScopedCalendarEvents({ role, email, id });

  return res.status(200).json({
    message: 'Calendar events fetched successfully',
    events: result.events,
    summary: result.summary,
    groupedEvents: result.groupedEvents,
  });
};

module.exports = {
  getRoleScopedCalendar,
};
