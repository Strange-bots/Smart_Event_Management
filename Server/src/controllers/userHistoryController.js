const {
  createUserHistoryReport,
  listUserHistory,
} = require('../services/userHistoryService');

const listUserHistoryRecords = async (req, res) => {
  const result = await listUserHistory(req.query ?? {});

  return res.status(result.statusCode).json({
    message: 'User history fetched successfully',
    users: result.users,
  });
};

const createUserHistoryReportRecord = async (req, res) => {
  const result = await createUserHistoryReport({
    reporter: req.user,
    payload: req.body ?? {},
  });

  if (result.error) {
    return res.status(result.statusCode).json({
      message: result.error,
    });
  }

  return res.status(result.statusCode).json({
    message: 'User history report created successfully',
    report: result.report,
    user: result.user,
  });
};

module.exports = {
  createUserHistoryReportRecord,
  listUserHistoryRecords,
};
