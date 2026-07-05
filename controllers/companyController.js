const pool = require('../config/db');
const { validateCompany } = require('../middleware/validators');

exports.list = async (req, res, next) => {
  try {
    const [companies] = await pool.query(`
      SELECT c.*,
             COUNT(j.job_id) AS job_count
      FROM   Companies c
      LEFT JOIN Jobs j ON c.company_id = j.company_id
      GROUP  BY c.company_id
      ORDER  BY c.company_name ASC
    `);
    res.render('companies/list', { title: 'Companies', companies });
  } catch (err) {
    next(err);
  }
};

exports.newForm = (_req, res) => {
  res.render('companies/form', {
    title      : 'Add Company',
    company    : {},
    errors     : [],
    formAction : '/companies',
    method     : 'POST'
  });
};

exports.create = async (req, res, next) => {
  const errors = validateCompany(req.body);

  if (errors.length > 0) {
    return res.status(400).render('companies/form', {
      title      : 'Add Company',
      company    : req.body,
      errors,
      formAction : '/companies',
      method     : 'POST'
    });
  }

  try {
    const { company_name, email, location } = req.body;
    await pool.query(
      'INSERT INTO Companies (company_name, email, location) VALUES (?, ?, ?)',
      [company_name.trim(), email.trim().toLowerCase(), location.trim()]
    );
    res.redirect('/companies');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).render('companies/form', {
        title      : 'Add Company',
        company    : req.body,
        errors     : ['A company with this email address is already registered.'],
        formAction : '/companies',
        method     : 'POST'
      });
    }
    next(err);
  }
};

exports.show = async (req, res, next) => {
  try {
    const [companies] = await pool.query(
      'SELECT * FROM Companies WHERE company_id = ?',
      [req.params.id]
    );
    if (companies.length === 0) {
      return res.status(404).render('error', {
        title   : 'Not Found',
        message : 'Company not found.',
        status  : 404
      });
    }

    const [jobs] = await pool.query(
      `SELECT j.*,
              COUNT(a.application_id) AS applicant_count
       FROM   Jobs j
       LEFT JOIN Applications a ON j.job_id = a.job_id
       WHERE  j.company_id = ?
       GROUP  BY j.job_id
       ORDER  BY j.posted_at DESC`,
      [req.params.id]
    );

    res.render('companies/show', {
      title   : companies[0].company_name,
      company : companies[0],
      jobs
    });
  } catch (err) {
    next(err);
  }
};

exports.editForm = async (req, res, next) => {
  try {
    const [companies] = await pool.query(
      'SELECT * FROM Companies WHERE company_id = ?',
      [req.params.id]
    );
    if (companies.length === 0) {
      return res.status(404).render('error', {
        title   : 'Not Found',
        message : 'Company not found.',
        status  : 404
      });
    }
    res.render('companies/form', {
      title      : 'Edit Company',
      company    : companies[0],
      errors     : [],
      formAction : `/companies/${req.params.id}?_method=PUT`,
      method     : 'POST'
    });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  const errors = validateCompany(req.body);
  const id = req.params.id;

  if (errors.length > 0) {
    return res.status(400).render('companies/form', {
      title      : 'Edit Company',
      company    : { ...req.body, company_id: id },
      errors,
      formAction : `/companies/${id}?_method=PUT`,
      method     : 'POST'
    });
  }

  try {
    const { company_name, email, location } = req.body;
    const [result] = await pool.query(
      'UPDATE Companies SET company_name = ?, email = ?, location = ? WHERE company_id = ?',
      [company_name.trim(), email.trim().toLowerCase(), location.trim(), id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).render('error', {
        title   : 'Not Found',
        message : 'Company not found.',
        status  : 404
      });
    }
    res.redirect('/companies');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).render('companies/form', {
        title      : 'Edit Company',
        company    : { ...req.body, company_id: id },
        errors     : ['A company with this email address is already registered.'],
        formAction : `/companies/${id}?_method=PUT`,
        method     : 'POST'
      });
    }
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM Companies WHERE company_id = ?',
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).render('error', {
        title   : 'Not Found',
        message : 'Company not found.',
        status  : 404
      });
    }
    res.redirect('/companies');
  } catch (err) {
    next(err);
  }
};
