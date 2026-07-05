const pool = require('../config/db');
const { validateApplication, VALID_APPLICATION_STATUSES } = require('../middleware/validators');

exports.list = async (req, res, next) => {
  try {
    const [applications] = await pool.query(`
      SELECT *
      FROM   vw_application_details
      ORDER  BY application_date DESC, application_id ASC
    `);
    res.render('applications/list', { title: 'Applications', applications });
  } catch (err) {
    next(err);
  }
};

exports.newForm = async (req, res, next) => {
  try {
    const [students] = await pool.query(
      'SELECT student_id, name, email FROM Students ORDER BY name ASC'
    );
    const [jobs] = await pool.query(`
      SELECT j.job_id, j.title, c.company_name
      FROM   Jobs j
      JOIN   Companies c ON j.company_id = c.company_id
      WHERE  j.status = 'Open' AND j.deadline >= CURRENT_DATE
      ORDER  BY j.title ASC
    `);
    res.render('applications/form', {
      title      : 'New Application',
      application: {},
      students,
      jobs,
      statuses   : VALID_APPLICATION_STATUSES,
      errors     : [],
      formAction : '/applications',
      method     : 'POST'
    });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  const errors = validateApplication(req.body);

  const reloadDropdowns = async () => {
    const [students] = await pool.query(
      'SELECT student_id, name, email FROM Students ORDER BY name ASC'
    );
    const [jobs] = await pool.query(`
      SELECT j.job_id, j.title, c.company_name
      FROM   Jobs j
      JOIN   Companies c ON j.company_id = c.company_id
      WHERE  j.status = 'Open' AND j.deadline >= CURRENT_DATE
      ORDER  BY j.title ASC
    `);
    return { students, jobs };
  };

  if (errors.length > 0) {
    const { students, jobs } = await reloadDropdowns();
    return res.status(400).render('applications/form', {
      title      : 'New Application',
      application: req.body,
      students,
      jobs,
      statuses   : VALID_APPLICATION_STATUSES,
      errors,
      formAction : '/applications',
      method     : 'POST'
    });
  }

  try {
    const { student_id, job_id } = req.body;
    await pool.query(
      'INSERT INTO Applications (student_id, job_id, application_date) VALUES (?, ?, CURRENT_DATE)',
      [student_id, job_id]
    );
    res.redirect('/applications');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      const { students, jobs } = await reloadDropdowns();
      return res.status(409).render('applications/form', {
        title      : 'New Application',
        application: req.body,
        students,
        jobs,
        statuses   : VALID_APPLICATION_STATUSES,
        errors     : ['This student has already applied for that job.'],
        formAction : '/applications',
        method     : 'POST'
      });
    }
    if (err.code === 'ER_SIGNAL_EXCEPTION') {
      const { students, jobs } = await reloadDropdowns();
      return res.status(400).render('applications/form', {
        title      : 'New Application',
        application: req.body,
        students,
        jobs,
        statuses   : VALID_APPLICATION_STATUSES,
        errors     : [err.sqlMessage],
        formAction : '/applications',
        method     : 'POST'
      });
    }
    next(err);
  }
};

exports.editForm = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM vw_application_details WHERE application_id = ?',
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).render('error', {
        title   : 'Not Found',
        message : 'Application not found.',
        status  : 404
      });
    }
    const [students] = await pool.query(
      'SELECT student_id, name, email FROM Students ORDER BY name ASC'
    );
    const [jobs] = await pool.query(`
      SELECT j.job_id, j.title, c.company_name
      FROM   Jobs j
      JOIN   Companies c ON j.company_id = c.company_id
      ORDER  BY j.title ASC
    `);
    res.render('applications/form', {
      title      : 'Edit Application Status',
      application: rows[0],
      students,
      jobs,
      statuses   : VALID_APPLICATION_STATUSES,
      errors     : [],
      formAction : `/applications/${req.params.id}?_method=PUT`,
      method     : 'POST'
    });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  const id = req.params.id;
  const { status } = req.body;

  if (!VALID_APPLICATION_STATUSES.includes(status)) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM vw_application_details WHERE application_id = ?', [id]
      );
      const [students] = await pool.query(
        'SELECT student_id, name, email FROM Students ORDER BY name ASC'
      );
      const [jobs] = await pool.query(`
        SELECT j.job_id, j.title, c.company_name
        FROM   Jobs j
        JOIN   Companies c ON j.company_id = c.company_id
        ORDER  BY j.title ASC
      `);
      return res.status(400).render('applications/form', {
        title      : 'Edit Application Status',
        application: rows[0] || { application_id: id },
        students,
        jobs,
        statuses   : VALID_APPLICATION_STATUSES,
        errors     : [`Status must be one of: ${VALID_APPLICATION_STATUSES.join(', ')}.`],
        formAction : `/applications/${id}?_method=PUT`,
        method     : 'POST'
      });
    } catch (inner) { return next(inner); }
  }

  try {
    const [result] = await pool.query(
      'UPDATE Applications SET status = ? WHERE application_id = ?',
      [status, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).render('error', {
        title   : 'Not Found',
        message : 'Application not found.',
        status  : 404
      });
    }
    res.redirect('/applications');
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM Applications WHERE application_id = ?',
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).render('error', {
        title   : 'Not Found',
        message : 'Application not found.',
        status  : 404
      });
    }
    res.redirect('/applications');
  } catch (err) {
    next(err);
  }
};
