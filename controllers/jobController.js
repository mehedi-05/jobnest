const pool = require('../config/db');
const { validateJob } = require('../middleware/validators');

exports.list = async (req, res, next) => {
  try {
    const [jobs] = await pool.query(`
      SELECT j.*,
             c.company_name,
             c.location,
             COUNT(a.application_id) AS applicant_count
      FROM   Jobs j
      JOIN   Companies c ON j.company_id = c.company_id
      LEFT   JOIN Applications a ON j.job_id = a.job_id
      GROUP  BY j.job_id
      ORDER  BY j.posted_at ASC
    `);
    res.render('jobs/list', { title: 'Job Listings', jobs });
  } catch (err) {
    next(err);
  }
};

exports.newForm = async (req, res, next) => {
  try {
    const [companies] = await pool.query(
      'SELECT company_id, company_name FROM Companies ORDER BY company_name ASC'
    );
    res.render('jobs/form', {
      title      : 'Post a Job',
      job        : {},
      companies,
      errors     : [],
      formAction : '/jobs',
      method     : 'POST'
    });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  const errors = validateJob(req.body);

  if (errors.length > 0) {
    const [companies] = await pool.query(
      'SELECT company_id, company_name FROM Companies ORDER BY company_name ASC'
    );
    return res.status(400).render('jobs/form', {
      title      : 'Post a Job',
      job        : req.body,
      companies,
      errors,
      formAction : '/jobs',
      method     : 'POST'
    });
  }

  try {
    const { company_id, title, description, salary, deadline } = req.body;
    const salaryValue = salary && salary.trim() !== '' ? parseFloat(salary) : null;

    await pool.query(
      `INSERT INTO Jobs (company_id, title, description, salary, deadline, status)
       VALUES (?, ?, ?, ?, ?, 'Open')`,
      [company_id, title.trim(), (description || '').trim(), salaryValue, deadline]
    );
    res.redirect('/jobs');
  } catch (err) {
    if (err.code === 'ER_SIGNAL_EXCEPTION') {
      const [companies] = await pool.query(
        'SELECT company_id, company_name FROM Companies ORDER BY company_name ASC'
      );
      return res.status(400).render('jobs/form', {
        title      : 'Post a Job',
        job        : req.body,
        companies,
        errors     : [err.sqlMessage],
        formAction : '/jobs',
        method     : 'POST'
      });
    }
    next(err);
  }
};

exports.show = async (req, res, next) => {
  try {
    const [jobs] = await pool.query(
      `SELECT j.*, c.company_name, c.location, c.email AS company_email
       FROM   Jobs j
       JOIN   Companies c ON j.company_id = c.company_id
       WHERE  j.job_id = ?`,
      [req.params.id]
    );
    if (jobs.length === 0) {
      return res.status(404).render('error', {
        title   : 'Not Found',
        message : 'Job not found.',
        status  : 404
      });
    }

    const [applicantResult] = await pool.query(
      'CALL sp_get_job_applicants(?)',
      [req.params.id]
    );
    const applicants = applicantResult[0];

    res.render('jobs/show', {
      title    : jobs[0].title,
      job      : jobs[0],
      applicants
    });
  } catch (err) {
    next(err);
  }
};

exports.editForm = async (req, res, next) => {
  try {
    const [jobs] = await pool.query(
      'SELECT * FROM Jobs WHERE job_id = ?',
      [req.params.id]
    );
    if (jobs.length === 0) {
      return res.status(404).render('error', {
        title   : 'Not Found',
        message : 'Job not found.',
        status  : 404
      });
    }
    const [companies] = await pool.query(
      'SELECT company_id, company_name FROM Companies ORDER BY company_name ASC'
    );
    res.render('jobs/form', {
      title      : 'Edit Job',
      job        : jobs[0],
      companies,
      errors     : [],
      formAction : `/jobs/${req.params.id}?_method=PUT`,
      method     : 'POST'
    });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  const errors = validateJob(req.body);
  const id = req.params.id;

  if (errors.length > 0) {
    const [companies] = await pool.query(
      'SELECT company_id, company_name FROM Companies ORDER BY company_name ASC'
    );
    return res.status(400).render('jobs/form', {
      title      : 'Edit Job',
      job        : { ...req.body, job_id: id },
      companies,
      errors,
      formAction : `/jobs/${id}?_method=PUT`,
      method     : 'POST'
    });
  }

  try {
    const { company_id, title, description, salary, deadline, status } = req.body;
    const salaryValue = salary && salary.trim() !== '' ? parseFloat(salary) : null;
    const jobStatus   = ['Open', 'Closed'].includes(status) ? status : 'Open';

    const [result] = await pool.query(
      `UPDATE Jobs
       SET    company_id = ?, title = ?, description = ?,
              salary = ?, deadline = ?, status = ?
       WHERE  job_id = ?`,
      [company_id, title.trim(), (description || '').trim(),
       salaryValue, deadline, jobStatus, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).render('error', {
        title   : 'Not Found',
        message : 'Job not found.',
        status  : 404
      });
    }
    res.redirect('/jobs');
  } catch (err) {
    if (err.code === 'ER_SIGNAL_EXCEPTION') {
      const [companies] = await pool.query(
        'SELECT company_id, company_name FROM Companies ORDER BY company_name ASC'
      );
      return res.status(400).render('jobs/form', {
        title      : 'Edit Job',
        job        : { ...req.body, job_id: id },
        companies,
        errors     : [err.sqlMessage],
        formAction : `/jobs/${id}?_method=PUT`,
        method     : 'POST'
      });
    }
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM Jobs WHERE job_id = ?',
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).render('error', {
        title   : 'Not Found',
        message : 'Job not found.',
        status  : 404
      });
    }
    res.redirect('/jobs');
  } catch (err) {
    next(err);
  }
};
